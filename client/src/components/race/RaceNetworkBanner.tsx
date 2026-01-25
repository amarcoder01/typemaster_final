import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WifiOff, RefreshCw, Info } from "lucide-react";

interface NetworkStatusBannerProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  maxAttempts: number;
  onManualRetry: () => void;
}

export function RaceNetworkBanner({
  isConnected,
  isReconnecting,
  reconnectAttempt,
  maxAttempts,
  onManualRetry
}: NetworkStatusBannerProps) {
  if (isConnected) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Alert variant="destructive" className="mb-4 border-yellow-500/50 bg-yellow-500/10">
        <WifiOff className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {isReconnecting ? "Reconnecting..." : "Connection Lost"}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">WebSocket Disconnected</p>
              <p className="text-zinc-400">Your live connection to the race server was interrupted. We're trying to reconnect automatically.</p>
            </TooltipContent>
          </Tooltip>
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {isReconnecting
              ? `Attempt ${reconnectAttempt} of ${maxAttempts}...`
              : "Your progress is saved. Click retry to reconnect."}
          </span>
          {!isReconnecting && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onManualRetry} data-testid="button-manual-reconnect">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Retry
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manually attempt to reconnect</p>
              </TooltipContent>
            </Tooltip>
          )}
        </AlertDescription>
      </Alert>
    </TooltipProvider>
  );
}
