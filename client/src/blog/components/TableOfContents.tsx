import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className = "" }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Parse headings from markdown
  useEffect(() => {
    const lines = content.split("\n");
    const items: TocItem[] = [];
    let inCodeBlock = false;
    
    lines.forEach((line) => {
      // Track code blocks to avoid parsing headings inside them
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      if (inCodeBlock) return;
      
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*`\[\]]/g, "").trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        items.push({ id, text, level });
      }
    });
    
    setHeadings(items);
  }, [content]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];
      
      const scrollPosition = window.scrollY + 120;
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        if (headingElements[i].offsetTop <= scrollPosition) {
          setActiveId(headings[i].id);
          return;
        }
      }
      
      if (headings.length > 0) {
        setActiveId(headings[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  if (headings.length < 2) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <nav className={cn("relative", className)}>
      {/* Progress line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      
      <ul className="space-y-1 pl-4">
        {headings.map((heading, idx) => {
          const isActive = activeId === heading.id;
          const indent = (heading.level - 1) * 12;
          
          return (
            <li
              key={`${heading.id}-${idx}`}
              style={{ paddingLeft: `${indent}px` }}
              className="relative"
            >
              {/* Active indicator line */}
              {isActive && (
                <div 
                  className="absolute -left-4 top-0 bottom-0 w-0.5 bg-primary rounded-full"
                  style={{ left: `-${indent + 16}px` }}
                />
              )}
              
              <button
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "text-sm text-left w-full py-1.5 rounded-md px-2 -ml-2 transition-all duration-200",
                  "hover:bg-muted hover:text-foreground",
                  isActive
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground",
                  heading.level === 3 && "text-xs"
                )}
              >
                <span className="line-clamp-2">{heading.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
