import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { History, RotateCcw, Eye, Clock, FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Revision {
  id: number;
  postId: number;
  title: string;
  contentMd: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  revisionNumber: number;
  createdAt: string;
}

interface RevisionHistoryProps {
  postId: number;
  onRestore?: (post: any) => void;
}

export function RevisionHistory({ postId, onRestore }: RevisionHistoryProps) {
  const { toast } = useToast();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchRevisions();
    }
  }, [postId]);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/post/${postId}/revisions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error("Failed to fetch revisions:", err);
    }
    setLoading(false);
  };

  const handlePreview = (revision: Revision) => {
    setSelectedRevision(revision);
    setPreviewOpen(true);
  };

  const handleRestoreClick = (revision: Revision) => {
    setSelectedRevision(revision);
    setRestoreConfirmOpen(true);
  };

  const handleRestore = async () => {
    if (!selectedRevision) return;

    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/blog/revision/${selectedRevision.id}/restore`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Revision restored",
          description: `Restored to revision #${selectedRevision.revisionNumber}`,
        });
        setRestoreConfirmOpen(false);
        fetchRevisions();
        onRestore?.(data.post);
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to restore");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Restore failed",
        description: err instanceof Error ? err.message : "Failed to restore revision",
      });
    }
    setRestoring(false);
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Revision History
            {revisions.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {revisions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No revisions yet. Revisions are created when you save.
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {revisions.map((revision, index) => (
                  <div
                    key={revision.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                            #{revision.revisionNumber}
                          </Badge>
                          {index === 0 && (
                            <span className="text-xs text-green-600 font-medium">Latest</span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate" title={revision.title}>
                          {revision.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {countWords(revision.contentMd)} words
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handlePreview(revision)}
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRestoreClick(revision)}
                          title="Restore this version"
                          disabled={index === 0}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Revision #{selectedRevision?.revisionNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedRevision && (
                <>
                  Created {formatDistanceToNow(new Date(selectedRevision.createdAt), { addSuffix: true })}
                  {" • "}{countWords(selectedRevision.contentMd)} words
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedRevision && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRevision.title}</h3>
                  {selectedRevision.excerpt && (
                    <p className="text-muted-foreground mt-1">{selectedRevision.excerpt}</p>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 bg-muted/30">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedRevision.contentMd}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setPreviewOpen(false);
              if (selectedRevision) handleRestoreClick(selectedRevision);
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Revision</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore revision #{selectedRevision?.revisionNumber}?
              Your current content will be saved as a new revision before restoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreConfirmOpen(false)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
