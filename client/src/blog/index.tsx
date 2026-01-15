import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogCard, BlogHero, BlogSearch } from "./components";
import { ArrowRight, Rss, Tag, Sparkles, TrendingUp, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string;
  authorAvatarUrl?: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  viewCount?: number;
  wordCount?: number;
  readingTimeMinutes?: number;
  tags?: string[];
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface TagWithCount {
  name: string;
  count: number;
}

export default function BlogIndex() {
  useSEO({
    title: "TypeMasterAI Blog | Guides, Tips, and Product Updates",
    description: "Professional articles on typing, productivity, learning, and product updates. Improve your typing speed with expert tips and guides.",
    keywords: "typing blog, productivity tips, typing guides, learning, updates, typing speed improvement",
    canonical: "/blog",
    ogUrl: "/blog",
  });

  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch featured post
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/blog/featured?limit=1");
        if (res.ok) {
          const data = await res.json();
          if (data.posts?.[0]) {
            setFeaturedPost(data.posts[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured post:", err);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch popular posts
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch("/api/blog/popular?limit=4");
        if (res.ok) {
          const data = await res.json();
          setPopularPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch popular posts:", err);
      }
    };
    fetchPopular();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/blog/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/blog/tags");
        if (res.ok) {
          const data = await res.json();
          setTags(data.tags || []);
        }
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    };
    fetchTags();
  }, []);

  // Fetch posts
  useEffect(() => {
    const controller = new AbortController();
    const fetchPosts = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "9");
        if (categoryFilter) params.set("category", categoryFilter);

        const res = await fetch(`/api/blog/posts?${params}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const newPosts = (data.posts || []).filter((p: BlogPost) => p.status === "published");

          if (page === 1) {
            // Filter out featured post from regular list
            setPosts(featuredPost
              ? newPosts.filter((p: BlogPost) => p.id !== featuredPost.id)
              : newPosts
            );
          } else {
            setPosts(prev => [...prev, ...newPosts.filter((p: BlogPost) =>
              !prev.find(existing => existing.id === p.id) && p.id !== featuredPost?.id
            )]);
          }

          setTotalPages(data.pagination?.totalPages || 1);
          setHasMore(page < (data.pagination?.totalPages || 1));
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Failed to fetch posts:", err);
        }
      }

      setLoading(false);
      setLoadingMore(false);
    };

    fetchPosts();
    return () => controller.abort();
  }, [page, categoryFilter, featuredPost]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(prev => prev + 1);
      }
    }, { rootMargin: "200px" });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const handleCategoryFilter = (slug: string | null) => {
    setCategoryFilter(slug);
    setPage(1);
    setPosts([]);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">TypeMasterAI Blog</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text">
                Insights & Guides
              </h1>
              <p className="text-muted-foreground mt-4 text-lg lg:text-xl leading-relaxed">
                Expert articles, practical tips, and in-depth guides to help you master typing and boost your productivity.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <BlogSearch className="w-full sm:w-72" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-10">
            <Button
              variant={categoryFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(null)}
              className={cn(
                "rounded-full transition-all",
                categoryFilter === null && "shadow-md"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              All Articles
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter(cat.slug)}
                className={cn(
                  "rounded-full transition-all",
                  categoryFilter === cat.slug && "shadow-md"
                )}
              >
                {cat.name}
              </Button>
            ))}
            <Link href="/blog/tags">
              <Button variant="ghost" size="sm" className="rounded-full gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Browse Tags
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Featured Post */}
        {featuredPost && !categoryFilter && page === 1 && (
          <section className="mb-16">
            <BlogHero post={featuredPost} />
          </section>
        )}

        {/* Main Content Grid */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          {/* Posts List */}
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Latest Articles
              </h2>
              {totalPages > 1 && (
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-24 text-center bg-muted/30 rounded-2xl border border-dashed">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're working on great content. Check back soon for new articles!
                </p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {posts.map(post => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="flex justify-center py-12">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading more articles...</span>
                    </div>
                  </div>
                )}

                {/* Load more button (fallback) */}
                {hasMore && !loadingMore && (
                  <div className="flex justify-center mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPage(prev => prev + 1)}
                      className="group rounded-full px-8"
                    >
                      Load More Articles
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1 w-full" />
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div className="bg-muted/30 rounded-2xl p-6 border">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Trending
                </h3>
                <div className="space-y-1">
                  {popularPosts.slice(0, 5).map((post, idx) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="group flex gap-4 py-3 hover:bg-background/50 px-3 -mx-3 rounded-lg transition-colors">
                        <span className="text-2xl font-bold text-muted-foreground/50 group-hover:text-primary transition-colors">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            {post.readingTimeMinutes && (
                              <span>{post.readingTimeMinutes} min read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Cloud */}
            {tags.length > 0 && (
              <div className="bg-muted/30 rounded-2xl p-6 border">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                  <Tag className="h-4 w-4 text-primary" />
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 15).map(tag => (
                    <Link key={tag.name} href={`/blog/tag/${tag.name}`}>
                      <Badge 
                        variant="secondary" 
                        className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        #{tag.name}
                        <span className="ml-1.5 text-xs opacity-60">({tag.count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Link href="/blog/tags" className="block mt-4">
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    View All Tags
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Newsletter CTA - Removed */}
          </aside>
        </div>
      </div>
    </div>
  );
}
