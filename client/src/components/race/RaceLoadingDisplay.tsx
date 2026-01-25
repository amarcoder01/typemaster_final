import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RaceLoadingDisplayProps {
  message: string;
  subMessage?: string;
}

export function RaceLoadingDisplay({ message, subMessage }: RaceLoadingDisplayProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Loading race data from server</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <p className="text-lg font-medium">{message}</p>
            {subMessage && (
              <p className="text-sm text-muted-foreground mt-1">{subMessage}</p>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
