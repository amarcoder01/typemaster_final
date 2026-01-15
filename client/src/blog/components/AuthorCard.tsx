import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthorCardProps {
  author: {
    name: string;
    bio?: string | null;
    avatarUrl?: string | null;
    twitterUrl?: string | null;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
  };
  publishedAt?: string | null;
  className?: string;
  variant?: "default" | "compact" | "featured";
}

export function AuthorCard({ author, publishedAt, className = "", variant = "default" }: AuthorCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Avatar className="h-10 w-10 ring-2 ring-border">
          {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
          <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {getInitials(author.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">{author.name}</div>
          {publishedAt && (
            <div className="text-xs text-muted-foreground">
              {formatDate(publishedAt)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                  Written by
                </div>
                <div className="font-bold text-2xl">{author.name}</div>
                {publishedAt && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Published on {formatDate(publishedAt)}
                  </div>
                )}
                {author.bio && (
                  <p className="text-muted-foreground mt-4 leading-relaxed max-w-lg">
                    {author.bio}
                  </p>
                )}
                
                {/* Social Links */}
                {(author.twitterUrl || author.linkedinUrl || author.websiteUrl) && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-6">
                    {author.twitterUrl && (
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {author.linkedinUrl && (
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {author.websiteUrl && (
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("overflow-hidden border-primary/20", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-md">
            {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
            <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
              About the Author
            </div>
            <div className="font-semibold text-xl">{author.name}</div>
            {publishedAt && (
              <div className="text-sm text-muted-foreground mt-0.5">
                Published on {formatDate(publishedAt)}
              </div>
            )}
            {author.bio && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {author.bio}
              </p>
            )}
            
            {/* Social Links */}
            {(author.twitterUrl || author.linkedinUrl || author.websiteUrl) && (
              <div className="flex items-center gap-2 mt-4">
                {author.twitterUrl && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                    <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-1" />
                      Twitter
                    </a>
                  </Button>
                )}
                {author.linkedinUrl && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                    <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
