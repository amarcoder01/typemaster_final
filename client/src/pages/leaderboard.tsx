import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Clock, Target, ChevronLeft, ChevronRight, ShieldCheck, User, AlertCircle, RefreshCw, WifiOff, Ban, Globe, HelpCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useSEO, SEO_CONFIGS } from '@/lib/seo';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { fetchLeaderboardWithRank } from "@/lib/leaderboard-api";
import { useLeaderboardWebSocket } from "@/hooks/useLeaderboardWebSocket";
import { cn } from "@/lib/utils";
import { AuthPrompt } from "@/components/auth-prompt";

type Timeframe = "all" | "daily" | "weekly" | "monthly";

interface LeaderboardEntry {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  mode: number;
  totalTests: number;
  rank: number | string;
  avatarColor?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface ErrorState {
  type: "network" | "rate_limit" | "auth" | "server" | "timeout" | "unknown";
  message: string;
  retryable: boolean;
}

const TIMEFRAME_TOOLTIPS: Record<Timeframe, string> = {
  all: "Rankings based on all-time best scores since the beginning",
  daily: "Rankings based on best scores from today (resets at midnight)",
  weekly: "Rankings based on best scores from this week (resets Sunday)",
  monthly: "Rankings based on best scores from this month (resets on the 1st)",
};

const MEDAL_TOOLTIPS: Record<number, { label: string; description: string }> = {
  1: { label: "Gold Medal", description: "1st Place - Top performer!" },
  2: { label: "Silver Medal", description: "2nd Place - Outstanding!" },
  3: { label: "Bronze Medal", description: "3rd Place - Excellent work!" },
};

function classifyError(error: unknown, response?: Response): ErrorState {
  if (!navigator.onLine) {
    return {
      type: "network",
      message: "You're offline. Please check your internet connection.",
      retryable: true,
    };
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return {
        type: "timeout",
        message: "Request timed out. Please try again.",
        retryable: true,
      };
    }
    if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
      return {
        type: "network",
        message: "Network error. Please check your connection and try again.",
        retryable: true,
      };
    }
  }

  if (response) {
    if (response.status === 429) {
      return {
        type: "rate_limit",
        message: "Too many requests. Please wait a moment before trying again.",
        retryable: true,
      };
    }
    if (response.status === 401 || response.status === 419) {
      return {
        type: "auth",
        message: "Session expired. Please refresh the page or log in again.",
        retryable: false,
      };
    }
    if (response.status >= 500) {
      return {
        type: "server",
        message: "Server error. Our team has been notified. Please try again later.",
        retryable: true,
      };
    }
  }

  return {
    type: "unknown",
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
    retryable: true,
  };
}

function getErrorIcon(type: ErrorState["type"]) {
  switch (type) {
    case "network":
      return <WifiOff className="w-12 h-12 text-orange-500 mb-4" />;
    case "rate_limit":
      return <Ban className="w-12 h-12 text-yellow-500 mb-4" />;
    case "timeout":
      return <Clock className="w-12 h-12 text-blue-500 mb-4" />;
    default:
      return <AlertCircle className="w-12 h-12 text-destructive mb-4" />;
  }
}

function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
    return value;
  }
  const parsed = parseFloat(String(value));
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

function safeString(value: unknown, defaultValue: string = "Unknown"): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return defaultValue;
}

