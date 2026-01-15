import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: string | null;
  wordCount?: number;
  readingTimeMinutes?: number;
  tags?: string[];
}

function formatTagName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function BlogTagPage() {
  const [, params] = useRoute("/blog/tag/:slug");
  const slug = params?.slug || "";
  const tagName = formatTagName(slug);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: `${tagName} Articles | TypeMasterAI Blog`,
    description: `Explore articles about ${tagName} on the TypeMasterAI Blog. Tips, guides, and insights to improve your typing skills.`,
    keywords: `typing blog, ${tagName}, ${slug}`,
    canonical: `/blog/tag/${slug}`,
    ogUrl: `/blog/tag/${slug}`,
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchPosts = async () => {
      setLoading(true);
      const res = await fetch(`/api/blog/posts?tag=${encodeURIComponent(slug)}&page=1&limit=20`, { signal: controller.signal });
      if (!res.ok) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setLoading(false);
    };
    if (slug) fetchPosts();
    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tagName}</h1>
        </div>
        <p className="text-muted-foreground">
          {posts.length} {posts.length === 1 ? 'article' : 'articles'} tagged with "{tagName}"
        </p>
      </div>

      {/* Posts Grid */}
      <div className="space-y-5">
        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold mb-2">No articles found</h2>
            <p className="text-muted-foreground mb-4">
              There are no published articles with this tag yet.
            </p>
            <Link href="/blog">
              <Button variant="outline">Browse all articles</Button>
            </Link>
          </Card>
        ) : (
          posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5">
                <div className="flex flex-col sm:flex-row">
                  {post.coverImageUrl && (
                    <div className="sm:w-48 h-40 sm:h-auto overflow-hidden flex-shrink-0">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-5">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.tags.slice(0, 3).map(tag => (
                          <Badge 
                            key={tag} 
                            variant={tag === slug ? "default" : "outline"} 
                            className="text-[10px] px-2 py-0.5"
                          >
                            {formatTagName(tag)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.authorName}
                      </span>
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      )}
                      {typeof post.readingTimeMinutes === "number" && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTimeMinutes} min read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Browse more tags */}
      <div className="mt-10 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground mb-3">Looking for something else?</p>
        <Link href="/blog/tags">
          <Button variant="outline">Browse all tags</Button>
        </Link>
      </div>
    </div>
  );
}
