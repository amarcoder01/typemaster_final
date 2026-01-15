import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, Hash, TrendingUp } from "lucide-react";

interface TagItem {
  slug: string;
  name: string;
  count: number;
}

export default function BlogTagsPage() {
  useSEO({
    title: "Blog Tags | TypeMasterAI",
    description: "Browse blog tags and discover articles by topic. Find typing tips, tutorials, and guides organized by category.",
    keywords: "typing blog tags, typing categories, typing tutorials",
    canonical: "/blog/tags",
    ogUrl: "/blog/tags",
  });

  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const loadTags = async () => {
      setLoading(true);
      const res = await fetch("/api/blog/tags", { signal: controller.signal });
      if (!res.ok) {
        setTags([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTags(data.tags || []);
      setLoading(false);
    };
    loadTags();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Separate popular tags (count > 1)
  const popularTags = tags.filter(t => t.count > 1);
  const otherTags = tags.filter(t => t.count <= 1);
  const totalArticles = tags.reduce((sum, t) => sum + t.count, 0);

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
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse Topics</h1>
        </div>
        <p className="text-muted-foreground">
          {tags.length} topics covering {totalArticles} articles
        </p>
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Popular Topics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularTags.map(tag => (
              <Link key={tag.slug} href={`/blog/tag/${tag.slug}`}>
                <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {tag.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tag.count} {tag.count === 1 ? 'article' : 'articles'}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Tags */}
      {otherTags.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">All Topics</h2>
          <div className="flex flex-wrap gap-2">
            {otherTags.map(tag => (
              <Link key={tag.slug} href={`/blog/tag/${tag.slug}`}>
                <Badge 
                  variant="outline" 
                  className="px-3 py-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                >
                  {tag.name}
                  <span className="ml-1.5 text-muted-foreground text-[10px]">({tag.count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tags.length === 0 && (
        <Card className="p-12 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold mb-2">No tags yet</h2>
          <p className="text-muted-foreground mb-4">
            Check back soon for categorized articles.
          </p>
          <Link href="/blog">
            <Button variant="outline">Browse all articles</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
