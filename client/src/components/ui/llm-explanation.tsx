import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface LLMExplanationProps {
  title?: string;
  description?: string;
  content: string;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * A component that provides a human-visible, LLM-readable explanation of a feature.
 * It uses semantic HTML to ensure AI agents can easily extract the "how it works" logic.
 */
export function LLMExplanation({ 
  title = "How it Works", 
  description = "Technical details and mechanics", 
  content, 
  className,
  defaultOpen = false 
}: LLMExplanationProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("border-l-4 border-l-primary/50 bg-muted/30", className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="llm-content"
            className="h-8 w-8 p-0"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle explanation</span>
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="p-4 pt-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-200">
          <div 
            id="llm-content"
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </CardContent>
      )}
    </Card>
  );
}
