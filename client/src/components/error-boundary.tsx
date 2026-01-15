import React, { Component, ReactNode, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Self-contained cache error detection to avoid circular imports
function isCacheRelatedError(error: Error): boolean {
  if (!error) return false;
  
  // Check for ChunkLoadError by name
  if (error.name === 'ChunkLoadError') return true;
  
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  const cacheErrorPatterns = [
    'chunkloaderror',
    'loading chunk',
    'loading css chunk',
    'failed to fetch dynamically imported module',
    'dynamically imported module',
    'unable to preload',
    'failed to load module script',
    'unexpected token \'<\'',
    'typeerror: failed to fetch',
  ];
  
  return cacheErrorPatterns.some(pattern => 
    message.includes(pattern) || stack.includes(pattern)
  );
}

// Lazy import for forceCompleteReset to avoid circular deps
async function performCacheReset(): Promise<void> {
  try {
    const { forceCompleteReset } = await import("@/lib/version-manager");
    await forceCompleteReset();
  } catch (e) {
    console.warn('[ErrorBoundary] Could not import version-manager, doing basic cleanup');
    // Fallback: clear caches manually
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    localStorage.clear();
  }
}

interface ComponentErrorInfo {
  componentStack: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ComponentErrorInfo) => void;
  onReset?: () => void;
  showReportButton?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ComponentErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  copied: boolean;
  showDetails: boolean;
  isCacheError: boolean;
  isClearingCache: boolean;
}

function generateErrorReport(error: Error, errorInfo?: ComponentErrorInfo | null): ErrorReport {
  return {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  static defaultProps = {
    showReportButton: true,
    maxRetries: 2,
    retryDelay: 1000,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      copied: false,
      showDetails: false,
      isCacheError: false,
      isClearingCache: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Check if this is a cache-related error
    const cacheError = isCacheRelatedError(error);
    return { hasError: true, error, isCacheError: cacheError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    const cacheError = isCacheRelatedError(error);
    this.setState({ 
      errorInfo: errorInfo as unknown as ComponentErrorInfo,
      isCacheError: cacheError,
    });
    
    this.props.onError?.(error, errorInfo as unknown as ComponentErrorInfo);
    
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo as unknown as ComponentErrorInfo);
    }
    
    // If this looks like a cache-related error, attempt automatic recovery
    if (cacheError && this.state.retryCount === 0) {
      console.log("[ErrorBoundary] Cache-related error detected, will offer cache clear option");
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private async reportError(error: Error, errorInfo: ComponentErrorInfo) {
    try {
      const report = generateErrorReport(error, errorInfo);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch("/api/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: {
            message: report.message?.slice(0, 500),
            code: "REACT_ERROR",
          },
          timestamp: report.timestamp,
          url: report.url?.replace(/[?#].*$/, ''),
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    } catch {
    }
  }

  private handleRetry = () => {
    const { maxRetries = 2, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    const delay = retryDelay * Math.pow(2, retryCount);

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        retryCount: retryCount + 1,
      });
      this.props.onReset?.();
    }, delay);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const report = generateErrorReport(error, errorInfo);
    const text = JSON.stringify(report, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
    }
  };

  private handleToggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  private handleClearCache = async () => {
    this.setState({ isClearingCache: true });
    
    try {
      console.log("[ErrorBoundary] Clearing all caches for recovery...");
      
      // Use the version manager's complete reset function
      await performCacheReset();
      
      // Clear service worker cache via global function
      if (typeof window.__clearServiceWorkerCache === 'function') {
        await window.__clearServiceWorkerCache();
      }
      
      // Force update service worker
      if (typeof window.__forceServiceWorkerUpdate === 'function') {
        await window.__forceServiceWorkerUpdate();
      }
      
      console.log("[ErrorBoundary] Cache cleared, reloading...");
      
      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Hard reload to bypass all caches
      window.location.href = window.location.href.split('#')[0] + '?cache_bust=' + Date.now();
    } catch (e) {
      console.error("[ErrorBoundary] Failed to clear cache:", e);
      // Fall back to simple reload
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRetrying, copied, showDetails, isCacheError, isClearingCache } = this.state;
    const { children, fallback, maxRetries = 2 } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    const canRetry = retryCount < maxRetries;
    const isDev = process.env.NODE_ENV === "development";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              {isCacheError 
                ? "This looks like a cache issue. Clearing your browser cache should fix it."
                : "We encountered an unexpected error. Don't worry, your data is safe."
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isCacheError && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This error is likely caused by outdated cached files. Click "Clear Cache & Reload" to fix it automatically.
                </p>
              </div>
            )}
            
            {retryCount > 0 && !isCacheError && (
              <p className="text-sm text-muted-foreground text-center">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}

            {isDev && error && (
              <div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between" 
                  onClick={this.handleToggleDetails}
                  data-testid="button-toggle-error-details"
                >
                  <span className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Error Details
                  </span>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {showDetails && (
                  <div className="bg-muted/50 p-4 rounded-lg mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Error message</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.handleCopyError}
                        className="h-6 px-2"
                        data-testid="button-copy-error"
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-mono text-destructive break-all">
                      {error.message}
                    </p>
                    {error.stack && (
                      <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-40 mt-2">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {isCacheError ? (
              <>
                <Button
                  onClick={this.handleClearCache}
                  disabled={isClearingCache}
                  className="w-full"
                  data-testid="button-clear-cache"
                >
                  {isClearingCache ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Clearing Cache...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache & Reload
                    </>
                  )}
                </Button>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={this.handleReload}
                    className="flex-1"
                    data-testid="button-reload"
                    disabled={isClearingCache}
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={this.handleGoHome}
                    className="flex-1"
                    data-testid="button-go-home"
                    disabled={isClearingCache}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3 w-full">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      disabled={isRetrying}
                      className="flex-1"
                      data-testid="button-retry"
                    >
                      {isRetrying ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={this.handleReload}
                    className="flex-1"
                    data-testid="button-reload"
                  >
                    Reload Page
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={this.handleGoHome}
                  className="w-full"
                  data-testid="button-go-home"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      console.error("Unhandled promise rejection:", error);
      
      // Check if it's a cache-related error and attempt auto-recovery
      if (isCacheRelatedError(error)) {
        console.log("[AsyncErrorBoundary] Cache-related error detected, attempting recovery...");
        try {
          await performCacheReset();
          window.location.reload();
          return; // Don't set error state, we're reloading
        } catch (e) {
          console.error("[AsyncErrorBoundary] Auto-recovery failed:", e);
        }
      }
      
      setError(error);
      onError?.(error);
    };

    const handleError = async (event: ErrorEvent) => {
      const err = event.error || new Error(event.message);
      console.error("Unhandled error:", err);
      
      // Check if it's a cache-related error and attempt auto-recovery
      if (isCacheRelatedError(err)) {
        console.log("[AsyncErrorBoundary] Cache-related error detected, attempting recovery...");
        try {
          await performCacheReset();
          window.location.reload();
          return; // Don't set error state, we're reloading
        } catch (e) {
          console.error("[AsyncErrorBoundary] Auto-recovery failed:", e);
        }
      }
      
      setError(err);
      onError?.(err);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <ErrorBoundary>
        <ErrorThrower error={error} />
      </ErrorBoundary>
    );
  }

  return <>{children}</>;
}

function ErrorThrower({ error }: { error: Error }): never {
  throw error;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundary;
}
