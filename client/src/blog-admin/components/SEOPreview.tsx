import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface SEOPreviewProps {
  title: string;
  description: string;
  slug: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function SEOPreview({
  title,
  description,
  slug,
  onTitleChange,
  onDescriptionChange,
}: SEOPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const siteUrl = "typemasterai.com";
  const fullUrl = `${siteUrl}/blog/${slug}`;
  
  // Google truncates at approximately these lengths
  const titleLength = title.length;
  const descLength = description.length;
  const titleMax = 60;
  const descMax = 155;

  const getTitleColor = () => {
    if (titleLength === 0) return "text-muted-foreground";
    if (titleLength > titleMax) return "text-red-500";
    if (titleLength > titleMax - 10) return "text-yellow-500";
    return "text-green-500";
  };

  const getDescColor = () => {
    if (descLength === 0) return "text-muted-foreground";
    if (descLength > descMax) return "text-red-500";
    if (descLength > descMax - 20) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO Preview
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google SERP Preview */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary">T</span>
              </div>
              {fullUrl}
            </div>
            <h3 className="text-lg text-blue-600 dark:text-blue-400 font-medium line-clamp-1 hover:underline cursor-pointer">
              {title || "Post Title"}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description || "Add a meta description to improve click-through rates from search results."}
            </p>
          </div>
        </div>

        {expanded && (
          <>
            {/* Meta Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <span className={`text-xs ${getTitleColor()}`}>
                  {titleLength}/{titleMax}
                </span>
              </div>
              <Input
                id="metaTitle"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Custom SEO title (leave empty to use post title)"
                maxLength={70}
              />
              {titleLength > titleMax && (
                <p className="text-xs text-red-500">
                  Title may be truncated in search results
                </p>
              )}
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDesc">Meta Description</Label>
                <span className={`text-xs ${getDescColor()}`}>
                  {descLength}/{descMax}
                </span>
              </div>
              <Textarea
                id="metaDesc"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Custom meta description for search engines..."
                rows={3}
                maxLength={160}
              />
              {descLength > descMax && (
                <p className="text-xs text-red-500">
                  Description may be truncated in search results
                </p>
              )}
            </div>

            {/* SEO Tips */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">SEO Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Keep title under 60 characters for best display</li>
                <li>Description should be 120-155 characters</li>
                <li>Include your target keyword naturally</li>
                <li>Make it compelling to increase clicks</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

