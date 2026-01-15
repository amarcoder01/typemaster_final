import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Eye, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    authorName: string;
    publishedAt: string | null;
    readingTimeMinutes?: number;
    viewCount?: number;
    categoryName?: string;
    categorySlug?: string;
    tags?: string[];
  };
  variant?: "default" | "compact" | "horizontal" | "featured";
}

export function BlogCard({ post, variant = "default" }: BlogCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "featured") {
    return (
      <Link href={`/blog/${post.slug}`}>
        <Card className="group relative overflow-hidden h-[400px] hover:shadow-2xl transition-all duration-500 border-0">
          {/* Background Image */}
          <div className="absolute inset-0">
            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </div>
          
          {/* Content */}
          <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {post.categoryName && (
              <Badge className="mb-3 bg-primary/90 hover:bg-primary text-xs">
                {post.categoryName}
              </Badge>
            )}
            <h3 className="font-bold text-2xl line-clamp-2 mb-3 group-hover:text-primary-foreground transition-colors">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-white/80 line-clamp-2 text-sm mb-4">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {post.authorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.publishedAt)}
              </span>
              {post.readingTimeMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTimeMinutes} min
                </span>
              )}
            </div>
          </CardContent>
          
          {/* Hover indicator */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={`/blog/${post.slug}`}>
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50 hover:-translate-y-0.5">
          <div className="flex flex-col sm:flex-row">
            {post.coverImageUrl && (
              <div className="sm:w-52 h-44 sm:h-auto overflow-hidden flex-shrink-0 relative">
                <img
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <CardContent className="flex-1 p-5 flex flex-col justify-center">
              {post.categoryName && (
                <Badge variant="secondary" className="w-fit mb-2.5 text-xs font-normal">
                  {post.categoryName}
                </Badge>
              )}
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2.5 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
                {post.readingTimeMinutes && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTimeMinutes} min read
                  </span>
                )}
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {post.viewCount.toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/blog/${post.slug}`}>
        <div className="group flex gap-4 py-4 border-b last:border-0 hover:bg-muted/50 px-3 -mx-3 rounded-lg transition-all">
          {post.coverImageUrl && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border/50">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{formatDate(post.publishedAt)}</span>
              {post.readingTimeMinutes && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>{post.readingTimeMinutes} min</span>
                </>
              )}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className={cn(
        "group overflow-hidden h-full transition-all duration-300",
        "hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1",
        "bg-card/50 backdrop-blur-sm"
      )}>
        <div className="relative">
          {post.coverImageUrl ? (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-4xl opacity-30">📝</div>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Reading time badge */}
          {post.readingTimeMinutes && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium flex items-center gap-1 shadow-sm">
              <Clock className="h-3 w-3" />
              {post.readingTimeMinutes} min
            </div>
          )}
        </div>
        
        <CardContent className="p-5">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0.5 font-normal">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-normal">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          {post.categoryName && !post.tags?.length && (
            <Badge variant="secondary" className="mb-3 text-xs font-normal hover:bg-primary hover:text-primary-foreground transition-colors">
              {post.categoryName}
            </Badge>
          )}
          
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {post.title}
          </h3>
          
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2.5 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-5 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.publishedAt)}
              </span>
              {post.viewCount !== undefined && post.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.viewCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