class LeaderboardError extends Error {
  constructor(
    message: string,
    public readonly errorType: ErrorState["type"],
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "LeaderboardError";
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese",
  hi: "Hindi",
  ru: "Russian",
  ar: "Arabic",
  ko: "Korean",
  mr: "Marathi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  vi: "Vietnamese",
  tr: "Turkish",
  pl: "Polish",
  nl: "Dutch",
  sv: "Swedish",
  th: "Thai",
  id: "Indonesian",
};

const VALID_LANGUAGES = Object.keys(LANGUAGE_NAMES);

const LANGUAGE_DESCRIPTIONS: Record<string, string> = {
  en: "Most popular - Global competitive leaderboard",
  es: "Second most popular - Large Spanish-speaking community",
  fr: "Active French typing community",
  de: "German language typing excellence",
  it: "Italian keyboard mastery",
  pt: "Portuguese (Brazil & Portugal)",
  ja: "Japanese (Hiragana, Katakana, Kanji)",
  zh: "Chinese (Simplified & Traditional)",
  hi: "Hindi - Devanagari script",
  ru: "Russian - Cyrillic script",
  ar: "Arabic - Right-to-left script",
  ko: "Korean - Hangul script",
  mr: "Marathi - Devanagari script",
  bn: "Bengali - Bengali script",
  ta: "Tamil - Tamil script",
  te: "Telugu - Telugu script",
  vi: "Vietnamese with diacritics",
  tr: "Turkish language typing",
  pl: "Polish language typing",
  nl: "Dutch language typing",
  sv: "Swedish language typing",
  th: "Thai script typing",
  id: "Indonesian language typing",
};

type SortOption = "rank" | "wpm" | "accuracy" | "tests";

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
  { value: "rank", label: "Rank", description: "Default ranking by WPM" },
  { value: "wpm", label: "WPM", description: "Sort by words per minute" },
  { value: "accuracy", label: "Accuracy", description: "Sort by typing accuracy" },
  { value: "tests", label: "Tests", description: "Sort by total tests completed" },
];

