import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, X, FileText } from "lucide-react";

interface SearchResult {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
}

interface BlogSearchProps {
  className?: string;
}

export function BlogSearch({ className = "" }: BlogSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search on query change
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/posts?limit=5`);
        if (res.ok) {
          const data = await res.json();
          // Client-side filtering for now
          const filtered = (data.posts || []).filter((post: any) =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            (post.excerpt || "").toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered.slice(0, 5));
        }
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = () => {
    setQuery("");
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={`/blog/${result.slug}`}
                    onClick={handleSelect}
                    className="flex items-start gap-3 p-3 hover:bg-muted transition-colors"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium line-clamp-1">{result.title}</div>
                      {result.excerpt && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {result.excerpt}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

