import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
  contentRef: React.RefObject<HTMLElement>;
}

export function ReadingProgress({ contentRef }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Show progress bar after scrolling past hero
      setIsVisible(scrollTop > 100);

      // Calculate how far we've scrolled through the content
      const start = elementTop - windowHeight;
      const end = elementTop + elementHeight;
      const current = scrollTop - start;
      const total = end - start;

      const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
      setProgress(percentage);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, [contentRef]);

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Background track */}
      <div className="h-1 bg-muted/50 backdrop-blur-sm">
        {/* Progress bar with gradient */}
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-150 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Glow effect at the end */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full blur-md opacity-50" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-foreground rounded-full" />
        </div>
      </div>
      
      {/* Progress percentage indicator */}
      {progress > 5 && progress < 95 && (
        <div 
          className={cn(
            "absolute top-3 text-xs font-medium text-primary bg-background/95 backdrop-blur-sm px-2 py-0.5 rounded-full border shadow-sm transition-all",
            progress < 10 ? "left-2" : ""
          )}
          style={{ left: progress >= 10 ? `calc(${progress}% - 24px)` : undefined }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}
