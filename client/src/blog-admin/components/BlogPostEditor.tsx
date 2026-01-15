import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Save,
  ArrowLeft,
  Calendar,
  X,
  Clock,
  Globe,
  FileText,
  Rocket,
  AlertCircle,
  Check,
  Loader2,
  Table,
  Undo,
  Redo,
  Wand2,
  Sparkles,
} from "lucide-react";
import { validateBlogContent, normalizeBlogContent, autoFormatContent, type ValidationIssue } from "@shared/blog-processor";
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
import { SEOPreview } from "./SEOPreview";
import { AdvancedPreview } from "./AdvancedPreview";
import { cn } from "@/lib/utils";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

interface BlogPostInput {
  id?: number;
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
  isFeatured: boolean;
  featuredOrder: number | null;
  tags: string[];
}

interface BlogPostEditorProps {
  post?: BlogPostInput;
  categories: BlogCategory[];
  onSave: (post: BlogPostInput) => Promise<{ success: boolean; error?: string; post?: BlogPostInput }>;
  onBack: () => void;
  saving: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error" | "unsaved";

const defaultPost: BlogPostInput = {
  slug: "",
  title: "",
  excerpt: null,
  contentMd: "",
  coverImageUrl: null,
  authorName: "TypeMasterAI",
  authorBio: null,
  authorAvatarUrl: null,
  metaTitle: null,
  metaDescription: null,
  categoryId: null,
  status: "draft",
  scheduledAt: null,
  publishedAt: null,
  isFeatured: false,
  featuredOrder: null,
  tags: [],
};

// Simple hash for dirty checking
function hashContent(post: BlogPostInput): string {
  return JSON.stringify({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentMd: post.contentMd,
    coverImageUrl: post.coverImageUrl,
    authorName: post.authorName,
    authorBio: post.authorBio,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    categoryId: post.categoryId,
    status: post.status,
    scheduledAt: post.scheduledAt,
    isFeatured: post.isFeatured,
    featuredOrder: post.featuredOrder,
    tags: post.tags,
  });
}

export function BlogPostEditor({
  post: initialPost,
  categories,
  onSave,
  onBack,
  saving: externalSaving,
}: BlogPostEditorProps) {
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPostInput>(initialPost || defaultPost);
  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview" | "seo">("write");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track original content for dirty checking
  const [savedHash, setSavedHash] = useState<string>(() => hashContent(initialPost || defaultPost));
  const currentHash = useMemo(() => hashContent(post), [post]);
  const isDirty = currentHash !== savedHash;

  // Refs for managing async operations
  const saveInProgressRef = useRef(false);
  const pendingSaveRef = useRef<BlogPostInput | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo/Redo stack
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastContentRef = useRef(post.contentMd);

  // Stats
  const stats = useMemo(() => {
    const words = post.contentMd.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(words / 200));
    return { words, time };
  }, [post.contentMd]);

  // Update dirty status when content changes
  useEffect(() => {
    if (isDirty && saveStatus === "saved") {
      setSaveStatus("unsaved");
    }
  }, [isDirty, saveStatus]);

