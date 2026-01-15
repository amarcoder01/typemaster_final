# TypeMasterAI Blog System

## Overview
A production-ready, modular blog system with a professional admin dashboard, beautiful public UI, SEO optimization, and comprehensive analytics.

## Features

### Public Blog
- **Featured Posts Hero** - Highlight important articles with prominent display
- **Grid Layout** - Modern responsive card-based article listing
- **Category Filtering** - Browse posts by category
- **Tag System** - Organize content with tags
- **Full-text Search** - Find articles quickly
- **Reading Progress** - Visual indicator of scroll progress
- **Table of Contents** - Auto-generated from headings
- **Social Sharing** - Twitter, LinkedIn, copy link
- **Related Posts** - Tag-based and content-similarity matching
- **View Counts** - Track article popularity
- **RSS/Atom Feeds** - Subscribe to updates

### Admin Dashboard
- **Post Management** - Create, edit, delete with bulk actions
- **Rich Markdown Editor** - Toolbar with formatting shortcuts
- **Live Preview** - Side-by-side editing and preview
- **Slug Auto-generation** - From title, editable
- **SEO Preview** - Google SERP simulation
- **Scheduled Publishing** - Set future publish dates
- **Featured Posts** - Mark posts as featured with ordering
- **Category Management** - Hierarchical categories with colors
- **Tag Management** - Easy tag creation and assignment
- **Draft Autosave** - Every 30 seconds for drafts

### SEO
- **Meta Tags** - Custom title and description per post
- **JSON-LD** - BlogPosting schema for rich snippets
- **Open Graph** - Social media preview optimization
- **Canonical URLs** - Proper URL handling
- **Sitemap** - Dynamic blog sitemap with images

## Structure

```
client/src/blog/          # Public blog pages
  ├── index.tsx           # Blog home with featured hero
  ├── post.tsx            # Article detail page
  ├── tag.tsx             # Posts by tag
  ├── tags.tsx            # All tags listing
  └── components/         # Reusable components
      ├── BlogCard.tsx
      ├── BlogHero.tsx
      ├── BlogSearch.tsx
      ├── AuthorCard.tsx
      ├── ShareButtons.tsx
      ├── TableOfContents.tsx
      └── ReadingProgress.tsx

client/src/blog-admin/    # Admin dashboard
  ├── index.tsx           # Main admin page
  └── components/
      ├── BlogPostList.tsx
      ├── BlogPostEditor.tsx
      └── SEOPreview.tsx

server/blog/              # Backend
  ├── blog-routes.ts      # API endpoints
  └── config.ts           # Centralized configuration

shared/schema.ts          # Database models (blog_posts, blog_categories, etc.)
```

## URLs

### Public
- `/blog` - Blog home
- `/blog/:slug` - Article detail
- `/blog/tag/:slug` - Posts by tag
- `/blog/tags` - All tags
- `/blog/rss.xml` - RSS feed
- `/blog/atom.xml` - Atom feed

### Admin
- `/admin/blog` - Dashboard (requires admin role)
- `/admin/blog/new` - Create new post
- `/admin/blog/edit/:id` - Edit existing post

## API Endpoints

### Public
- `GET /api/blog/posts` - List published posts (paginated)
- `GET /api/blog/post/:slug` - Get single post
- `GET /api/blog/featured` - Get featured posts
- `GET /api/blog/popular` - Get popular posts
- `GET /api/blog/categories` - Get all categories
- `GET /api/blog/tags` - Get all tags with counts
- `POST /api/blog/post/:slug/view` - Record view

### Admin
- `GET /api/admin/blog` - Check admin access
- `GET /api/admin/blog/posts` - List all posts (including drafts)
- `GET /api/admin/blog/post/:id` - Get post by ID
- `POST /api/admin/blog/post` - Create post
- `PUT /api/admin/blog/post/:id` - Update post
- `DELETE /api/admin/blog/post/:id` - Delete post
- `POST /api/admin/blog/bulk-action` - Bulk actions
- `GET /api/admin/blog/categories` - List categories
- `POST /api/admin/blog/category` - Create category
- `PUT /api/admin/blog/category/:id` - Update category
- `DELETE /api/admin/blog/category/:id` - Delete category

## Data Model

### blog_posts
- `id`, `slug`, `title`, `excerpt`, `contentMd`
- `coverImageUrl`, `authorId`, `authorName`, `authorBio`, `authorAvatarUrl`
- `metaTitle`, `metaDescription` (SEO)
- `categoryId`, `status` (draft/review/scheduled/published)
- `scheduledAt`, `publishedAt`, `updatedAt`, `createdAt`
- `viewCount`, `isFeatured`, `featuredOrder`

### blog_categories
- `id`, `name`, `slug`, `description`
- `parentId`, `color`, `icon`, `sortOrder`, `isActive`

### blog_tags, blog_post_tags
- Many-to-many relationship for tagging

### blog_post_views
- Analytics tracking for individual views

## Configuration

All configuration is centralized in `server/blog/config.ts` with environment variable overrides:

```
BLOG_DEFAULT_AUTHOR       - Default author name
BLOG_POSTS_PER_PAGE       - Posts per page (default: 10)
BLOG_CACHE_TTL_MS         - Cache duration (default: 60000)
BLOG_ENABLE_COMMENTS      - Enable comments (default: false)
BLOG_ENABLE_NEWSLETTER    - Show newsletter CTA (default: true)
BLOG_ENABLE_VIEW_TRACKING - Track views (default: true)
BLOG_ENABLE_SCHEDULED     - Scheduled publishing (default: true)
BLOG_RSS_MAX_ITEMS        - RSS feed items (default: 50)
BLOG_POPULAR_POSTS_DAYS   - Popular posts window (default: 30)
BLOG_SITE_URL             - Site URL for feeds/sitemaps
```

## Security

- Admin routes require `admin` or `super_admin` role
- RBAC middleware protects all admin endpoints
- Rate limiting on admin actions
- DOMPurify sanitization on user input
- Audit logging for all admin actions
- CSRF protection via existing middleware

## Removal

To remove the blog system:
1. Delete `client/src/blog`, `client/src/blog-admin`
2. Delete `server/blog`
3. Remove router entries in `client/src/App.tsx`
4. Remove blog routes from `server/routes.ts`
5. Optionally drop `blog_*` tables from database
