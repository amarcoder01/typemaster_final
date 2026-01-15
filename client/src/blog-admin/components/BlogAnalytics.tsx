import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Eye,
  FileText,
  TrendingUp,
  Users,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  popularPosts: {
    id: number;
    slug: string;
    title: string;
    viewCount: number;
    publishedAt: string | null;
  }[];
  recentPosts: {
    id: number;
    slug: string;
    title: string;
    status: string;
    viewCount: number;
    createdAt: string;
  }[];
  cacheStats: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } | null;
}

export function BlogAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch posts data
      const [postsRes, popularRes, cacheRes] = await Promise.all([
        fetch("/api/admin/blog/posts?limit=100", { credentials: "include" }),
        fetch(`/api/blog/popular?limit=10&days=${timeRange}`, { credentials: "include" }),
        fetch("/api/admin/blog/cache/stats", { credentials: "include" }),
      ]);

      const postsData = postsRes.ok ? await postsRes.json() : { posts: [], pagination: { total: 0 } };
      const popularData = popularRes.ok ? await popularRes.json() : { posts: [] };
      const cacheData = cacheRes.ok ? await cacheRes.json() : { stats: null };

      const posts = postsData.posts || [];
      const totalViews = posts.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0);

      setData({
        totalPosts: postsData.pagination?.total || posts.length,
        publishedPosts: posts.filter((p: any) => p.status === "published").length,
        draftPosts: posts.filter((p: any) => p.status === "draft").length,
        totalViews,
        popularPosts: (popularData.posts || []).slice(0, 5),
        recentPosts: posts.slice(0, 5),
        cacheStats: cacheData.stats,
      });
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleClearCache = async () => {
    try {
      await fetch("/api/admin/blog/cache/clear", {
        method: "POST",
        credentials: "include",
      });
      fetchAnalytics();
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load analytics data</p>
        <Button variant="outline" className="mt-4" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {data.publishedPosts} published, {data.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/Post</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.publishedPosts > 0
                ? Math.round(data.totalViews / data.publishedPosts).toLocaleString()
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Per published post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.cacheStats ? `${data.cacheStats.hitRate.toFixed(1)}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cacheStats ? `${data.cacheStats.size} cached items` : "Cache stats unavailable"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Posts & Recent Posts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Most Popular Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.popularPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No posts yet
              </p>
            ) : (
              <div className="space-y-4">
                {data.popularPosts.map((post, index) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <p className="text-sm font-medium truncate hover:text-primary cursor-pointer">
                          {post.title}
                        </p>
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()}
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View post">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No posts yet
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        post.status === "published"
                          ? "bg-green-500"
                          : post.status === "draft"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <p className="text-sm font-medium truncate hover:text-primary cursor-pointer">
                          {post.title}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Management */}
      {data.cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Cache Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.cacheStats.size}</div>
                <div className="text-xs text-muted-foreground">Cached Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.cacheStats.hits}</div>
                <div className="text-xs text-muted-foreground">Cache Hits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.cacheStats.misses}</div>
                <div className="text-xs text-muted-foreground">Cache Misses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.cacheStats.hitRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Hit Rate</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