  // Auto-generate slug from title (only for new posts)
  useEffect(() => {
    if (!initialPost?.id && post.title && !post.slug) {
      const slug = post.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 200);
      setPost((prev) => ({ ...prev, slug }));
    }
  }, [post.title, initialPost?.id, post.slug]);

  // Debounced autosave (5 seconds after last change)
  useEffect(() => {
    if (!isDirty || post.status === "published") return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      if (post.title && post.contentMd.length >= 20) {
        handleSave(post.status, true);
      }
    }, 5000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [currentHash, post.status]);

  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Track content changes for undo/redo
  useEffect(() => {
    if (post.contentMd !== lastContentRef.current) {
      setUndoStack(prev => [...prev.slice(-50), lastContentRef.current]);
      setRedoStack([]);
      lastContentRef.current = post.contentMd;
    }
  }, [post.contentMd]);

  const update = useCallback((key: keyof BlogPostInput, value: unknown) => {
    setPost((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async (
    status?: BlogPostInput["status"],
    isAutosave = false
  ): Promise<boolean> => {
    // Prevent concurrent saves
    if (saveInProgressRef.current) {
      // Queue this save for later
      pendingSaveRef.current = { ...post, status: status || post.status };
      return false;
    }

    saveInProgressRef.current = true;
    setSaveStatus("saving");
    setSaveError(null);

    const newStatus = status || post.status;

    // Validation Check for Publishing
    if (newStatus === "published") {
      const { isValid, issues } = validateBlogContent(post.contentMd, post.metaDescription || post.excerpt || undefined);
      if (!isValid) {
        setValidationIssues(issues);
        setShowValidationDialog(true);
        saveInProgressRef.current = false;
        setSaveStatus("idle");
        return false;
      }
    }

    let updates = { ...post, status: newStatus };

    // Handle publishing logic
    if (newStatus === "published" && post.status !== "published") {
      updates.publishedAt = new Date().toISOString();
    }

    try {
      const result = await onSave(updates);

      if (result.success) {
        // Ensure tags are preserved as the API might return the post without tags
        const savedPost = result.post || updates;
        setPost({ ...savedPost, tags: savedPost.tags || updates.tags || [] });
        setSavedHash(hashContent({ ...savedPost, tags: savedPost.tags || updates.tags || [] }));
        setLastSaved(new Date());
        setSaveStatus("saved");

        if (!isAutosave) {
          toast({
            title: newStatus === "published" ? "Published!" : "Saved",
            description: newStatus === "published"
              ? "Your post is now live."
              : "Your changes have been saved.",
          });
        }

        saveInProgressRef.current = false;

        // Check if there's a pending save
        if (pendingSaveRef.current) {
          const pending = pendingSaveRef.current;
          pendingSaveRef.current = null;
          await handleSave(pending.status, true);
        }

        return true;
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save post";
      setSaveStatus("error");
      setSaveError(errorMessage);

      if (!isAutosave) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: errorMessage,
        });
      }

      saveInProgressRef.current = false;
      return false;
    }
  }, [post, onSave, toast]);

  const handleStatusChange = useCallback((newStatus: BlogPostInput["status"]) => {
    update("status", newStatus);
    // Don't auto-save on status change, user needs to click save
  }, [update]);

  const insertMarkdown = useCallback((prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = post.contentMd.substring(start, end);
    const newText =
      post.contentMd.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      post.contentMd.substring(end);

    update("contentMd", newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  }, [post.contentMd, update]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertMarkdown("**", "**");
          break;
        case "i":
          e.preventDefault();
          insertMarkdown("*", "*");
          break;
        case "k":
          e.preventDefault();
          insertMarkdown("[", "](url)");
          break;
        case "s":
          e.preventDefault();
          handleSave(post.status);
          break;
        case "z":
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
          break;
        case "y":
          e.preventDefault();
          handleRedo();
          break;
      }
    }
  }, [insertMarkdown, handleSave, post.status]);

  // Auto-fix handler (basic normalization)
  const handleAutoFix = useCallback(() => {
    const newContent = normalizeBlogContent(post.contentMd);
    if (newContent !== post.contentMd) {
      update("contentMd", newContent);
      toast({ title: "Content normalized", description: "Headings, spacing, and structure have been fixed." });
    } else {
      toast({ title: "Already normalized", description: "No changes needed." });
    }
  }, [post.contentMd, update, toast]);

  // Full auto-format handler (transforms plain text to professional structure)
  const handleAutoFormat = useCallback(() => {
    const newContent = autoFormatContent(post.contentMd, post.title);
    if (newContent !== post.contentMd) {
      update("contentMd", newContent);
      toast({ 
        title: "Content professionally formatted", 
        description: "Your text has been transformed into a structured blog post with sections and improved readability." 
      });
    } else {
      toast({ title: "Already formatted", description: "Content structure looks good." });
    }
  }, [post.contentMd, post.title, update, toast]);

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setRedoStack(r => [...r, post.contentMd]);
      setUndoStack(u => u.slice(0, -1));
      lastContentRef.current = prev;
      update("contentMd", prev);
    }
  }, [undoStack, post.contentMd, update]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(u => [...u, post.contentMd]);
      setRedoStack(r => r.slice(0, -1));
      lastContentRef.current = next;
      update("contentMd", next);
    }
  }, [redoStack, post.contentMd, update]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (tag && !post.tags.includes(tag)) {
      update("tags", [...post.tags, tag]);
    }
    setTagInput("");
  }, [tagInput, post.tags, update]);

  const removeTag = useCallback((tag: string) => {
    update("tags", post.tags.filter((t) => t !== tag));
  }, [post.tags, update]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        onBack();
      }
    } else {
      onBack();
    }
  }, [isDirty, onBack]);

  const insertTable = useCallback(() => {
    insertMarkdown("\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n");
  }, [insertMarkdown]);

  const insertCodeBlock = useCallback(() => {
    insertMarkdown("\n```javascript\n", "\n```\n");
  }, [insertMarkdown]);

  // Save status indicator component
  const SaveStatusIndicator = () => {
    const statusConfig = {
      idle: { icon: null, text: "", className: "" },
      saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: "Saving...", className: "text-muted-foreground" },
      saved: { icon: <Check className="h-3 w-3" />, text: lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Saved", className: "text-green-600" },
      error: { icon: <AlertCircle className="h-3 w-3" />, text: "Save failed", className: "text-red-500" },
      unsaved: { icon: <div className="w-2 h-2 rounded-full bg-yellow-500" />, text: "Unsaved changes", className: "text-yellow-600" },
    };

    const config = statusConfig[saveStatus];
    if (!config.text) return null;

    return (
      <button
        onClick={() => saveStatus === "error" || saveStatus === "unsaved" ? handleSave(post.status) : undefined}
        className={cn("flex items-center gap-1 text-xs", config.className, (saveStatus === "error" || saveStatus === "unsaved") && "cursor-pointer hover:underline")}
        title={saveError || undefined}
      >
        {config.icon}
        {config.text}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header / Toolbar */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">
                  {post.title || "Untitled Post"}
                </span>
                <Badge
                  variant={post.status === "published" ? "default" : "secondary"}
                  className={cn(
                    post.status === "published" && "bg-green-500 hover:bg-green-600",
                    post.status === "draft" && "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
                    post.status === "scheduled" && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                    post.status === "review" && "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
                  )}
                >
                  {post.status}
                </Badge>
                {isDirty && <span className="text-xs text-yellow-600">•</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {stats.words} words
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.time} min read
                </span>
                <SaveStatusIndicator />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(post.status)}
              disabled={externalSaving || saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>

            {post.status === "published" ? (
              <Button
                variant="destructive"
                onClick={() => handleSave("draft")}
                disabled={externalSaving || saveStatus === "saving"}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                onClick={() => handleSave("published")}
                disabled={externalSaving || saveStatus === "saving" || !post.title || !post.slug || post.contentMd.length < 20}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Main Content Area */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview" | "seo")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="seo">SEO & Social</TabsTrigger>
              </TabsList>

              <TabsContent value="write" className="space-y-6">
                {/* Title & Slug */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Post Title</Label>
                      <Input
                        id="title"
                        value={post.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="Enter an engaging title..."
                        className="text-lg font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-2 rounded-l-md border border-r-0">
                          /blog/
                        </span>
                        <Input
                          id="slug"
                          value={post.slug}
                          onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                          placeholder="post-url-slug"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editor */}
                <Card className="min-h-[600px] flex flex-col">
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                      <Redo className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("**", "**")} title="Bold (Ctrl+B)">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("*", "*")} title="Italic (Ctrl+I)">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("# ")} title="H1">
                      <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("## ")} title="H2">
                      <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("### ")} title="H3">
                      <Heading3 className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("[", "](url)")} title="Link (Ctrl+K)">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("![alt](", ")")} title="Image">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={insertCodeBlock} title="Code Block">
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("> ")} title="Quote">
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={insertTable} title="Table">
                      <Table className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("- ")} title="List">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertMarkdown("1. ")} title="Ordered List">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={handleAutoFix} title="Quick Fix (normalize headings & spacing)">
                      <Wand2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={handleAutoFormat} title="Auto-Format (transform to professional structure)">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>

                  <Textarea
                    ref={textareaRef}
                    value={post.contentMd}
                    onChange={(e) => update("contentMd", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write your masterpiece here... (Markdown supported)"
                    className="flex-1 min-h-[500px] border-0 focus-visible:ring-0 rounded-none p-6 font-mono text-base resize-none"
                  />
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <AdvancedPreview post={post} />
              </TabsContent>

              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Engine Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt / Meta Description</Label>
                      <Textarea
                        id="excerpt"
                        value={post.excerpt || ""}
                        onChange={(e) => update("excerpt", e.target.value || null)}
                        placeholder="Brief summary for listings and social sharing..."
                        rows={3}
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {(post.excerpt || "").length}/300
                      </p>
                    </div>

                    <SEOPreview
                      title={post.metaTitle || post.title}
                      description={post.metaDescription || post.excerpt || ""}
                      slug={post.slug}
                      onTitleChange={(v) => update("metaTitle", v || null)}
                      onDescriptionChange={(v) => update("metaDescription", v || null)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={post.status}
                    onValueChange={(v) => handleStatusChange(v as BlogPostInput["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {post.status === "scheduled" && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule Date
                    </Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={post.scheduledAt?.slice(0, 16) || ""}
                      onChange={(e) => update("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="featured" className="cursor-pointer flex flex-col">
                    <span>Featured Post</span>
                    <span className="text-xs font-normal text-muted-foreground">Pin to top of blog</span>
                  </Label>
                  <Switch
                    id="featured"
                    checked={post.isFeatured}
                    onCheckedChange={(checked) => update("isFeatured", checked)}
                  />
                </div>

                {post.isFeatured && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="featuredOrder">Order Priority</Label>
                    <Input
                      id="featuredOrder"
                      type="number"
                      min={0}
                      value={post.featuredOrder ?? ""}
                      onChange={(e) => update("featuredOrder", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="0 = highest priority"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={post.categoryId?.toString() || "none"}
                    onValueChange={(v) => update("categoryId", v === "none" ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="h-8"
                    />
                    <Button variant="outline" size="sm" onClick={addTag} className="h-8">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {(post.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Media</CardTitle>
                <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Validation Failed</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please fix the following issues before publishing:
                        <ul className="list-disc pl-4 mt-2 space-y-1 max-h-[60vh] overflow-y-auto">
                          {validationIssues.map((issue, i) => (
                            <li key={i} className={issue.type === "error" ? "text-red-500 font-medium" : "text-amber-500"}>
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        const fixable = validationIssues.some(i => i.fixable);
                        if (fixable) handleAutoFormat();
                        setShowValidationDialog(false);
                      }}>
                        {validationIssues.some(i => i.fixable) ? "Auto-Format & Close" : "OK"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <Input
                    value={post.coverImageUrl || ""}
                    onChange={(e) => update("coverImageUrl", e.target.value || null)}
                    placeholder="https://..."
                  />
                </div>
                {post.coverImageUrl && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={post.coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%23999'%3EInvalid%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Author Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="authorName">Display Name</Label>
                  <Input
                    id="authorName"
                    value={post.authorName}
                    onChange={(e) => update("authorName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorBio">Custom Bio</Label>
                  <Textarea
                    id="authorBio"
                    value={post.authorBio || ""}
                    onChange={(e) => update("authorBio", e.target.value || null)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
