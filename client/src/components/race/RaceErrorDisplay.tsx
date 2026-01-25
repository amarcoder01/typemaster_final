import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WifiOff, XCircle, Users, Timer, AlertTriangle, RefreshCw, Home } from "lucide-react";

// Error types for better error handling
export type ErrorType = "network" | "race_not_found" | "race_full" | "race_started" | "websocket" | "unknown";

export interface ErrorState {
  type: ErrorType;
  message: string;
  canRetry: boolean;
  retryAction?: () => void;
}

interface RaceErrorDisplayProps {
  error: ErrorState;
  onRetry?: () => void;
  onGoBack: () => void;
}

export function RaceErrorDisplay({ error, onRetry, onGoBack }: RaceErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case "network":
      case "websocket":
        return <WifiOff className="h-12 w-12 text-yellow-500" />;
      case "race_not_found":
        return <XCircle className="h-12 w-12 text-red-500" />;
      case "race_full":
        return <Users className="h-12 w-12 text-orange-500" />;
      case "race_started":
        return <Timer className="h-12 w-12 text-orange-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case "network": return "Connection Problem";
      case "websocket": return "Live Connection Lost";
      case "race_not_found": return "Race Not Found";
      case "race_full": return "Race is Full";
      case "race_started": return "Race Already Started";
      default: return "Something Went Wrong";
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {getErrorIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{getErrorTitle()}</h2>
                <p className="text-muted-foreground mt-2">{error.message}</p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                {error.canRetry && onRetry && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onRetry} className="w-full" data-testid="button-retry">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Retry</p>
                      <p className="text-zinc-400">Attempt to reconnect or reload the race</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={onGoBack} className="w-full" data-testid="button-go-back">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Multiplayer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to the multiplayer lobby</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
