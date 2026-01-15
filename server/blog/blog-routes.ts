import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import DOMPurify from "isomorphic-dompurify";
import { insertBlogPostSchema, insertBlogCategorySchema } from "@shared/schema";
import { validateBlogContent, processBlogContent } from "@shared/blog-processor";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { extractDeviceInfo } from "../auth-security";
import { fromError } from "zod-validation-error";
import { requireRole } from "../rbac";
import { blogConfig } from "./config";

const requireAdmin = requireRole(["admin", "super_admin"]);

// Rate limiter for view tracking (prevent abuse)
const viewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 views per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// CACHE MANAGER - Production-ready in-memory cache with stats
// ============================================================================

interface CacheEntry {
  expiry: number;
  data: any;
  hits: number;
  createdAt: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

class BlogCacheManager {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private maxSize = 1000; // Maximum cache entries

  set(key: string, data: any, ttlMs: number = blogConfig.cacheTtlMs): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      expiry: Date.now() + ttlMs,
      data,
      hits: 0,
      createdAt: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  // Cleanup expired entries (run periodically)
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

const blogCache = new BlogCacheManager();

// Run cleanup every 5 minutes
setInterval(() => {
  const cleaned = blogCache.cleanup();
  if (cleaned > 0) {
    console.log(`[BlogCache] Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

// Legacy compatibility functions
function setCache(key: string, data: any, ttlMs: number) {
  blogCache.set(key, data, ttlMs);
}
function getCache(key: string): any | null {
  return blogCache.get(key);
}
const cache = {
  delete: (key: string) => blogCache.delete(key),
  clear: () => blogCache.clear(),
};

// RBAC handled by requireAdmin middleware

export function createBlogRoutes(app: Express) {
  const adminBlogLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.get("/api/blog/posts", async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
    const afterRaw = typeof req.query.after === "string" ? String(req.query.after) : undefined;
    const after = afterRaw ? new Date(afterRaw) : undefined;
    const tagSlugs = typeof req.query.tag === "string"
      ? String(req.query.tag).split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : undefined;
    try {
      const cacheKey = `list:${page}:${limit}:${afterRaw || ''}:${(tagSlugs || []).join(",")}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      if (afterRaw) {
        const posts = await storage.getPublishedBlogPostsCursor({ limit, after, tagSlugs });
        const postsWithTags = await Promise.all(posts.map(async p => {
          const wc = countWords(p.contentMd || "");
          const rt = Math.max(1, Math.ceil(wc / 200));
          const postTags = await storage.getTagsForBlogPost(p.id);
          return { ...p, wordCount: wc, readingTimeMinutes: rt, tags: postTags };
        }));
        const payload = {
          posts: postsWithTags,
          pagination: { page, limit, total: null, totalPages: null },
          nextCursor: posts.length ? (posts[posts.length - 1].publishedAt || posts[posts.length - 1].createdAt) : null
        };
        setCache(cacheKey, payload, 60_000);
        return res.json(payload);
      }
      const data = await storage.getPublishedBlogPosts({ page, limit, tagSlugs });
      const postsWithTags = await Promise.all(data.posts.map(async p => {
        const { content } = processBlogContent(p.contentMd || "");
        const wc = countWords(content);
        const rt = Math.max(1, Math.ceil(wc / 200));
        const postTags = await storage.getTagsForBlogPost(p.id);
        return { ...p, contentMd: content, wordCount: wc, readingTimeMinutes: rt, tags: postTags };
      }));
      const payload = {
        posts: postsWithTags,
        pagination: { page, limit, total: data.total, totalPages: Math.ceil(data.total / limit) },
        nextCursor: data.posts.length ? (data.posts[data.posts.length - 1].publishedAt || data.posts[data.posts.length - 1].createdAt) : null
      };
      setCache(cacheKey, payload, 60_000);
      res.json(payload);
    } catch (e) {
      res.status(500).json({ message: "Failed to load posts" });
    }
  });

  app.get("/api/blog/post/:slug", async (req, res) => {
    try {
      const cacheKey = `post:${req.params.slug}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || post.status !== "published") {
        return res.status(404).json({ message: "Not found" });
      }
      const [related, tags] = await Promise.all([
        storage.getRelatedBlogPosts(req.params.slug, 4),
        storage.getTagsForBlogPost(post.id)
      ]);
      const { content } = processBlogContent(post.contentMd || "");
      const wordCount = countWords(content);
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      const payload = { post: { ...post, contentMd: content, wordCount, readingTimeMinutes, tags }, related };
      setCache(cacheKey, payload, 60_000);
      res.json(payload);
    } catch {
      res.status(500).json({ message: "Failed to load post" });
    }
  });

  app.get("/api/blog/recent", async (_req, res) => {
    try {
      const posts = await storage.getRecentPublishedBlogPosts(5);
      res.json({ posts });
    } catch {
      res.status(500).json({ message: "Failed to load recent" });
    }
  });

  app.get("/api/blog/tags", async (_req, res) => {
    try {
      const tags = await storage.getAllBlogTagsWithCounts();
      res.json({ tags });
    } catch {
      res.status(500).json({ message: "Failed to load tags" });
    }
  });

  app.get("/blog/rss.xml", async (_req, res) => {
    try {
      const cached = getCache("rss");
      if (cached) {
        res.set('Content-Type', 'application/rss+xml');
        return res.send(cached);
      }
      const posts = await storage.getRecentPublishedBlogPosts(50);
      const items = posts.map((p) => `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>https://typemasterai.com/blog/${p.slug}</link>
    <guid>https://typemasterai.com/blog/${p.slug}</guid>
    <description>${escapeXml(p.excerpt || '')}</description>
    <pubDate>${new Date(p.publishedAt || p.createdAt as any).toUTCString()}</pubDate>
  </item>`).join('\n');
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TypeMasterAI Blog</title>
    <link>https://typemasterai.com/blog</link>
    <description>Articles from TypeMasterAI</description>
${items}
  </channel>
</rss>`;
      setCache("rss", rss, 60_000);
      res.set('Content-Type', 'application/rss+xml');
      res.send(rss);
    } catch (error) {
      res.status(500).send('Error generating RSS');
    }
  });

  app.get("/blog/atom.xml", async (_req, res) => {
    try {
      const cached = getCache("atom");
      if (cached) {
        res.set('Content-Type', 'application/atom+xml');
        return res.send(cached);
      }
      const posts = await storage.getRecentPublishedBlogPosts(50);
      const entries = posts.map((p) => `
  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="https://typemasterai.com/blog/${p.slug}" />
    <id>https://typemasterai.com/blog/${p.slug}</id>
    <updated>${new Date(p.updatedAt as any).toISOString()}</updated>
    <summary>${escapeXml(p.excerpt || '')}</summary>
  </entry>`).join('\n');
      const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>TypeMasterAI Blog</title>
  <link href="https://typemasterai.com/blog" />
  <updated>${new Date().toISOString()}</updated>
  <id>https://typemasterai.com/blog</id>
${entries}
</feed>`;
      setCache("atom", atom, 60_000);
      res.set('Content-Type', 'application/atom+xml');
      res.send(atom);
    } catch {
      res.status(500).send('Error generating Atom feed');
    }
  });

  app.post("/api/admin/blog/post", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const parsed = insertBlogPostSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorDetails = fromError(parsed.error).toString();
        console.error('[Blog] Validation error on create:', errorDetails);
        return res.status(400).json({
          message: "Validation failed",
          error: errorDetails,
          fields: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      const sanitized = {
        ...parsed.data,
        title: DOMPurify.sanitize(parsed.data.title),
        excerpt: parsed.data.excerpt ? DOMPurify.sanitize(parsed.data.excerpt) : null,
      };
      const tags = Array.isArray((req.body as any).tags) ? (req.body as any).tags : [];

      // Validation check for publishing
      if (sanitized.status === "published") {
        const { isValid, issues } = validateBlogContent(sanitized.contentMd, sanitized.metaDescription || sanitized.excerpt || undefined);
        if (!isValid) {
          const errors = issues.filter(i => i.type === "error").map(i => i.message).join("; ");
          return res.status(400).json({ message: "Validation failed: " + errors, error: "validation_failed" });
        }
      }

      // Check for duplicate slug
      const existing = await storage.getBlogPostBySlug(sanitized.slug);
      if (existing) {
        return res.status(409).json({
          message: "A post with this URL slug already exists",
          error: "duplicate_slug",
          field: "slug"
        });
      }

      const created = await storage.createBlogPost({ ...sanitized, tags });
      cache.clear();
      const device = extractDeviceInfo(req);
      await storage.createAuditLog({
        eventType: 'blog_post_create',
        userId: (req.user as any)?.id || null,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        deviceFingerprint: device.fingerprint,
        provider: null,
        success: true,
        failureReason: null,
        metadata: { id: (created as any).id, slug: created.slug },
      });
      res.json({ post: created });
    } catch (err) {
      console.error('[Blog] Error creating post:', err);
      const message = err instanceof Error ? err.message : "Failed to create post";
      res.status(500).json({ message, error: "server_error" });
    }
  });

  app.get("/api/admin/blog", requireAdmin, async (_req, res) => {
    res.json({ isAdmin: true });
  });

  app.put("/api/admin/blog/post/:id", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid post ID", error: "invalid_id" });
      }

      // Check post exists
      const existingPost = await storage.getBlogPostById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found", error: "not_found" });
      }

      const updates: any = {};
      if (typeof req.body.title === "string") {
        const title = req.body.title.trim();
        if (title.length < 3) {
          return res.status(400).json({ message: "Title must be at least 3 characters", error: "validation", field: "title" });
        }
        updates.title = DOMPurify.sanitize(title);
      }
      if (typeof req.body.slug === "string") {
        const slug = req.body.slug.toLowerCase().trim();
        if (slug.length < 3) {
          return res.status(400).json({ message: "Slug must be at least 3 characters", error: "validation", field: "slug" });
        }
        // Check for duplicate slug (but allow same slug for same post)
        const slugExists = await storage.getBlogPostBySlug(slug);
        if (slugExists && slugExists.id !== id) {
          return res.status(409).json({ message: "A post with this URL slug already exists", error: "duplicate_slug", field: "slug" });
        }
        updates.slug = slug;
      }
      if (typeof req.body.excerpt === "string") updates.excerpt = DOMPurify.sanitize(req.body.excerpt) || null;
      if (typeof req.body.contentMd === "string") {
        if (req.body.contentMd.length < 20) {
          return res.status(400).json({ message: "Content must be at least 20 characters", error: "validation", field: "contentMd" });
        }
        updates.contentMd = req.body.contentMd;
      }
      if (typeof req.body.coverImageUrl === "string") updates.coverImageUrl = req.body.coverImageUrl || null;
      if (typeof req.body.authorName === "string") updates.authorName = DOMPurify.sanitize(req.body.authorName);
      if (typeof req.body.authorBio === "string") updates.authorBio = DOMPurify.sanitize(req.body.authorBio) || null;
      if (typeof req.body.authorAvatarUrl === "string") updates.authorAvatarUrl = req.body.authorAvatarUrl || null;
      if (typeof req.body.metaTitle === "string") updates.metaTitle = DOMPurify.sanitize(req.body.metaTitle) || null;
      if (typeof req.body.metaDescription === "string") updates.metaDescription = DOMPurify.sanitize(req.body.metaDescription) || null;
      if (typeof req.body.categoryId === "number" || req.body.categoryId === null) updates.categoryId = req.body.categoryId;
      if (typeof req.body.status === "string") {
        const validStatuses = ["draft", "review", "scheduled", "published"];
        if (!validStatuses.includes(req.body.status)) {
          return res.status(400).json({ message: "Invalid status", error: "validation", field: "status" });
        }
        updates.status = req.body.status;
      }
      if (req.body.publishedAt !== undefined) {
        updates.publishedAt = req.body.publishedAt ? new Date(req.body.publishedAt) : null;
      }
      if (req.body.scheduledAt !== undefined) {
        updates.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
      }
      if (typeof req.body.isFeatured === "boolean") updates.isFeatured = req.body.isFeatured;
      if (typeof req.body.featuredOrder === "number" || req.body.featuredOrder === null) updates.featuredOrder = req.body.featuredOrder;

      // Validation check if publishing
      const finalStatus = updates.status || existingPost.status;
      const finalContent = updates.contentMd || existingPost.contentMd;
      const finalMeta = updates.metaDescription || existingPost.metaDescription || updates.excerpt || existingPost.excerpt;

      if (finalStatus === "published") {
        const { isValid, issues } = validateBlogContent(finalContent, finalMeta || undefined);
        if (!isValid) {
          const errors = issues.filter(i => i.type === "error").map(i => i.message).join("; ");
          return res.status(400).json({ message: "Validation failed: " + errors, error: "validation_failed" });
        }
      }

      const tags = Array.isArray(req.body.tags) ? req.body.tags : undefined;
      const updated = await storage.updateBlogPost(id, { ...updates, tags });
      if (!updated) {
        return res.status(500).json({ message: "Failed to update post", error: "update_failed" });
      }

      cache.clear();
      const device = extractDeviceInfo(req);
      await storage.createAuditLog({
        eventType: 'blog_post_update',
        userId: (req.user as any)?.id || null,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        deviceFingerprint: device.fingerprint,
        provider: null,
        success: true,
        failureReason: null,
        metadata: { id, slug: updated.slug },
      });
      res.json({ post: updated });
    } catch (err) {
      console.error('[Blog] Error updating post:', err);
      const message = err instanceof Error ? err.message : "Failed to update post";
      res.status(500).json({ message, error: "server_error" });
    }
  });

  app.delete("/api/admin/blog/post/:id", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteBlogPost(id);
      cache.clear();
      const device = extractDeviceInfo(req);
      await storage.createAuditLog({
        eventType: 'blog_post_delete',
        userId: (req.user as any)?.id || null,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        deviceFingerprint: device.fingerprint,
        provider: null,
        success: true,
        failureReason: null,
        metadata: { id },
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // ============================================================================
  // NEW ENDPOINTS: Featured Posts
  // ============================================================================

  app.get("/api/blog/featured", async (req, res) => {
    try {
      const limit = Math.min(10, parseInt(String(req.query.limit || "3"), 10) || 3);
      const cacheKey = `featured:${limit}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const posts = await storage.getFeaturedBlogPosts(limit);
      const payload = {
        posts: posts.map(p => {
          const { content } = processBlogContent(p.contentMd || "");
          return {
            ...p,
            contentMd: content,
            wordCount: countWords(content),
            readingTimeMinutes: Math.max(1, Math.ceil(countWords(content) / blogConfig.wordsPerMinute)),
          };
        }),
      };
      setCache(cacheKey, payload, blogConfig.cacheTtlMs);
      res.json(payload);
    } catch {
      res.status(500).json({ message: "Failed to load featured posts" });
    }
  });

  // ============================================================================
  // NEW ENDPOINTS: Popular Posts
  // ============================================================================

  app.get("/api/blog/popular", async (req, res) => {
    try {
      const limit = Math.min(20, parseInt(String(req.query.limit || "5"), 10) || 5);
      const days = parseInt(String(req.query.days || blogConfig.popularPostsDays), 10);
      const cacheKey = `popular:${limit}:${days}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const posts = await storage.getPopularBlogPosts(limit, days);
      const payload = {
        posts: posts.map(p => {
          const { content } = processBlogContent(p.contentMd || "");
          return {
            ...p,
            contentMd: content,
            wordCount: countWords(content),
            readingTimeMinutes: Math.max(1, Math.ceil(countWords(content) / blogConfig.wordsPerMinute)),
          };
        }),
      };
      setCache(cacheKey, payload, blogConfig.cacheTtlMs);
      res.json(payload);
    } catch {
      res.status(500).json({ message: "Failed to load popular posts" });
    }
  });

  // ============================================================================
  // NEW ENDPOINTS: Categories
  // ============================================================================

  app.get("/api/blog/categories", async (_req, res) => {
    try {
      const cacheKey = "categories";
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const categories = await storage.getAllBlogCategories();
      const payload = { categories };
      setCache(cacheKey, payload, blogConfig.cacheTtlMs * 5); // Cache longer
      res.json(payload);
    } catch {
      res.status(500).json({ message: "Failed to load categories" });
    }
  });

  app.get("/api/blog/category/:slug", async (req, res) => {
    try {
      const category = await storage.getBlogCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ category });
    } catch {
      res.status(500).json({ message: "Failed to load category" });
    }
  });

  // ============================================================================
  // NEW ENDPOINTS: View Tracking
  // ============================================================================

  app.post("/api/blog/post/:slug/view", viewLimiter, async (req, res) => {
    if (!blogConfig.enableViewTracking) {
      return res.json({ success: true });
    }
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || post.status !== "published") {
        return res.status(404).json({ message: "Post not found" });
      }

      const device = extractDeviceInfo(req);
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id']?.toString() || null;

      await storage.recordBlogPostView({
        postId: post.id,
        userId: (req.user as any)?.id || null,
        sessionId,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        referrer: req.headers.referer || null,
      });

      // Clear post cache to update view count
      cache.delete(`post:${req.params.slug}`);

      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Categories Management
  // ============================================================================

  app.get("/api/admin/blog/categories", requireAdmin, async (_req, res) => {
    try {
      const categories = await storage.getAllBlogCategories();
      res.json({ categories });
    } catch {
      res.status(500).json({ message: "Failed to load categories" });
    }
  });

  app.post("/api/admin/blog/category", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const parsed = insertBlogCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", error: fromError(parsed.error).toString() });
      }
      const sanitized = {
        ...parsed.data,
        name: DOMPurify.sanitize(parsed.data.name),
        description: parsed.data.description ? DOMPurify.sanitize(parsed.data.description) : null,
      };
      const created = await storage.createBlogCategory(sanitized);
      cache.delete("categories");
      res.json({ category: created });
    } catch {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/blog/category/:id", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updates: any = {};
      if (typeof req.body.name === "string") updates.name = DOMPurify.sanitize(req.body.name);
      if (typeof req.body.slug === "string") updates.slug = req.body.slug;
      if (typeof req.body.description === "string") updates.description = DOMPurify.sanitize(req.body.description);
      if (typeof req.body.color === "string") updates.color = req.body.color;
      if (typeof req.body.icon === "string") updates.icon = req.body.icon;
      if (typeof req.body.sortOrder === "number") updates.sortOrder = req.body.sortOrder;
      if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;
      if (typeof req.body.parentId === "number" || req.body.parentId === null) updates.parentId = req.body.parentId;

      const updated = await storage.updateBlogCategory(id, updates);
      if (!updated) return res.status(404).json({ message: "Category not found" });
      cache.delete("categories");
      res.json({ category: updated });
    } catch {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/blog/category/:id", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteBlogCategory(id);
      cache.delete("categories");
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Posts List (with all statuses)
  // ============================================================================

  app.get("/api/admin/blog/posts", requireAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
      const status = typeof req.query.status === "string" ? req.query.status : undefined;

      const data = await storage.getAllBlogPosts({ page, limit, status });
      const payload = {
        posts: data.posts.map(p => ({
          ...p,
          wordCount: countWords(p.contentMd || ""),
          readingTimeMinutes: Math.max(1, Math.ceil(countWords(p.contentMd || "") / blogConfig.wordsPerMinute)),
        })),
        pagination: { page, limit, total: data.total, totalPages: Math.ceil(data.total / limit) },
      };
      res.json(payload);
    } catch {
      res.status(500).json({ message: "Failed to load posts" });
    }
  });

  app.get("/api/admin/blog/post/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const post = await storage.getBlogPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json({ post });
    } catch {
      res.status(500).json({ message: "Failed to load post" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Bulk Actions
  // ============================================================================

  app.post("/api/admin/blog/bulk-action", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const { action, postIds } = req.body;
      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ message: "No posts selected" });
      }

      const validActions = ["publish", "unpublish", "delete", "feature", "unfeature"];
      if (!validActions.includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      let updated = 0;
      for (const id of postIds) {
        try {
          if (action === "delete") {
            await storage.deleteBlogPost(id);
            updated++;
          } else if (action === "publish") {
            await storage.updateBlogPost(id, { status: "published", publishedAt: new Date() });
            updated++;
          } else if (action === "unpublish") {
            await storage.updateBlogPost(id, { status: "draft" });
            updated++;
          } else if (action === "feature") {
            await storage.updateBlogPost(id, { isFeatured: true });
            updated++;
          } else if (action === "unfeature") {
            await storage.updateBlogPost(id, { isFeatured: false });
            updated++;
          }
        } catch {
          // Continue with other posts
        }
      }

      cache.clear();
      const device = extractDeviceInfo(req);
      await storage.createAuditLog({
        eventType: `blog_bulk_${action}`,
        userId: (req.user as any)?.id || null,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        deviceFingerprint: device.fingerprint,
        provider: null,
        success: true,
        failureReason: null,
        metadata: { action, postIds, updated },
      });

      res.json({ success: true, updated });
    } catch {
      res.status(500).json({ message: "Failed to perform bulk action" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Post Preview (for drafts)
  // ============================================================================

  app.get("/api/admin/blog/preview/:slug", requireAdmin, async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const wordCount = countWords(post.contentMd || "");
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / blogConfig.wordsPerMinute));
      res.json({ post: { ...post, wordCount, readingTimeMinutes } });
    } catch {
      res.status(500).json({ message: "Failed to load preview" });
    }
  });

  // ============================================================================
  // SCHEDULED PUBLISHING
  // ============================================================================

  // This would typically be called by a cron job or background worker
  app.post("/api/admin/blog/publish-scheduled", requireAdmin, async (_req, res) => {
    if (!blogConfig.enableScheduledPublishing) {
      return res.json({ success: true, published: 0 });
    }
    try {
      const published = await storage.publishScheduledPosts();
      if (published > 0) {
        cache.clear();
      }
      res.json({ success: true, published });
    } catch {
      res.status(500).json({ message: "Failed to publish scheduled posts" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Cache Management
  // ============================================================================

  app.get("/api/admin/blog/cache/stats", requireAdmin, async (_req, res) => {
    try {
      const stats = blogCache.getStats();
      res.json({ stats });
    } catch {
      res.status(500).json({ message: "Failed to get cache stats" });
    }
  });

  app.post("/api/admin/blog/cache/clear", requireAdmin, async (_req, res) => {
    try {
      blogCache.clear();
      res.json({ success: true, message: "Cache cleared" });
    } catch {
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.post("/api/admin/blog/cache/warmup", requireAdmin, async (_req, res) => {
    try {
      await warmupBlogCache();
      res.json({ success: true, message: "Cache warmed up" });
    } catch {
      res.status(500).json({ message: "Failed to warmup cache" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Revision History
  // ============================================================================

  app.get("/api/admin/blog/post/:id/revisions", requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      if (isNaN(postId) || postId <= 0) {
        return res.status(400).json({ message: "Invalid post ID", error: "invalid_id" });
      }

      const limit = Math.min(50, parseInt(String(req.query.limit || "20"), 10) || 20);
      const revisions = await storage.getBlogPostRevisions(postId, limit);
      res.json({ revisions });
    } catch (err) {
      console.error('[Blog] Error fetching revisions:', err);
      res.status(500).json({ message: "Failed to load revisions" });
    }
  });

  app.post("/api/admin/blog/post/:id/revision", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      if (isNaN(postId) || postId <= 0) {
        return res.status(400).json({ message: "Invalid post ID", error: "invalid_id" });
      }

      const revision = await storage.createBlogPostRevision(postId);
      if (!revision) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ revision });
    } catch (err) {
      console.error('[Blog] Error creating revision:', err);
      res.status(500).json({ message: "Failed to create revision" });
    }
  });

  app.get("/api/admin/blog/revision/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid revision ID", error: "invalid_id" });
      }

      const revision = await storage.getBlogPostRevisionById(id);
      if (!revision) {
        return res.status(404).json({ message: "Revision not found" });
      }

      res.json({ revision });
    } catch (err) {
      console.error('[Blog] Error fetching revision:', err);
      res.status(500).json({ message: "Failed to load revision" });
    }
  });

  app.post("/api/admin/blog/revision/:id/restore", adminBlogLimiter, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid revision ID", error: "invalid_id" });
      }

      const post = await storage.restoreBlogPostRevision(id);
      if (!post) {
        return res.status(404).json({ message: "Revision not found" });
      }

      cache.clear();
      const device = extractDeviceInfo(req);
      await storage.createAuditLog({
        eventType: 'blog_post_revision_restore',
        userId: (req.user as any)?.id || null,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        deviceFingerprint: device.fingerprint,
        provider: null,
        success: true,
        failureReason: null,
        metadata: { revisionId: id, postId: post.id },
      });

      res.json({ post });
    } catch (err) {
      console.error('[Blog] Error restoring revision:', err);
      res.status(500).json({ message: "Failed to restore revision" });
    }
  });

  // ============================================================================
  // ADMIN ENDPOINTS: Blog Settings
  // ============================================================================

  app.get("/api/admin/blog/settings", requireAdmin, async (_req, res) => {
    try {
      res.json({
        settings: {
          siteUrl: blogConfig.siteUrl,
          siteName: blogConfig.siteName,
          defaultAuthorName: blogConfig.defaultAuthorName,
          defaultAuthorBio: blogConfig.defaultAuthorBio,
          postsPerPage: blogConfig.postsPerPage,
          maxFeaturedPosts: blogConfig.maxFeaturedPosts,
          cacheTtlMs: blogConfig.cacheTtlMs,
          wordsPerMinute: blogConfig.wordsPerMinute,
          enableComments: blogConfig.enableComments,
          enableNewsletterCta: blogConfig.enableNewsletterCta,
          enableViewTracking: blogConfig.enableViewTracking,
          enableScheduledPublishing: blogConfig.enableScheduledPublishing,
          defaultMetaDescription: blogConfig.defaultMetaDescription,
          defaultKeywords: blogConfig.defaultKeywords,
          rssMaxItems: blogConfig.rssMaxItems,
          popularPostsDays: blogConfig.popularPostsDays,
        }
      });
    } catch (err) {
      console.error('[Blog] Error fetching settings:', err);
      res.status(500).json({ message: "Failed to load settings" });
    }
  });
}

function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function countWords(md: string): number {
  const text = md.replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#*_>\-\[\]\(\)!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').length;
}

// Background job for scheduled publishing (call this from a cron or interval)
let scheduledPublishingInterval: NodeJS.Timeout | null = null;

export function startScheduledPublishing() {
  if (!blogConfig.enableScheduledPublishing) return;
  if (scheduledPublishingInterval) return;

  scheduledPublishingInterval = setInterval(async () => {
    try {
      const published = await storage.publishScheduledPosts();
      if (published > 0) {
        console.log(`[Blog] Published ${published} scheduled posts`);
      }
    } catch (err) {
      console.error('[Blog] Error publishing scheduled posts:', err);
    }
  }, blogConfig.scheduledCheckIntervalMs);

  console.log('[Blog] Scheduled publishing started');
}

export function stopScheduledPublishing() {
  if (scheduledPublishingInterval) {
    clearInterval(scheduledPublishingInterval);
    scheduledPublishingInterval = null;
  }
}

/**
 * Get cache statistics
 */
export function getBlogCacheStats(): CacheStats {
  return blogCache.getStats();
}

/**
 * Warm up the cache with popular content
 * Call this on server startup
 */
export async function warmupBlogCache(): Promise<void> {
  try {
    console.log('[BlogCache] Warming up cache...');

    // Preload featured posts
    const featured = await storage.getFeaturedBlogPosts(5);
    if (featured.length > 0) {
      blogCache.set('featured:5', { posts: featured }, blogConfig.cacheTtlMs * 2);
    }

    // Preload recent posts (first page)
    const recent = await storage.getPublishedBlogPosts({ page: 1, limit: 10 });
    blogCache.set('list:1:10:::', {
      posts: recent.posts.map(p => ({
        ...p,
        wordCount: countWords(p.contentMd || ''),
        readingTimeMinutes: Math.max(1, Math.ceil(countWords(p.contentMd || '') / blogConfig.wordsPerMinute)),
      })),
      pagination: { page: 1, limit: 10, total: recent.total, totalPages: Math.ceil(recent.total / 10) },
      nextCursor: recent.posts.length ? (recent.posts[recent.posts.length - 1].publishedAt || recent.posts[recent.posts.length - 1].createdAt) : null
    }, blogConfig.cacheTtlMs * 2);

    // Preload categories
    const categories = await storage.getAllBlogCategories();
    blogCache.set('categories', { categories }, blogConfig.cacheTtlMs * 5);

    // Preload popular posts
    const popular = await storage.getPopularBlogPosts(5, blogConfig.popularPostsDays);
    blogCache.set(`popular:5:${blogConfig.popularPostsDays}`, { posts: popular }, blogConfig.cacheTtlMs * 2);

    console.log('[BlogCache] Cache warmed up with featured, recent, categories, and popular posts');
  } catch (err) {
    console.error('[BlogCache] Error warming up cache:', err);
  }
}

/**
 * Invalidate cache for a specific post
 */
export function invalidatePostCache(slug: string): void {
  blogCache.delete(`post:${slug}`);
  blogCache.invalidatePattern('list:');
  blogCache.invalidatePattern('featured:');
  blogCache.invalidatePattern('popular:');
}
