import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useSEO } from "@/lib/seo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AuthorCard,
  BlogCard,
  ShareButtons,
  TableOfContents,
  ReadingProgress
} from "./components";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  User,
  BookOpen,
  MessageCircle,
  Bookmark,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  coverImageUrl: string | null;
  authorName: string;
  authorBio: string | null;
  authorAvatarUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  wordCount?: number;
  readingTimeMinutes?: number;
  tags?: string[];
}

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/post/${slug}`, { signal: controller.signal });
        if (!res.ok) {
          setPost(null);
          setRelated([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPost(data.post || null);
        setRelated((data.related || []).slice(0, 4));

        // Record view
        if (data.post) {
          fetch(`/api/blog/post/${slug}/view`, { method: "POST" }).catch(() => { });
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setPost(null);
          setRelated([]);
        }
      }
      setLoading(false);
    };

    if (slug) fetchPost();
    return () => controller.abort();
  }, [slug]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useSEO({
    title: post?.metaTitle || post?.title ? `${post.metaTitle || post.title} | TypeMasterAI Blog` : "Blog Article | TypeMasterAI",
    description: post?.metaDescription || post?.excerpt || "Read this article on the TypeMasterAI blog.",
    keywords: "typing blog, article",
    canonical: `/blog/${slug}`,
    ogUrl: `/blog/${slug}`,
    structuredData: post ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt || "",
      "image": post.coverImageUrl || undefined,
      "author": {
        "@type": "Person",
        "name": post.authorName,
      },
      "publisher": {
        "@type": "Organization",
        "name": "TypeMasterAI",
        "logo": {
          "@type": "ImageObject",
          "url": "https://typemasterai.com/icon-512x512.png",
        },
      },
      "datePublished": post.publishedAt,
      "dateModified": post.updatedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://typemasterai.com/blog/${slug}`,
      },
    } : undefined,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
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

  // Custom components for ReactMarkdown
  const markdownComponents = useMemo(() => ({
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return <h1 id={id} className="scroll-mt-24 !text-3xl sm:!text-4xl !font-bold !tracking-tight" {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return (
        <h2 id={id} className="scroll-mt-24 !text-2xl sm:!text-3xl !font-bold !tracking-tight !mt-12 !mb-6 !border-b !pb-3" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return <h3 id={id} className="scroll-mt-24 !text-xl sm:!text-2xl !font-semibold !mt-8 !mb-4" {...props}>{children}</h3>;
    },
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => (
      <p className="!leading-relaxed !text-base sm:!text-lg !text-foreground/90" {...props}>{children}</p>
    ),
    pre: ({ children }: { children?: React.ReactNode }) => {
      const code = React.isValidElement(children) && typeof children.props?.children === 'string'
        ? children.props.children
        : "";

      return (
        <div className="relative group my-8 rounded-xl overflow-hidden border border-border/50 shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-10 bg-muted/80 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">Code</span>
          </div>
          <pre className="!mt-0 !mb-0 !pt-14 !rounded-xl !bg-zinc-950 dark:!bg-zinc-900">{children}</pre>
          <button
            onClick={() => copyCodeToClipboard(code)}
            className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-background"
            title="Copy code"
          >
            {copiedCode === code ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      );
    },
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement> & { children?: React.ReactNode }) => (
      <blockquote 
        className="!border-l-4 !border-primary !bg-primary/5 !py-4 !px-6 !my-8 !rounded-r-xl !italic !text-foreground/80" 
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement> & { children?: React.ReactNode }) => (
      <ul className="!my-6 !space-y-3" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement> & { children?: React.ReactNode }) => (
      <ol className="!my-6 !space-y-3" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement> & { children?: React.ReactNode }) => (
      <li className="!leading-relaxed !pl-2" {...props}>{children}</li>
    ),
    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
      <a 
        href={href} 
        className="!text-primary !font-medium !no-underline hover:!underline !underline-offset-4 !decoration-2 !transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <figure className="my-10">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50">
          <img
            src={src}
            alt={alt || ""}
            className="w-full cursor-pointer hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
            {...props}
          />
        </div>
        {alt && (
          <figcaption className="text-center text-sm text-muted-foreground mt-4 italic">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement> & { children?: React.ReactNode }) => (
      <div className="my-8 overflow-x-auto rounded-xl border border-border/50 shadow-sm">
        <table className="!my-0 !w-full" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) => (
      <th className="!bg-muted/50 !font-semibold !text-left !px-4 !py-3" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) => (
      <td className="!px-4 !py-3 !border-t" {...props}>{children}</td>
    ),
  }), [copiedCode]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-14 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="aspect-[2/1] w-full rounded-2xl mb-12" />
        <div className="space-y-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center px-4">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The article you're looking for doesn't exist or has been removed. Try browsing our other articles.
        </p>
        <Link href="/blog">
          <Button size="lg" className="group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ReadingProgress contentRef={contentRef} />

      {/* Floating scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110",
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <article className="min-h-screen">
        {/* Hero Section with Cover Image */}
        {post.coverImageUrl && (
          <div className="relative w-full h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className={cn(
          "max-w-5xl mx-auto px-4",
          post.coverImageUrl ? "-mt-32 relative z-10" : "pt-8 lg:pt-12"
        )}>
          {/* Navigation */}
          <div className="mb-8">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="-ml-2 hover:bg-background/80 backdrop-blur-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Header */}
          <header className={cn(
            "mb-12 max-w-3xl",
            post.coverImageUrl && "bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-border/50"
          )}>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <Link key={tag} href={`/blog/tag/${tag}`}>
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 tracking-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                {post.authorAvatarUrl ? (
                  <img src={post.authorAvatarUrl} alt={post.authorName} className="w-12 h-12 rounded-full ring-2 ring-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-border">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-foreground block">{post.authorName}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(post.publishedAt)}</span>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-10 hidden sm:block" />
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {post.readingTimeMinutes && (
                  <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4" />
                    {post.readingTimeMinutes} min read
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Content with TOC */}
          <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-16 max-w-5xl mx-auto">
            {/* Main content */}
            <section
              ref={contentRef}
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold
                prose-p:text-foreground/90
                prose-strong:text-foreground
                prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {post.contentMd}
              </ReactMarkdown>
            </section>

            {/* Sticky TOC - desktop only */}
            <aside className="hidden lg:block h-full">
              <div className="sticky top-24 space-y-8">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-4 tracking-wider uppercase flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    On This Page
                  </div>
                  <TableOfContents content={post.contentMd} />
                </div>
                
                {/* Quick Actions */}
                <div className="pt-6 border-t">
                  <div className="text-xs font-semibold text-muted-foreground mb-4 tracking-wider uppercase">
                    Share
                  </div>
                  <ShareButtons url={`/blog/${slug}`} title={post.title} />
                </div>
              </div>
            </aside>
          </div>

          {/* Footer Actions */}
          <div className="max-w-3xl mx-auto mt-16 pt-8 border-t space-y-10">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium mr-2">Tagged:</span>
                {post.tags.map(tag => (
                  <Link key={tag} href={`/blog/tag/${tag}`}>
                    <Badge 
                      variant="outline" 
                      className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                    >
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Share - Mobile */}
            <div className="lg:hidden flex items-center justify-between py-4 px-6 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground font-medium">Share this article</span>
              <ShareButtons url={`/blog/${slug}`} title={post.title} />
            </div>

            <AuthorCard
              author={{
                name: post.authorName,
                bio: post.authorBio,
                avatarUrl: post.authorAvatarUrl,
              }}
              publishedAt={post.publishedAt}
            />
          </div>

          {/* Related Posts */}
          {related.length > 0 && (
            <section className="mt-20 pt-12 border-t">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Continue Reading</h2>
                <p className="text-muted-foreground">More articles you might enjoy</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {related.map(r => (
                  <BlogCard key={r.id} post={r} variant="horizontal" />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