function LeaderboardContent() {
  useSEO(SEO_CONFIGS.leaderboard);
  const queryClient = useQueryClient();
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [offset, setOffset] = useState(0);
  const [language, setLanguage] = useState<string>("en");
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
  const limit = 15;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["leaderboard", timeframe, offset, limit, language],
    queryFn: async ({ signal }) => {
      const timeoutSignal = AbortSignal.timeout(15000);
      const combinedController = new AbortController();

      const abortHandler = () => combinedController.abort();
      signal.addEventListener("abort", abortHandler);
      timeoutSignal.addEventListener("abort", abortHandler);

      try {
        const response = await fetch(
          `/api/leaderboard?limit=${limit}&offset=${offset}&timeframe=${timeframe}&language=${language}`,
          { signal: combinedController.signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const classified = classifyError(new Error(errorData.message || "Request failed"), response);
          throw new LeaderboardError(classified.message, classified.type, classified.retryable);
        }

        return response.json();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          if (timeoutSignal.aborted) {
            throw new LeaderboardError("Request timed out. Please try again.", "timeout", true);
          }
          throw err;
        }
        if (err instanceof LeaderboardError) throw err;
        const classified = classifyError(err);
        throw new LeaderboardError(classified.message, classified.type, classified.retryable);
      } finally {
        signal.removeEventListener("abort", abortHandler);
        timeoutSignal.removeEventListener("abort", abortHandler);
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.name === "AbortError") return false;
      if (err instanceof LeaderboardError && err.errorType === "auth") return false;
      if (err instanceof LeaderboardError && err.errorType === "timeout") return false;
      if (err instanceof LeaderboardError && !err.retryable) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  useEffect(() => {
    if (data?.pagination && offset >= data.pagination.total && offset > 0 && data.pagination.total > 0) {
      const newOffset = Math.max(0, Math.floor((data.pagination.total - 1) / limit) * limit);
      if (newOffset !== offset) {
        setOffset(newOffset);
      }
    }
  }, [data?.pagination, offset, limit]);

  const errorState: ErrorState | null = error instanceof LeaderboardError
    ? { type: error.errorType, message: error.message, retryable: error.retryable }
    : error instanceof Error
      ? classifyError(error)
      : null;

  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
    staleTime: 60000,
  });

  // Batched query for leaderboard + user rank (more efficient)
  const { data: batchedData, isLoading: batchedLoading } = useQuery({
    queryKey: ["leaderboard-batched", timeframe, language, limit, offset, userData?.user?.id],
    queryFn: async () => {
      return fetchLeaderboardWithRank(
        userData?.user?.id,
        timeframe,
        language,
        limit,
        offset
      );
    },
    staleTime: 300000, // 5 minutes to match server cache
    retry: 1,
    enabled: !!data, // Only fetch after main leaderboard data is available
  });

  // Use batched data if available, otherwise fall back to separate queries
  const aroundMeData = batchedData?.aroundMe || null;
  const aroundMeLoading = batchedLoading;

  // Real-time WebSocket updates
  const [liveEntries, setLiveEntries] = useState<LeaderboardEntry[]>([]);
  const [realtimeUpdateCount, setRealtimeUpdateCount] = useState(0);

  const { isConnected: wsConnected, lastUpdate, isReconnecting, connectionState, isUsingFallback } = useLeaderboardWebSocket({
    mode: 'global',
    timeframe,
    language,
    userId: userData?.user?.id,
    enabled: true,
    onUpdate: (update) => {
      setRealtimeUpdateCount(prev => prev + 1);
      
      // Mark entry as recently updated for animation
      setRecentlyUpdatedIds(prev => new Set([...prev, update.entry.userId]));
      
      // Clear the animation after 3 seconds
      setTimeout(() => {
        setRecentlyUpdatedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(update.entry.userId);
          return newSet;
        });
      }, 3000);

      // Update the entries list with the new data
      setLiveEntries(prevEntries => {
        const existingIndex = prevEntries.findIndex(e => e.userId === update.entry.userId);

        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...prevEntries];
          updated[existingIndex] = {
            ...updated[existingIndex],
            rank: update.entry.rank,
            wpm: update.entry.wpm,
            accuracy: update.entry.accuracy,
          };
          return updated;
        } else if (update.updateType === 'new_entry' || update.type === 'new_entry') {
          // Add new entry (supports both old and new message format)
          return [...prevEntries, {
            userId: update.entry.userId,
            username: update.entry.username,
            rank: update.entry.rank,
            wpm: update.entry.wpm,
            accuracy: update.entry.accuracy,
            mode: update.entry.mode || 60,
            totalTests: 1,
            avatarColor: update.entry.avatarColor,
            isVerified: update.entry.isVerified,
          }];
        }

        return prevEntries;
      });
    },
  });

  // Auto-refetch when WebSocket update is for current user (ensures rank shows immediately after test)
  useEffect(() => {
    if (lastUpdate && userData?.user?.id && lastUpdate.entry?.userId === userData.user.id) {
      // Invalidate and refetch leaderboard data when current user's data is updated
      queryClient.invalidateQueries({ queryKey: ["leaderboard-batched"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  }, [lastUpdate, userData?.user?.id, queryClient]);

  // Merge live updates with cached data and apply sorting
  const entries: LeaderboardEntry[] = useMemo(() => {
    const baseEntries = data?.entries || [];
    let result = [...baseEntries];

    // If we have live updates, merge them
    if (liveEntries.length > 0) {
      liveEntries.forEach(liveEntry => {
        const existingIndex = result.findIndex(e => e.userId === liveEntry.userId);
        if (existingIndex >= 0) {
          result[existingIndex] = liveEntry;
        } else {
          result.push(liveEntry);
        }
      });
    }

    // Apply sorting
    const sortFn = (a: LeaderboardEntry, b: LeaderboardEntry) => {
      let comparison = 0;
      switch (sortBy) {
        case "wpm":
          comparison = safeNumber(a.wpm) - safeNumber(b.wpm);
          break;
        case "accuracy":
          comparison = safeNumber(a.accuracy) - safeNumber(b.accuracy);
          break;
        case "tests":
          comparison = safeNumber(a.totalTests) - safeNumber(b.totalTests);
          break;
        case "rank":
        default:
          // For rank, lower is better so reverse the comparison
          comparison = safeNumber(b.rank) - safeNumber(a.rank);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    };

    return result.sort(sortFn);
  }, [data?.entries, liveEntries, sortBy, sortOrder]);
  const pagination = data?.pagination || { total: 0, hasMore: false };
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / limit));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as Timeframe);
    setOffset(0);
  };

  const handleLanguageChange = (value: string) => {
    // Validate language code
    if (!VALID_LANGUAGES.includes(value)) {
      console.error(`Invalid language code: ${value}. Defaulting to English.`);
      setLanguage("en");
      setOffset(0);
      return;
    }

    // Prevent rapid switching (debounce)
    setLanguage(value);
    setOffset(0);
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (pagination.hasMore && offset + limit < pagination.total) {
      setOffset(offset + limit);
    }
  };

  const formatTestMode = (seconds: number) => {
    const safeSeconds = safeNumber(seconds, 60);
    if (safeSeconds < 60) return `${safeSeconds}s`;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getTimeframeLabel = (tf: Timeframe) => {
    switch (tf) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      default: return "All Time";
    }
  };

  const getEmptyStateMessage = (tf: Timeframe, lang: string) => {
    const langName = LANGUAGE_NAMES[lang] || "this language";
    const timeLabel = tf === "all" ? "yet" : tf === "daily" ? "today" : tf === "weekly" ? "this week" : "this month";

    switch (tf) {
      case "daily":
        return {
          title: `No ${langName} tests completed today`,
          subtitle: `Be the first to set a ${langName} record today!`
        };
      case "weekly":
        return {
          title: `No ${langName} tests completed this week`,
          subtitle: `Start the week strong with a ${langName} record!`
        };
      case "monthly":
        return {
          title: `No ${langName} tests completed this month`,
          subtitle: `Be the first on the monthly ${langName} leaderboard!`
        };
      default:
        return {
          title: `No ${langName} test results yet`,
          subtitle: `Complete a ${langName} typing test to appear on this leaderboard!`
        };
    }
  };

  const connectionBanner = useMemo(() => {
    if (!isOnline) return "offline";
    if (isUsingFallback) return "fallback";
    if (connectionState === "reconnecting" || isReconnecting) return "reconnecting";
    if (connectionState === "failed") return "failed";
    if (wsConnected) return "live";
    return "none";
  }, [isOnline, isUsingFallback, connectionState, isReconnecting, wsConnected]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="max-w-5xl mx-auto px-4 sm:px-0">
        {/* Offline warning - only show when truly offline */}
        {connectionBanner === "offline" && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2 text-orange-500">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">You're offline. Some features may not work.</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative p-2.5 sm:p-3 rounded-full bg-primary/10 text-primary cursor-help">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                {/* Live indicator dot */}
                {connectionBanner === "live" && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
                {connectionBanner === "reconnecting" && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                  </span>
                )}
                {(connectionBanner === "failed" || connectionBanner === "offline") && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium">Global Leaderboard</p>
              <p className="text-xs text-muted-foreground mt-1">
                Compare your typing speed with players worldwide. Rankings are based on your best WPM score.
              </p>
              {connectionBanner === "live" && (
                <p className="text-xs text-green-500 mt-1">Live updates active</p>
              )}
              {connectionBanner === "reconnecting" && (
                <p className="text-xs text-yellow-500 mt-1">Reconnecting...</p>
              )}
            </TooltipContent>
          </Tooltip>
          <h1 className="text-2xl sm:text-3xl font-bold">Global Leaderboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Top typists worldwide</p>
          <a
            href="/leaderboards"
            className="text-xs text-primary hover:underline mt-1"
          >
            View all leaderboards →
          </a>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 w-full sm:w-auto">
              <SearchableSelect
                value={timeframe}
                onValueChange={(v) => handleTimeframeChange(v)}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "daily", label: "Today" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]}
                placeholder="Select period"
                searchPlaceholder="Search period..."
                emptyText="No period found."
                icon={<Clock className="w-4 h-4" />}
                triggerClassName="w-full sm:w-[180px]"
                contentClassName="max-h-[300px] overflow-y-auto"
                data-testid="timeframe-dropdown"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SearchableSelect
                      value={language}
                      onValueChange={handleLanguageChange}
                      options={VALID_LANGUAGES.map((code) => ({
                        value: code,
                        label: LANGUAGE_NAMES[code],
                      }))}
                      placeholder="Select language"
                      searchPlaceholder="Search languages..."
                      emptyText="No language found."
                      icon={<Globe className="w-4 h-4" />}
                      triggerClassName="w-full sm:w-[180px]"
                      contentClassName="max-h-[300px] overflow-y-auto"
                      data-testid="language-selector"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0"
                      aria-label="Language help"
                      data-testid="language-help-button"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm" side="bottom">
                  <div className="space-y-2">
                    <p className="font-medium">Language Filter</p>
                    <p className="text-xs text-muted-foreground">
                      Filter leaderboard by typing language. Only scores from tests typed in the selected language will appear.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Current:</strong> {LANGUAGE_NAMES[language]} - {LANGUAGE_DESCRIPTIONS[language]}
                    </p>
                    <p className="text-xs text-primary">
                      💡 Supports 23 languages with search functionality
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <SearchableSelect
                        value={sortBy}
                        onValueChange={(v) => setSortBy(v as SortOption)}
                        options={SORT_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        }))}
                        placeholder="Sort by"
                        searchPlaceholder="Search..."
                        emptyText="No option found."
                        icon={<ArrowUpDown className="w-4 h-4" />}
                        triggerClassName="w-full sm:w-[130px]"
                        contentClassName="max-h-[300px] overflow-y-auto"
                        data-testid="sort-by-dropdown"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                        className="h-9 w-9"
                        aria-label={sortOrder === "desc" ? "Sort descending" : "Sort ascending"}
                      >
                        {sortOrder === "desc" ? (
                          <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowUp className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort by {SORT_OPTIONS.find(o => o.value === sortBy)?.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sortOrder === "desc" ? "Highest first" : "Lowest first"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {userData?.user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                    <User className="w-4 h-4" />
                    {aroundMeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : aroundMeData?.userRank && aroundMeData.userRank > 0 ? (
                      <span>Your rank: <strong className="text-foreground">#{aroundMeData.userRank}</strong></span>
                    ) : (
                      <span className="text-muted-foreground">Not ranked in {getTimeframeLabel(timeframe).toLowerCase()}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your position in the {getTimeframeLabel(timeframe).toLowerCase()} leaderboard</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>


        {/* Your Rank Card - Prominent Display */}
        {userData?.user && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              {aroundMeLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Loading your rank...</span>
                </div>
              ) : aroundMeData?.userRank && aroundMeData.userRank > 0 ? (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Your Rank in {getTimeframeLabel(timeframe)}</span>
                  <span className="font-mono font-bold text-2xl text-foreground" aria-label={`Your rank is ${aroundMeData.userRank}`}>
                    #{aroundMeData.userRank}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Not Ranked Yet</span>
                  <span className="text-sm text-muted-foreground">Complete a test in {LANGUAGE_NAMES[language]} to rank!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!userData?.user && (
          <div className="mb-8">
            <AuthPrompt message="save your results and climb the global leaderboard!" />
          </div>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            {isError || errorState ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                {getErrorIcon(errorState?.type || "unknown")}
                <p className="text-lg font-medium text-foreground mb-2">
                  {errorState?.type === "network" ? "Connection Lost" :
                    errorState?.type === "rate_limit" ? "Slow Down" :
                      errorState?.type === "timeout" ? "Request Timed Out" :
                        "Failed to load leaderboard"}
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {errorState?.message || (error instanceof Error ? error.message : "An unexpected error occurred")}
                </p>
                {(errorState?.retryable !== false) && (
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    data-testid="retry-button"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
                {errorState?.type === "auth" && (
                  <Button
                    variant="default"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Refresh Page
                  </Button>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{getEmptyStateMessage(timeframe, language).title}</p>
                <p className="text-sm mt-2">{getEmptyStateMessage(timeframe, language).subtitle}</p>
                <div className="mt-4 text-xs">
                  <p className="text-muted-foreground/70">
                    Selected language: <strong className="text-foreground">{LANGUAGE_NAMES[language]}</strong>
                  </p>
                  {language !== "en" && (
                    <p className="text-muted-foreground/70 mt-1">
                      Try switching to English for more results
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/50 rounded-lg overflow-hidden border border-border/50">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="col-span-1 text-center cursor-help flex items-center justify-center">#</div>
                      </TooltipTrigger>
                      <TooltipContent><p>Rank position based on best WPM</p></TooltipContent>
                    </Tooltip>
                    <div className="col-span-4 flex items-center">User</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="col-span-2 text-center cursor-help flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 mr-1.5" />
                          WPM
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Words Per Minute - typing speed</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="col-span-2 text-center cursor-help flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                          Accuracy
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Percentage of correctly typed characters</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="col-span-2 text-center cursor-help flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Time
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Duration of the typing test</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="col-span-1 text-center cursor-help flex items-center justify-center">Tests</div>
                      </TooltipTrigger>
                      <TooltipContent><p>Total number of tests completed</p></TooltipContent>
                    </Tooltip>
                  </div>

                  {entries.map((entry: LeaderboardEntry, index: number) => {
                    const computedRank = offset + index + 1;
                    const rankValue = safeNumber(entry.rank, NaN);
                    const rank = rankValue > 0 ? rankValue : computedRank;
                    const isCurrentUser = userData?.user?.id === entry.userId;
                    const username = safeString(entry.username);
                    const wpm = safeNumber(entry.wpm);
                    const accuracy = safeNumber(entry.accuracy);
                    const totalTests = safeNumber(entry.totalTests, 1);
                    const isRecentlyUpdated = recentlyUpdatedIds.has(entry.userId);

                    return (
                      <motion.div
                        key={`${entry.userId}-${entry.createdAt || rank}`}
                        initial={isRecentlyUpdated ? { scale: 1.02, backgroundColor: "rgba(34, 197, 94, 0.15)" } : false}
                        animate={{ 
                          scale: 1, 
                          backgroundColor: isRecentlyUpdated 
                            ? ["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.05)", "transparent"]
                            : "transparent"
                        }}
                        transition={{ 
                          duration: isRecentlyUpdated ? 2 : 0.2,
                          ease: "easeOut"
                        }}
                        layout
                        layoutId={entry.userId}
                        className={cn(
                          "px-4 py-4 transition-all duration-200 border-b last:border-b-0",
                          "hover:bg-slate-800/30 hover:shadow-sm",
                          isCurrentUser && "bg-primary/10 border-l-2 border-primary",
                          isRecentlyUpdated && "ring-1 ring-green-500/30"
                        )}
                      >
                        {/* Mobile card layout */}
                        <div className="md:hidden flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {/* Rank (medal or #) */}
                            {rank <= 3 && MEDAL_TOOLTIPS[rank as 1 | 2 | 3] ? (
                              <Medal
                                className={`w-6 h-6 ${rank === 1 ? 'text-yellow-400' :
                                  rank === 2 ? 'text-slate-300' : 'text-amber-600'
                                  }`}
                              />
                            ) : (
                              <span className="font-mono text-sm font-medium text-muted-foreground">#{rank}</span>
                            )}

                            {/* User */}
                            <Avatar className="w-10 h-10 ring-2 ring-border/50">
                              <AvatarFallback
                                className={entry.avatarColor || "bg-primary/20"}
                                style={{ color: "white" }}
                              >
                                {username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold truncate max-w-[180px]">{username}</span>
                                {entry.isVerified && (
                                  <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/80">{totalTests} test{totalTests !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">WPM</div>
                              <div className="font-mono font-bold text-primary text-lg">{wpm}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Acc</div>
                              <div className="font-mono font-semibold">{accuracy.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Time</div>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/40 text-sm">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                                <span className="tabular-nums">{formatTestMode(entry.mode)}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Tests</div>
                              <div className="font-mono text-muted-foreground tabular-nums">{totalTests}</div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop grid layout */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-1 flex justify-center">
                            {rank <= 3 && MEDAL_TOOLTIPS[rank] ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <Medal
                                      className={`w-6 h-6 ${rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]' :
                                        rank === 2 ? 'text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]' :
                                          'text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]'
                                        }`}
                                      data-testid={`medal-rank-${rank}`}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{MEDAL_TOOLTIPS[rank].label}</p>
                                  <p className="text-xs text-muted-foreground">{MEDAL_TOOLTIPS[rank].description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="font-mono text-sm font-medium text-muted-foreground" data-testid={`rank-${rank}`}>#{rank}</span>
                            )}
                          </div>
                          <div className="col-span-4 flex items-center gap-3">
                            <Avatar className="w-10 h-10 ring-2 ring-border/50">
                              <AvatarFallback
                                className={entry.avatarColor || "bg-primary/20"}
                                style={{ color: "white" }}
                              >
                                {username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate max-w-[140px]" data-testid={`username-${username}`}>
                                  {username}
                                </span>
                                {entry.isVerified && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <ShieldCheck className="w-4 h-4 text-green-400 cursor-help flex-shrink-0" data-testid={`verified-${entry.userId}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verified score - passed anti-cheat challenge</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/80">{totalTests} test{totalTests !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center cursor-help">
                                  <div className="font-mono font-bold text-primary text-xl tabular-nums" data-testid={`wpm-${entry.userId}`}>
                                    {wpm}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">wpm</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{wpm} words per minute</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center cursor-help" data-testid={`accuracy-${entry.userId}`}>
                                  <div className={`font-mono font-semibold text-base tabular-nums ${accuracy >= 98 ? 'text-green-400' :
                                    accuracy >= 95 ? 'text-blue-400' :
                                      accuracy >= 90 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                    {accuracy.toFixed(1)}%
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">acc</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{accuracy.toFixed(2)}% typing accuracy</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/40 rounded-md cursor-help">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                                  <span className="text-sm font-medium tabular-nums" data-testid={`mode-${entry.userId}`}>
                                    {formatTestMode(entry.mode)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Test time: {formatTestMode(entry.mode)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <span className="text-sm font-medium text-muted-foreground/80 tabular-nums" data-testid={`total-tests-${entry.userId}`}>
                              {totalTests}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs sm:text-sm text-muted-foreground cursor-help text-center sm:text-left">
                        Showing {Math.min(offset + 1, pagination.total)} - {Math.min(offset + entries.length, pagination.total)} of {pagination.total} results
                        {isFetching && <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{limit} entries per page</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevPage}
                          disabled={offset === 0 || isFetching}
                          data-testid="prev-page"
                          className="gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{offset === 0 ? "You're on the first page" : `Go to page ${safeCurrentPage - 1}`}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs sm:text-sm text-muted-foreground px-1 sm:px-2">
                      Page {safeCurrentPage} of {totalPages}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={!pagination.hasMore || offset + limit >= pagination.total || isFetching}
                          data-testid="next-page"
                          className="gap-1"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{!pagination.hasMore || offset + limit >= pagination.total ? "You're on the last page" : `Go to page ${safeCurrentPage + 1}`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default function Leaderboard() {
  return (
    <ErrorBoundary>
      <LeaderboardContent />
    </ErrorBoundary>
  );
}
