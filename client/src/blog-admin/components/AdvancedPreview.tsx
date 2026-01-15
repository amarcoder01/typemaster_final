import React, { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { processBlogContent, validateBlogContent, extractHeadings, type HeadingItem, type ValidationIssue } from "@shared/blog-processor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  User, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Moon, 
  Sun,
  FileText,
  Link2,
  Image,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ListTree
} from "lucide-react";
import { TableOfContents } from "@/blog/components/TableOfContents";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdvancedPreviewProps {
  post: {
    title: string;
    excerpt: string | null;
    contentMd: string;
    coverImageUrl: string | null;
    authorName: string;
    authorBio: string | null;
    authorAvatarUrl: string | null;
    publishedAt: string | null;
    tags: string[];
    metaDescription?: string | null;
    readingTimeMinutes?: number;
  };
}

type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceType, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

function PreviewStatsBar({ 
  stats, 
  issues, 
  headings,
  isValid
}: { 
  stats: {
    wordCount: number;
    readingTimeMinutes: number;
    headingCount: { h1: number; h2: number; h3: number };
    paragraphCount: number;
    linkCount: { internal: number; external: number };
    imageCount: number;
  };
  issues: ValidationIssue[];
  headings: HeadingItem[];
  isValid: boolean;
}) {
  const [showHeadings, setShowHeadings] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  
  const errorCount = issues.filter(i => i.type === "error").length;
  const warningCount = issues.filter(i => i.type === "warning").length;

  return (
    <div className="bg-muted/50 border-b">
      {/* Main Stats Row */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-4 text-xs">
        {/* SEO Status */}
        <div className={cn(
          "flex items-center gap-1.5 font-medium",
          isValid ? "text-green-600" : "text-red-500"
        )}>
          {isValid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{isValid ? "Ready to Publish" : "Issues Found"}</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Word Count */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>{stats.wordCount.toLocaleString()} words</span>
        </div>

        {/* Reading Time */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{stats.readingTimeMinutes} min read</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Headings */}
        <Collapsible open={showHeadings} onOpenChange={setShowHeadings}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ListTree className="h-3.5 w-3.5" />
              <span>H2: {stats.headingCount.h2} | H3: {stats.headingCount.h3}</span>
              {showHeadings ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Links */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          <span>{stats.linkCount.internal} internal, {stats.linkCount.external} external</span>
        </div>

        {/* Images */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Image className="h-3.5 w-3.5" />
          <span>{stats.imageCount} images</span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Issues Summary */}
        {(errorCount > 0 || warningCount > 0) && (
          <Collapsible open={showIssues} onOpenChange={setShowIssues}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-500 font-medium">
                    <XCircle className="h-3.5 w-3.5" />
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {warningCount} warning{warningCount !== 1 ? "s" : ""}
                  </span>
                )}
                {showIssues ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>

      {/* Expandable Heading Outline */}
      <Collapsible open={showHeadings} onOpenChange={setShowHeadings}>
        <CollapsibleContent>
          <div className="px-4 py-3 border-t bg-background/50">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Heading Structure
            </div>
            {headings.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No headings found in content</p>
            ) : (
              <ul className="space-y-1">
                {headings.map((heading, idx) => (
                  <li 
                    key={idx} 
                    className="text-xs flex items-center gap-2"
                    style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                  >
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-mono",
                        heading.level === 1 && "border-red-300 text-red-600 bg-red-50",
                        heading.level === 2 && "border-blue-300 text-blue-600 bg-blue-50",
                        heading.level === 3 && "border-green-300 text-green-600 bg-green-50"
                      )}
                    >
                      H{heading.level}
                    </Badge>
                    <span className="text-muted-foreground truncate">{heading.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Expandable Issues Panel */}
      <Collapsible open={showIssues} onOpenChange={setShowIssues}>
        <CollapsibleContent>
          <div className="px-4 py-3 border-t bg-background/50 max-h-48 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Validation Issues
            </div>
            <ul className="space-y-2">
              {issues.map((issue, idx) => (
                <li 
                  key={idx}
                  className={cn(
                    "text-xs p-2 rounded border",
                    issue.type === "error" 
                      ? "bg-red-50 border-red-200 text-red-700" 
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {issue.type === "error" ? (
                      <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-[10px] mt-1 opacity-75">{issue.suggestion}</p>
                      )}
                      {issue.fixable && (
                        <Badge variant="outline" className="text-[9px] mt-1 px-1 py-0">
                          Auto-fixable
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function AdvancedPreview({ post }: AdvancedPreviewProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [darkMode, setDarkMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Today (Preview)";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyCodeToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const { content: cleanContent } = useMemo(() => processBlogContent(post.contentMd), [post.contentMd]);

  // Get validation results and stats
  const validation = useMemo(() => {
    return validateBlogContent(post.contentMd, post.metaDescription || post.excerpt || undefined);
  }, [post.contentMd, post.metaDescription, post.excerpt]);

  // Extract headings for outline
  const headings = useMemo(() => {
    return extractHeadings(post.contentMd);
  }, [post.contentMd]);

  const readingTime = validation.stats.readingTimeMinutes;

  // Custom components for ReactMarkdown - matching production blog/post.tsx exactly
  const markdownComponents = useMemo(() => ({
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return <h1 id={id} className="scroll-mt-24" {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return <h2 id={id} className="scroll-mt-24" {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return <h3 id={id} className="scroll-mt-24" {...props}>{children}</h3>;
    },
    pre: ({ children }: { children?: React.ReactNode }) => {
      const code = React.isValidElement(children) && typeof children.props?.children === 'string'
        ? children.props.children
        : "";

      return (
        <div className="relative group my-6">
          <pre className="!mt-0 !mb-0">{children}</pre>
          <button
            onClick={() => copyCodeToClipboard(code)}
            className="absolute top-2 right-2 p-2 rounded bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy code"
          >
            {copiedCode === code ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      );
    },
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <figure className="my-10">
        <img
          src={src}
          alt={alt || ""}
          className="rounded-xl w-full cursor-pointer shadow-sm"
          loading="lazy"
          {...props}
        />
        {alt && (
          <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
      <a 
        href={href} 
        className="text-primary font-medium no-underline hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
  }), [copiedCode]);

  const deviceWidth = DEVICE_WIDTHS[device];

  return (
    <div className="bg-background min-h-screen rounded-lg border shadow-sm overflow-hidden">
      {/* Preview Controls */}
      <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Live Preview Mode</span>
        <div className="flex items-center gap-2">
          {/* Device Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice("desktop")}
              title="Desktop Preview"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={device === "tablet" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice("tablet")}
              title="Tablet Preview"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice("mobile")}
              title="Mobile Preview"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <PreviewStatsBar 
        stats={validation.stats}
        issues={validation.issues}
        headings={headings}
        isValid={validation.isValid}
      />

      {/* Device Frame */}
      <div className={cn(
        "p-4 overflow-x-auto",
        device !== "desktop" && "flex justify-center bg-muted/20"
      )}>
        <div
          className={cn(
            "transition-all duration-300",
            device !== "desktop" && "border rounded-xl shadow-lg overflow-hidden",
            device === "tablet" && "border-8 border-gray-800 rounded-[2rem]",
            device === "mobile" && "border-[12px] border-gray-900 rounded-[2.5rem]",
            darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
          )}
          style={{
            width: device === "desktop" ? "100%" : `${deviceWidth}px`,
            minHeight: device === "desktop" ? "auto" : "500px"
          }}
        >
          <article className={cn(
            "mx-auto p-8",
            device === "desktop" && "max-w-5xl lg:p-12",
            device === "tablet" && "max-w-full p-6",
            device === "mobile" && "max-w-full p-4"
          )}>
            {/* Header - matching production blog/post.tsx */}
            <header className="mb-10 max-w-3xl mx-auto text-center">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
                {post.title || "Untitled Post"}
              </h1>

              {post.excerpt && (
                <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8 font-serif">
                  {post.excerpt}
                </p>
              )}

              {/* Meta - matching production */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {post.authorAvatarUrl ? (
                    <img src={post.authorAvatarUrl} alt={post.authorName} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium text-foreground">{post.authorName}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readingTime} min read
                </span>
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImageUrl ? (
              <div className="max-w-4xl mx-auto aspect-[2/1] rounded-2xl overflow-hidden mb-12 bg-muted shadow-md">
                <img
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto aspect-[2.5/1] rounded-2xl overflow-hidden mb-12 bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
                No cover image selected
              </div>
            )}

            {/* Content with TOC - matching production layout */}
            <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-12 max-w-5xl mx-auto">
              {/* Main content - prose styles matching production */}
              <section
                ref={contentRef}
                className={cn(
                  "prose prose-lg max-w-[68ch] mx-auto",
                  "prose-headings:scroll-mt-24",
                  "prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline",
                  "prose-img:rounded-xl prose-img:shadow-md",
                  darkMode && "prose-invert"
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {cleanContent || "*Start writing to see preview...*"}
                </ReactMarkdown>
              </section>

              {/* Sticky TOC - desktop only, matching production */}
              {device === "desktop" && (
                <aside className="hidden lg:block h-full">
                  <div className="sticky top-24">
                    <div className={cn(
                      "text-sm font-semibold mb-4 tracking-wider uppercase",
                      darkMode ? "text-gray-400" : "text-muted-foreground"
                    )}>
                      Contents
                    </div>
                    <TableOfContents content={post.contentMd} />
                  </div>
                </aside>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
