import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useSEO } from "@/lib/seo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostList } from "./components/BlogPostList";
import { BlogPostEditor } from "./components/BlogPostEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, BarChart3, Settings, FolderOpen } from "lucide-react";
import { CategoryManager } from "./components/CategoryManager";
import { BlogAnalytics } from "./components/BlogAnalytics";
import { BlogSettings } from "./components/BlogSettings";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  coverImageUrl: string | null;
  authorId?: string | null;
  authorName: string;
  authorBio: string | null;
  authorAvatarUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: number | null;
  status: "draft" | "review" | "scheduled" | "published";
  scheduledAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  isFeatured: boolean;
  featuredOrder: number | null;
  updatedAt: string;
  createdAt: string;
  wordCount?: number;
  readingTimeMinutes?: number;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isActive: boolean;
}

interface PostListData {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BlogAdmin() {
  useSEO({
    title: "Blog Admin | TypeMasterAI",
    description: "Admin panel for managing blog posts.",
    canonical: "https://typemasterai.com/admin/blog",
    ogUrl: "https://typemasterai.com/admin/blog",
    noindex: true,
  });

  const [, params] = useRoute("/admin/blog/:action?/:id?");
  const [, setLocation] = useLocation();
  
  const action = params?.action;
  const postId = params?.id ? parseInt(params.id) : undefined;

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/blog", { credentials: "include", cache: "no-store" });
        setIsAdmin(res.ok);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      
      const res = await fetch(`/api/admin/blog/posts?${params}`, { credentials: "include" });
      if (res.ok) {
        const data: PostListData = await res.json();
        setPosts(data.posts);
        setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
    setLoading(false);
  }, [statusFilter]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog/categories", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  // Load single post for editing
  const loadPost = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/admin/blog/post/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEditingPost(data.post);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
      fetchCategories();
    }
  }, [isAdmin, fetchPosts, fetchCategories]);

  useEffect(() => {
    if (action === "edit" && postId) {
      loadPost(postId);
    } else if (action === "new") {
      setEditingPost(null);
    }
  }, [action, postId, loadPost]);

  // Handlers
  const handlePageChange = (page: number) => {
    fetchPosts(page);
  };

  const handleStatusFilter = (status: string | undefined) => {
    setStatusFilter(status);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search
  };

  const handleEdit = (id: number) => {
    setLocation(`/admin/blog/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/blog/post/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchPosts(pagination.page);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
    setDeleteConfirm(null);
  };

  const handleBulkAction = async (action: string, ids: number[]) => {
    try {
      const res = await fetch("/api/admin/blog/bulk-action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, postIds: ids }),
      });
      if (res.ok) {
        fetchPosts(pagination.page);
      }
    } catch (err) {
      console.error("Failed to perform bulk action:", err);
    }
  };

  const handleSavePost = async (post: any): Promise<{ success: boolean; error?: string; post?: any }> => {
    setSaving(true);
    try {
      const isNew = !post.id;
      const url = isNew ? "/api/admin/blog/post" : `/api/admin/blog/post/${post.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isNew && data.post?.id) {
          setLocation(`/admin/blog/edit/${data.post.id}`);
        }
        setSaving(false);
        return { success: true, post: data.post };
      } else {
        setSaving(false);
        return { success: false, error: data.message || data.error || "Failed to save post" };
      }
    } catch (err) {
      console.error("Failed to save post:", err);
      setSaving(false);
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  };

  const handleBack = () => {
    setEditingPost(null);
    setLocation("/admin/blog");
    fetchPosts();
  };

  // Render states
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  // Show editor if editing or creating
  if (action === "edit" || action === "new") {
    return (
      <BlogPostEditor
        post={editingPost ? {
          ...editingPost,
          tags: [], // TODO: Load tags
        } : undefined}
        categories={categories}
        onSave={handleSavePost}
        onBack={handleBack}
        saving={saving}
      />
    );
  }

  // Main admin dashboard
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Blog Admin</h1>
        <p className="text-muted-foreground mt-1">Manage your blog posts, categories, and content.</p>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <BlogPostList
            posts={posts}
            totalPages={pagination.totalPages}
            currentPage={pagination.page}
            onPageChange={handlePageChange}
            onStatusFilter={handleStatusFilter}
            onSearch={handleSearch}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteConfirm(id)}
            onBulkAction={handleBulkAction}
            onRefresh={() => fetchPosts(pagination.page)}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="analytics">
          <BlogAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <BlogSettings />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
