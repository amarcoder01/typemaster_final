import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Globe,
  User,
  FileText,
  Clock,
  Rss,
  Shield,
} from "lucide-react";

interface BlogSettingsData {
  siteUrl: string;
  siteName: string;
  defaultAuthorName: string;
  defaultAuthorBio: string;
  postsPerPage: number;
  maxFeaturedPosts: number;
  cacheTtlMs: number;
  wordsPerMinute: number;
  enableComments: boolean;
  enableNewsletterCta: boolean;
  enableViewTracking: boolean;
  enableScheduledPublishing: boolean;
  defaultMetaDescription: string;
  defaultKeywords: string;
  rssMaxItems: number;
  popularPostsDays: number;
}

export function BlogSettings() {
  const [settings, setSettings] = useState<BlogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/blog/settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blog Settings</h3>
          <p className="text-sm text-muted-foreground">
            Current configuration for your blog. Settings are configured via environment variables.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Read-only
        </Badge>
      </div>

      {/* Site Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Site Settings
          </CardTitle>
          <CardDescription>
            General site configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site URL</Label>
              <Input value={settings.siteUrl} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_SITE_URL</p>
            </div>
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={settings.siteName} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_SITE_NAME</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Default Author
          </CardTitle>
          <CardDescription>
            Default author information for new posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Author Name</Label>
            <Input value={settings.defaultAuthorName} readOnly className="bg-muted" />
            <p className="text-xs text-muted-foreground">BLOG_DEFAULT_AUTHOR</p>
          </div>
          <div className="space-y-2">
            <Label>Author Bio</Label>
            <Textarea value={settings.defaultAuthorBio} readOnly className="bg-muted resize-none" rows={2} />
            <p className="text-xs text-muted-foreground">BLOG_DEFAULT_AUTHOR_BIO</p>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Settings
          </CardTitle>
          <CardDescription>
            Pagination and display options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Posts Per Page</Label>
              <Input value={settings.postsPerPage} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_POSTS_PER_PAGE</p>
            </div>
            <div className="space-y-2">
              <Label>Max Featured Posts</Label>
              <Input value={settings.maxFeaturedPosts} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_MAX_FEATURED</p>
            </div>
            <div className="space-y-2">
              <Label>Words Per Minute</Label>
              <Input value={settings.wordsPerMinute} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_WORDS_PER_MINUTE</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Default Meta Description</Label>
            <Textarea value={settings.defaultMetaDescription} readOnly className="bg-muted resize-none" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Default Keywords</Label>
            <Input value={settings.defaultKeywords} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Cache & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cache & Performance
          </CardTitle>
          <CardDescription>
            Caching and performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cache TTL</Label>
              <Input value={`${Math.round(settings.cacheTtlMs / 1000)} seconds`} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_CACHE_TTL_MS</p>
            </div>
            <div className="space-y-2">
              <Label>Popular Posts Days</Label>
              <Input value={`${settings.popularPostsDays} days`} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">BLOG_POPULAR_POSTS_DAYS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RSS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rss className="h-4 w-4" />
            RSS Feed
          </CardTitle>
          <CardDescription>
            RSS/Atom feed configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Max RSS Items</Label>
            <Input value={settings.rssMaxItems} readOnly className="bg-muted w-[200px]" />
            <p className="text-xs text-muted-foreground">BLOG_RSS_MAX_ITEMS</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Enable or disable features via environment variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Comments</Label>
              <p className="text-xs text-muted-foreground">BLOG_ENABLE_COMMENTS</p>
            </div>
            <Switch checked={settings.enableComments} disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Newsletter CTA</Label>
              <p className="text-xs text-muted-foreground">BLOG_ENABLE_NEWSLETTER</p>
            </div>
            <Switch checked={settings.enableNewsletterCta} disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>View Tracking</Label>
              <p className="text-xs text-muted-foreground">BLOG_ENABLE_VIEW_TRACKING</p>
            </div>
            <Switch checked={settings.enableViewTracking} disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Scheduled Publishing</Label>
              <p className="text-xs text-muted-foreground">BLOG_ENABLE_SCHEDULED</p>
            </div>
            <Switch checked={settings.enableScheduledPublishing} disabled />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center py-4">
        To modify these settings, update the corresponding environment variables and restart the server.
      </p>
    </div>
  );
}
