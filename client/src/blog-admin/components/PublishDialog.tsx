import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Rocket,
  Loader2,
  FileText,
  Image,
  Tag,
  Search,
  Share2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    contentMd: string;
    coverImageUrl: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    categoryId: number | null;
    tags: string[];
    authorName: string;
  };
  onPublish: () => Promise<void>;
  publishing?: boolean;
}

interface CheckItem {
  id: string;
  label: string;
  description: string;
  status: "pass" | "warning" | "fail";
  icon: React.ComponentType<{ className?: string }>;
}

export function PublishDialog({
  open,
  onOpenChange,
  post,
  onPublish,
  publishing = false,
}: PublishDialogProps) {
  const checks = useMemo((): CheckItem[] => {
    const items: CheckItem[] = [];

    // Title check
    items.push({
      id: "title",
      label: "Title",
      description: post.title
        ? post.title.length >= 20 && post.title.length <= 70
          ? `Good length (${post.title.length} chars)`
          : post.title.length < 20
          ? `Too short (${post.title.length} chars, aim for 20-70)`
          : `May be truncated (${post.title.length} chars)`
        : "Missing title",
      status: post.title
        ? post.title.length >= 20 && post.title.length <= 70
          ? "pass"
          : "warning"
        : "fail",
      icon: FileText,
    });

    // Slug check
    items.push({
      id: "slug",
      label: "URL Slug",
      description: post.slug ? `/blog/${post.slug}` : "Missing URL slug",
      status: post.slug && post.slug.length >= 3 ? "pass" : "fail",
      icon: Globe,
    });

    // Content check
    const wordCount = post.contentMd.trim().split(/\s+/).filter(Boolean).length;
    items.push({
      id: "content",
      label: "Content",
      description:
        wordCount >= 300
          ? `${wordCount} words - Good length for SEO`
          : wordCount >= 100
          ? `${wordCount} words - Consider adding more content`
          : `${wordCount} words - Very short`,
      status: wordCount >= 300 ? "pass" : wordCount >= 100 ? "warning" : "fail",
      icon: FileText,
    });

    // Cover image check
    items.push({
      id: "coverImage",
      label: "Cover Image",
      description: post.coverImageUrl
        ? "Cover image set"
        : "No cover image (recommended for social sharing)",
      status: post.coverImageUrl ? "pass" : "warning",
      icon: Image,
    });

    // Excerpt/Meta description check
    const excerptLength = (post.excerpt || "").length;
    items.push({
      id: "excerpt",
      label: "Meta Description",
      description: excerptLength
        ? excerptLength >= 120 && excerptLength <= 160
          ? `Good length (${excerptLength} chars)`
          : excerptLength < 120
          ? `Short (${excerptLength} chars, aim for 120-160)`
          : `May be truncated (${excerptLength} chars)`
        : "Missing - will affect SEO",
      status: excerptLength
        ? excerptLength >= 120 && excerptLength <= 160
          ? "pass"
          : "warning"
        : "fail",
      icon: Search,
    });

    // Category check
    items.push({
      id: "category",
      label: "Category",
      description: post.categoryId
        ? "Category assigned"
        : "No category (optional but helps organization)",
      status: post.categoryId ? "pass" : "warning",
      icon: Tag,
    });

    // Tags check
    items.push({
      id: "tags",
      label: "Tags",
      description:
        post.tags.length > 0
          ? `${post.tags.length} tag${post.tags.length > 1 ? "s" : ""} added`
          : "No tags (helps with discoverability)",
      status: post.tags.length > 0 ? "pass" : "warning",
      icon: Tag,
    });

    return items;
  }, [post]);

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const score = Math.round((passCount / checks.length) * 100);
  const canPublish = failCount === 0;

  const getStatusIcon = (status: CheckItem["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Ready to Publish?
          </DialogTitle>
          <DialogDescription>
            Review the checklist below before publishing your post.
          </DialogDescription>
        </DialogHeader>

        {/* Score */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Publishing Score</span>
            <Badge
              variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive"}
              className={cn(
                score >= 80 && "bg-green-500",
                score >= 50 && score < 80 && "bg-yellow-500"
              )}
            >
              {score}%
            </Badge>
          </div>
          <Progress
            value={score}
            className={cn(
              "h-2",
              score >= 80 && "[&>div]:bg-green-500",
              score >= 50 && score < 80 && "[&>div]:bg-yellow-500",
              score < 50 && "[&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                check.status === "pass" && "bg-green-500/5 border-green-500/20",
                check.status === "warning" && "bg-yellow-500/5 border-yellow-500/20",
                check.status === "fail" && "bg-red-500/5 border-red-500/20"
              )}
            >
              {getStatusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{check.label}</div>
                <div className="text-xs text-muted-foreground">{check.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Preview Cards */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social Media Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Twitter/X Preview */}
              <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">X (Twitter)</div>
                {post.coverImageUrl && (
                  <div className="aspect-[2/1] bg-muted">
                    <img
                      src={post.coverImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-2">{post.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {post.excerpt || post.metaDescription || "No description"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">typemasterai.com</div>
                </div>
              </div>

              {/* Facebook Preview */}
              <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="text-xs text-muted-foreground px-3 pt-2 pb-1">Facebook</div>
                {post.coverImageUrl && (
                  <div className="aspect-[1.91/1] bg-muted">
                    <img
                      src={post.coverImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground uppercase">typemasterai.com</div>
                  <div className="text-sm font-semibold line-clamp-1 mt-1">{post.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {post.excerpt || post.metaDescription || "No description"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>
            Cancel
          </Button>
          <Button
            onClick={onPublish}
            disabled={!canPublish || publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </DialogFooter>

        {failCount > 0 && (
          <p className="text-xs text-red-500 text-center">
            Fix the {failCount} required issue{failCount > 1 ? "s" : ""} above to publish.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
