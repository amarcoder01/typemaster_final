import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Sparkles, Eye } from "lucide-react";

interface BlogHeroProps {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    authorName: string;
    authorAvatarUrl?: string | null;
    publishedAt: string | null;
    readingTimeMinutes?: number;
    viewCount?: number;
    categoryName?: string;
    tags?: string[];
  };
}

export function BlogHero({ post }: BlogHeroProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border shadow-xl">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
      
      <div className="relative grid lg:grid-cols-2 gap-0">
        {/* Content */}
        <div className="p-8 lg:p-12 xl:p-16 flex flex-col justify-center order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground gap-1.5 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
            {post.categoryName && (
              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                {post.categoryName}
              </Badge>
            )}
          </div>
          
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight hover:text-primary transition-colors cursor-pointer tracking-tight">
              {post.title}
            </h2>
          </Link>
          
          {post.excerpt && (
            <p className="text-muted-foreground mt-6 text-lg lg:text-xl leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}
          
          {/* Author and Meta */}
          <div className="flex flex-wrap items-center gap-6 mt-8">
            <div className="flex items-center gap-3">
              {post.authorAvatarUrl ? (
                <img 
                  src={post.authorAvatarUrl} 
                  alt={post.authorName}
                  className="w-12 h-12 rounded-full ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
                  <span className="text-lg font-semibold text-primary">
                    {post.authorName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <span className="font-semibold text-foreground block">{post.authorName}</span>
                <span className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.readingTimeMinutes && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  {post.readingTimeMinutes} min read
                </span>
              )}
            </div>
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.slice(0, 4).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="mt-10">
            <Link href={`/blog/${post.slug}`}>
              <Button size="lg" className="group text-base px-8 shadow-lg hover:shadow-xl transition-all">
                Read Article
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Image */}
        <div className="relative aspect-[4/3] lg:aspect-auto min-h-[300px] lg:min-h-[500px] order-1 lg:order-2">
          {post.coverImageUrl ? (
            <>
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent lg:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent lg:hidden" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <div className="text-8xl opacity-30">📝</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
