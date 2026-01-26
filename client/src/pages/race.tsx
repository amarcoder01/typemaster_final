import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useNetwork } from "@/lib/network-context";
import { Button } from "@/components/ui/button";
import { useSEO } from '@/lib/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Copy, Check, Loader2, Home, RotateCcw, ArrowLeft, WifiOff, RefreshCw, Info, Gauge, Target, User, Users, Share2, Play, Flag, AlertTriangle, Wifi, XCircle, Timer, Sparkles, MessageCircle, Send, TrendingUp, TrendingDown, Award, Eye, Film, Zap, LogOut, Lock, ExternalLink, Twitter, Facebook, Linkedin, Mail, UserPlus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { calculateWPM, calculateAccuracy } from "@/lib/typing-utils";
import { RaceCertificate } from "@/components/RaceCertificate";
import { getTypingPerformanceRating } from "@/lib/share-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthPrompt } from "@/components/auth-prompt";

// Import extracted race components
import { 
  RaceErrorDisplay, 
  RaceLoadingDisplay, 
  RaceNetworkBanner,
  RaceChat,
  type ErrorState, 
  type ErrorType,
  type ChatMessage 
} from "@/components/race";

// Types and common components are now imported from @/components/race

interface Race {
  id: number;
  roomCode: string;
  status: string;
  paragraphContent: string;
  maxPlayers: number;
  isPrivate: number;
  raceType?: string;
  timeLimitSeconds?: number | null;
  startedAt?: string | null;
}

interface Participant {
  id: number;
  raceId: number;
  username: string;
  avatarColor: string | null;
  isBot?: number | boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  errors: number;
  isFinished: number;
  finishPosition: number | null;
  rating?: number | null;
  tier?: string | null;
  tierInfo?: {
    name: string;
    color: string;
    minRating: number;
  } | null;
  ratingChange?: number | null;
  userId?: string | null;
  // Security: Join token for WebSocket authentication (Phase 1 hardening)
  joinToken?: string | null;
}

// ChatMessage interface is now imported from @/components/race

interface RatingInfo {
  rating: number;
  tier: string;
  tierInfo?: {
    name: string;
    color: string;
    minRating: number;
  };
  ratingChange?: number;
}

// RaceChat is now imported from @/components/race

const TIER_DESCRIPTIONS: Record<string, string> = {
  bronze: "Starting tier. Keep practicing to climb!",
  silver: "You're improving! Aim for Gold next.",
  gold: "Solid skills! Top 50% of players.",
  platinum: "Excellent typing speed! Top 25%.",
  diamond: "Elite typist! Top 10% of all players.",
  master: "Exceptional! Top 5% of players.",
  grandmaster: "Legendary status! Top 1% of all typists.",
};

function RatingChangeDisplay({ ratingInfo, position }: { ratingInfo: RatingInfo | null; position: number | null }) {
  if (!ratingInfo) return null;

  const isPositive = (ratingInfo.ratingChange || 0) >= 0;
  const tierColor = ratingInfo.tierInfo?.color || "gray";
  const tierDescription = TIER_DESCRIPTIONS[ratingInfo.tier.toLowerCase()] || "Keep racing to improve!";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium">Your Rating</span>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium">ELO Skill Rating</p>
              <p className="text-zinc-400">
                Your competitive rating based on race performance.
                Win against higher-rated players to gain more points.
              </p>
              <p className="text-zinc-400 mt-1">
                <span className="text-primary">Range:</span> 100 - 3000
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="capitalize cursor-help"
                style={{ borderColor: tierColor, color: tierColor }}
              >
                {ratingInfo.tierInfo?.name || ratingInfo.tier}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium capitalize" style={{ color: tierColor }}>
                {ratingInfo.tierInfo?.name || ratingInfo.tier} Tier
              </p>
              <p className="text-zinc-400">{tierDescription}</p>
              {ratingInfo.tierInfo?.minRating && (
                <p className="text-zinc-400 mt-1">
                  <span className="text-primary">Min rating:</span> {ratingInfo.tierInfo.minRating}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-2xl font-bold cursor-help">{ratingInfo.rating}</div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">Current Rating: {ratingInfo.rating}</p>
              <p className="text-zinc-400">Your skill level compared to other players</p>
            </TooltipContent>
          </Tooltip>
          {ratingInfo.ratingChange !== undefined && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1 text-sm font-medium cursor-help ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? '+' : ''}{ratingInfo.ratingChange}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium">
                  {isPositive ? 'Rating Gained' : 'Rating Lost'}
                </p>
                <p className="text-zinc-400">
                  {isPositive
                    ? `Great race! You gained ${ratingInfo.ratingChange} points.`
                    : `You lost ${Math.abs(ratingInfo.ratingChange)} points. Keep practicing!`}
                </p>
                {position !== null && (
                  <p className="text-zinc-400 mt-1">
                    <span className="text-primary">Finish position:</span> #{position}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function RaceFinishBanner({
  position,
  totalPlayers,
  wpm,
  accuracy,
  isWinner,
  onDismiss
}: {
  position: number | null;
  totalPlayers: number;
  wpm: number;
  accuracy: number;
  isWinner: boolean;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setShowStats(true), 800);

    if (isWinner) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const runConfetti = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(runConfetti);
        }
      };
      runConfetti();
    }
  }, [isWinner]);

  const getPositionDisplay = () => {
    if (!position) return { emoji: '🏁', text: 'Race Complete!', color: 'text-blue-400' };
    switch (position) {
      case 1: return { emoji: '🏆', text: '1st Place!', color: 'text-yellow-400' };
      case 2: return { emoji: '🥈', text: '2nd Place!', color: 'text-gray-300' };
      case 3: return { emoji: '🥉', text: '3rd Place!', color: 'text-amber-600' };
      default: return { emoji: '🏁', text: `#${position} of ${totalPlayers}`, color: 'text-blue-400' };
    }
  };

  const positionInfo = getPositionDisplay();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onDismiss}
      data-testid="race-finish-banner"
    >
      <div
        className={`text-center transform transition-all duration-700 ${isVisible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`text-8xl mb-4 animate-bounce`}>
          {positionInfo.emoji}
        </div>

        <h1 className={`text-5xl md:text-6xl font-bold ${positionInfo.color} mb-2 drop-shadow-lg`}>
          {positionInfo.text}
        </h1>

        {isWinner && (
          <p className="text-xl text-yellow-300 mb-4 animate-pulse">
            ✨ Congratulations, Champion! ✨
          </p>
        )}

        <div className={`mt-6 transition-all duration-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-center gap-8 text-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{wpm}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                <Gauge className="h-4 w-4" />
                WPM
              </div>
            </div>
            <div className="w-px h-12 bg-muted-foreground/30" />
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400">{accuracy}%</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                <Target className="h-4 w-4" />
                Accuracy
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-8 transition-all duration-500 delay-300 ${showStats ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="lg"
            onClick={onDismiss}
            className="px-8 py-3 text-lg bg-primary hover:bg-primary/90"
            data-testid="button-view-results"
          >
            <Trophy className="h-5 w-5 mr-2" />
            View Results
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RacePage() {
  useSEO({
    title: 'Typing Race | TypeMasterAI',
    description: 'Join this multiplayer typing race and compete against other typists in real-time!',
    keywords: 'typing race, multiplayer race, compete typing, live race',
    canonical: 'https://typemasterai.com/multiplayer',
    ogUrl: 'https://typemasterai.com/multiplayer',
  });
  const [, params] = useRoute("/race/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isOnline, wasOffline } = useNetwork();

  const [race, setRace] = useState<Race | null>(null);
  const raceRef = useRef<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const myParticipantRef = useRef<Participant | null>(null);
  const [hostParticipantId, setHostParticipantId] = useState<number | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null); // Ref for cleanup to access current WS
  const [wsConnected, setWsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [charStates, setCharStates] = useState<('pending' | 'correct' | 'incorrect')[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading race...");
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const currentIndexRef = useRef(0);
  const errorsRef = useRef(0);
  const isComposingRef = useRef(false);
  const keystrokesRef = useRef<Array<{ key: string; timestamp: number; position: number; isTrusted?: boolean }>>([]);
  const keystrokesSubmittedRef = useRef(false);
  const lastKeystrokeTimestampRef = useRef(0);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const pendingMessagesRef = useRef<string[]>([]);
  const lastProgressSentRef = useRef(0);
  const pendingProgressRef = useRef<{ progress: number; errors: number; wpm: number; accuracy: number } | null>(null);
  const progressFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seenParticipantJoinsRef = useRef<Set<number>>(new Set());
  const hasJoinedRef = useRef(false);
  const lastJoinedRaceIdRef = useRef<number | null>(null);
  const [hasJoinedRace, setHasJoinedRace] = useState(false); // State for UI reactivity
  const hasLeftRef = useRef(false); // Track if leave message was already sent
  const reconnectBlockedUntilRef = useRef<number | null>(null); // Prevent reconnect storms
  const toastCooldownRef = useRef<Map<string, number>>(new Map());
  const joinRetryAttemptsRef = useRef(0);
  const maxJoinRetryAttempts = 3;
  const joinRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const extensionRequestedRef = useRef(false);
  const extensionThreshold = 0.75; // Request extension earlier to ensure content is available
  const timedFinishSentRef = useRef(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ratingInfo, setRatingInfo] = useState<RatingInfo | null>(null);
  const [showFinishBanner, setShowFinishBanner] = useState(false);
  const finishBannerDismissedRef = useRef(false);
  const raceFinishedReceivedRef = useRef(false); // Track if we received race_finished via WebSocket
  const [isRefreshing, setIsRefreshing] = useState(false); // Track if we're refreshing participant list
  const [isStarting, setIsStarting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Phase 7: Multi-tab detection
  const [isMultiTabBlocked, setIsMultiTabBlocked] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(`tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [finishBannerData, setFinishBannerData] = useState<{
    position: number | null;
    totalPlayers: number;
    wpm: number;
    accuracy: number;
  } | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [readyStates, setReadyStates] = useState<Map<number, boolean>>(new Map());
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isAwaitingRejoinApproval, setIsAwaitingRejoinApproval] = useState(false);
  const [rematchInfo, setRematchInfo] = useState<{
    newRaceId: number;
    roomCode: string;
    createdBy: string;
  } | null>(null);
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateImageCopied, setCertificateImageCopied] = useState(false);
  const [isSharingCertificate, setIsSharingCertificate] = useState(false);
  const [certificateVerificationId, setCertificateVerificationId] = useState<string | null>(null);
  const [lastResultSnapshot, setLastResultSnapshot] = useState<{
    wpm: number;
    accuracy: number;
    consistency: number;
    placement: number;
    totalParticipants: number;
    characters: number;
    errors: number;
    duration: number;
  } | null>(null);
  
  // Pending rejoin requests (for host to approve/reject kicked players)
  const [pendingRejoinRequests, setPendingRejoinRequests] = useState<Array<{
    participantId: number;
    username: string;
  }>>([]);

  useEffect(() => {
    raceRef.current = race;
  }, [race]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  useEffect(() => {
    myParticipantRef.current = myParticipant;
  }, [myParticipant]);

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  useEffect(() => {
    if (!params?.id) return;

    // Reset all state for new race - CRITICAL: Reset race first to prevent stale status
    // Note: Don't set raceRef.current = null here as cleanup needs the old value
    setRace(null);
    finishBannerDismissedRef.current = false;
    raceFinishedReceivedRef.current = false;
    setShowFinishBanner(false);
    setFinishBannerData(null);
    setRematchInfo(null);
    setIsCreatingRematch(false);
    hasJoinedRef.current = false;
    hasLeftRef.current = false; // Reset leave flag for new race
    lastJoinedRaceIdRef.current = null;
    setHasJoinedRace(false);
    joinRetryAttemptsRef.current = 0;
    if (joinRetryTimeoutRef.current) {
      clearTimeout(joinRetryTimeoutRef.current);
      joinRetryTimeoutRef.current = null;
    }
    setCurrentIndex(0);
    setErrors(0);
    setCharStates([]);
    currentIndexRef.current = 0;
    errorsRef.current = 0;
    setIsRacing(false);
    setCountdown(null);
    timedFinishSentRef.current = false;
    // Reset chat and other UI states
    setChatMessages([]);
    setRatingInfo(null);
    setLastResultSnapshot(null);
    setCertificateVerificationId(null);
    setReadyStates(new Map());
    setIsRoomLocked(false);
    setIsReady(false);
    setPendingRejoinRequests([]);
    setHostParticipantId(null);
    setParticipants([]);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setElapsedTime(0);
    setTimeRemaining(null);
    setStartTime(null);
    keystrokesRef.current = [];
    keystrokesSubmittedRef.current = false;
    lastKeystrokeTimestampRef.current = 0;
    extensionRequestedRef.current = false;
    seenParticipantJoinsRef.current = new Set();

    const roomCodeOrId = params.id;
    const savedParticipant = localStorage.getItem(`race_${roomCodeOrId}_participant`);

    if (savedParticipant) {
      try {
        const participant = JSON.parse(savedParticipant);
        
        // Validate the participant belongs to THIS race
        // The roomCodeOrId could be a numeric race ID or a room code
        const raceIdFromUrl = /^\d+$/.test(roomCodeOrId) ? parseInt(roomCodeOrId) : null;
        
        if (raceIdFromUrl && participant.raceId && participant.raceId !== raceIdFromUrl) {
          // Stale participant from different race - clear it
          console.log(`[Race] Stale participant from race ${participant.raceId} (expected ${raceIdFromUrl}) - clearing`);
          localStorage.removeItem(`race_${roomCodeOrId}_participant`);
          setMyParticipant(null);
        } else {
          setMyParticipant(participant);
          console.log(`[Race] Loaded participant from localStorage:`, participant);
        }
      } catch (e) {
        console.error("[Race] Failed to parse saved participant:", e);
        localStorage.removeItem(`race_${roomCodeOrId}_participant`);
        setMyParticipant(null);
      }
    } else {
      // Reset participant if no saved data
      setMyParticipant(null);
      console.log(`[Race] No saved participant found for race ${roomCodeOrId}`);
    }

    // Phase 7: Multi-tab detection using BroadcastChannel
    try {
      const channelName = `race-session-${roomCodeOrId}`;
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;
      
      // Announce this tab
      channel.postMessage({
        type: 'TAB_OPEN',
        tabId: tabIdRef.current,
        timestamp: Date.now(),
      });
      
      // Listen for other tabs
      channel.onmessage = (event) => {
        if (event.data.tabId === tabIdRef.current) return; // Ignore own messages
        
        switch (event.data.type) {
          case 'TAB_OPEN':
            // Another tab opened this race - let them know we're here
            channel.postMessage({
              type: 'TAB_EXISTS',
              tabId: tabIdRef.current,
              timestamp: Date.now(),
            });
            break;
            
          case 'TAB_EXISTS':
            // Another tab is already open - warn user
            console.warn(`[Race Multi-tab] Another tab detected for race ${roomCodeOrId}`);
            toast.warning("Race open in another tab", {
              description: "This race is already open in another browser tab. Some features may not work correctly.",
              duration: 5000,
            });
            break;
            
          case 'TAB_CLOSE':
            // Other tab closed - we can proceed normally
            console.log(`[Race Multi-tab] Other tab closed for race ${roomCodeOrId}`);
            break;
        }
      };
    } catch (e) {
      // BroadcastChannel not supported (older browsers) - skip multi-tab detection
      console.warn("[Race Multi-tab] BroadcastChannel not supported:", e);
    }

    fetchRaceData();
    // Note: connectWebSocket() is now called in a separate useEffect after race data loads
    // This prevents connection issues when race doesn't exist or participant isn't ready

    return () => {
      // Phase 7: Notify other tabs we're closing
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'TAB_CLOSE',
            tabId: tabIdRef.current,
            timestamp: Date.now(),
          });
          broadcastChannelRef.current.close();
          broadcastChannelRef.current = null;
        } catch (e) {
          console.warn("[Race Multi-tab] Failed to close BroadcastChannel:", e);
        }
      }
      
      // Send leave message before closing WebSocket
      // Use wsRef.current to get the current WebSocket (not stale closure value)
      // Skip if leave was already sent (prevents double leave from explicit leave + cleanup)
      const currentWs = wsRef.current;
      if (!hasLeftRef.current && hasJoinedRef.current && currentWs && currentWs.readyState === WebSocket.OPEN && myParticipantRef.current && raceRef.current) {
        hasLeftRef.current = true;
        try {
          currentWs.send(JSON.stringify({
            type: "leave",
            raceId: raceRef.current.id,
            participantId: myParticipantRef.current.id,
            isRacing: false,
            progress: currentIndexRef.current,
            wpm: 0,
            accuracy: 100
          }));
        } catch (e) {
          console.error("[Race] Failed to send leave message:", e);
        }
      }
      if (currentWs) {
        currentWs.close(1000, "Navigating away");
      }
    };
  }, [params?.id]);

  // Handle page unload/navigation - use sendBeacon for reliable delivery
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Skip if leave was already sent via WebSocket
      if (hasLeftRef.current) return;
      
      if (hasJoinedRef.current && myParticipantRef.current && raceRef.current) {
        hasLeftRef.current = true;
        // Use sendBeacon for reliable delivery during unload
        const leaveData = JSON.stringify({
          raceId: raceRef.current.id,
          participantId: myParticipantRef.current.id,
          joinToken: myParticipantRef.current.joinToken,
          isRacing: false,
          progress: currentIndexRef.current || 0,
          errors: errorsRef.current || 0,
          wpm: 0,
          accuracy: 100
        });
        const blob = new Blob([leaveData], { type: 'application/json' });
        navigator.sendBeacon('/api/races/leave', blob);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Connect WebSocket only after race data is loaded
  // This prevents connection issues when race doesn't exist or is invalid
  useEffect(() => {
    if (race && !ws && !errorState) {
      console.log(`[Race] Race ${race.id} loaded, connecting WebSocket`);
      connectWebSocket();
    }
  }, [race, ws, errorState]);

  // Periodic sync in waiting room - refresh participants every 15 seconds
  useEffect(() => {
    if (race?.status === "waiting" && !isRefreshing) {
      const interval = setInterval(() => {
        fetchRaceData();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [race?.status, isRefreshing]);

  useEffect(() => {
    if (ws && myParticipant && race && ws.readyState === WebSocket.OPEN) {
      if (hasJoinedRef.current && lastJoinedRaceIdRef.current === race.id) {
        return;
      }

      // CRITICAL: Verify participant belongs to this race before joining
      // This prevents stale participant data from old races causing "Invalid participant" errors
      if (myParticipant.raceId !== race.id) {
        console.log(`[Race] Participant ${myParticipant.id} belongs to race ${myParticipant.raceId}, not ${race.id} - waiting for correct participant data`);
        return;
      }

      // CRITICAL: Verify joinToken exists before attempting to join
      // If missing, the server will reject with "Token required" error
      if (!myParticipant.joinToken) {
        console.warn(`[Race] Missing joinToken for participant ${myParticipant.id}, re-fetching race data`);
        fetchRaceData();
        return;
      }

      hasJoinedRef.current = true;
      lastJoinedRaceIdRef.current = race.id;
      // NOTE: setHasJoinedRace(true) is now called when we receive the "joined" confirmation
      // This prevents race conditions where UI enables actions before server confirms join

      console.log(`[Race] Joining race ${race.id} as participant ${myParticipant.id} (${myParticipant.username})`);

      sendWsMessage({
        type: "join",
        raceId: race.id,
        participantId: myParticipant.id,
        username: myParticipant.username,
        // Security: Include join token for cryptographic authentication (Phase 1 hardening)
        joinToken: myParticipant.joinToken,
      });
    }
  }, [ws, myParticipant, race]);

  useEffect(() => {
    if (isRacing && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      setIsFocused(true);
    }
  }, [isRacing]);

  useEffect(() => {
    if (!isRacing || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(elapsed);

      const idx = currentIndexRef.current;
      const errs = errorsRef.current;
      const correctChars = Math.max(0, idx - errs);
      const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;
      const accuracy = idx > 0 ? Math.round(((idx - errs) / idx) * 100) : 100;

      setLiveWpm(wpm);
      setLiveAccuracy(Math.max(0, accuracy));

      // Update time remaining for timed races
      if (race?.raceType === "timed" && race.timeLimitSeconds) {
        const remaining = Math.max(0, race.timeLimitSeconds - elapsed);
        setTimeRemaining(remaining);

        // Handle time running out - only send once
        // Use ref to avoid stale closure (myParticipant removed from dependencies)
        const currentParticipant = myParticipantRef.current;
        if (remaining <= 0 && currentParticipant && !timedFinishSentRef.current) {
          timedFinishSentRef.current = true;

          console.log(`[Race Timer] Time expired! Progress: ${idx}, WPM: ${wpm}`);

          // Send finish message via WebSocket
          sendWsMessage({
            type: "timed_finish",
            raceId: race.id,
            participantId: currentParticipant.id,
            progress: idx,
            wpm: wpm,
            accuracy: accuracy,
            errors: errs
          });

          submitKeystrokes(wpm);

          // Show toast notification
          toast.info("Time's up!", {
            description: `You typed ${idx} characters at ${wpm} WPM`,
            duration: 3000
          });

          // Blur the input immediately to stop keyboard events and allow browser to paint
          if (hiddenInputRef.current) {
            hiddenInputRef.current.blur();
          }

          // STOP racing immediately
          setIsRacing(false);

          // Update race status locally - this triggers the finished view
          if (raceRef.current) {
            setRace({ ...raceRef.current, status: "finished" });
          }

          // Store values for use in timeout (avoid stale closures)
          const finalIdx = idx;
          const finalWpm = wpm;
          const finalAccuracy = accuracy;
          const finalErrors = errs;
          const participantCount = participants.length;
          const timeLimit = race.timeLimitSeconds || 60;

          // Set up a fallback to show results after a delay
          // This ensures the UI shows results even if server doesn't respond
          setTimeout(() => {
            // Only show local results if we haven't received server results yet
            // AND the banner hasn't been dismissed AND banner isn't already showing
            if (!finishBannerDismissedRef.current && !raceFinishedReceivedRef.current && !showFinishBanner) {
              console.log("[Race Fallback] Server didn't respond in time, showing local results");

              setFinishBannerData({
                position: null, // Unknown without server data
                totalPlayers: participantCount,
                wpm: finalWpm,
                accuracy: finalAccuracy,
              });

              setLastResultSnapshot({
                wpm: finalWpm,
                accuracy: finalAccuracy,
                consistency: 85, // Default consistency
                placement: 0, // Unknown
                totalParticipants: participantCount,
                characters: finalIdx,
                errors: finalErrors,
                duration: timeLimit,
              });

              setShowFinishBanner(true);
            }
          }, 2000); // Wait 2 seconds for server response before showing local results
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRacing, startTime, race?.raceType, race?.timeLimitSeconds, race?.id]);

  useEffect(() => {
    if (caretRef.current && textContainerRef.current) {
      const caret = caretRef.current;
      const container = textContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const caretRect = caret.getBoundingClientRect();

      const caretRelativeTop = caretRect.top - containerRect.top + container.scrollTop;
      const visibleTop = container.scrollTop;

      // Scroll to keep caret at ~40% from top of container (showing 60% upcoming content)
      const targetPosition = container.clientHeight * 0.4;
      
      // Scroll up if caret is above the target zone
      if (caretRelativeTop < visibleTop + 30) {
        container.scrollTo({ top: Math.max(0, caretRelativeTop - targetPosition), behavior: 'smooth' });
      } 
      // Scroll down if caret is below the target zone (more aggressive scrolling)
      else if (caretRelativeTop > visibleTop + targetPosition + 30) {
        container.scrollTo({ top: caretRelativeTop - targetPosition, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  function handleFocus() {
    setIsFocused(true);
  }

  function handleBlur() {
    setIsFocused(false);
  }

  function handleCompositionStart() {
    isComposingRef.current = true;
  }

  function handleCompositionEnd(e: React.CompositionEvent<HTMLInputElement>) {
    isComposingRef.current = false;
    if (e.data) {
      processInput(e.data);
    }
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    toast.error("Paste disabled - Please type manually for accurate results");
  }

  function handleCut(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
  }

  function handleTyping(e: React.FormEvent<HTMLInputElement>) {
    if (!isRacing || !race || isComposingRef.current) return;

    // Block typing if timed race has expired
    if (timedFinishSentRef.current) return;

    const input = e.currentTarget;
    const value = input.value;

    if (value.length === 0) return;

    const isTrusted = (e.nativeEvent as any)?.isTrusted;
    processInput(value, typeof isTrusted === 'boolean' ? isTrusted : undefined);
    input.value = '';
  }

  function processInput(value: string, isTrusted?: boolean) {
    if (!race) return;

    // Block processing if timed race has expired
    if (timedFinishSentRef.current) return;

    let localIndex = currentIndexRef.current;
    let localErrors = errorsRef.current;
    const newCharStates = [...charStates];

    const MAX_KEYSTROKES_BUFFER = 3000;
    const baseTimestamp = Date.now();

    for (let i = 0; i < value.length; i++) {
      if (localIndex >= race.paragraphContent.length) {
        break;
      }

      const typedChar = value[i];
      const expectedChar = race.paragraphContent[localIndex];

      if (value.length === 1 && keystrokesRef.current.length < MAX_KEYSTROKES_BUFFER) {
        const ts = Math.max(baseTimestamp, lastKeystrokeTimestampRef.current + 1);
        lastKeystrokeTimestampRef.current = ts;
        keystrokesRef.current.push({
          key: typedChar,
          timestamp: ts,
          position: localIndex,
          isTrusted,
        });
      }

      if (typedChar === expectedChar) {
        newCharStates[localIndex] = 'correct';
      } else {
        newCharStates[localIndex] = 'incorrect';
        localErrors++;
      }

      localIndex++;
    }

    currentIndexRef.current = localIndex;
    errorsRef.current = localErrors;
    setCurrentIndex(localIndex);
    setErrors(localErrors);
    setCharStates(newCharStates);
    updateProgress(localIndex, localErrors);
  }

  function submitKeystrokes(clientWpm: number) {
    if (keystrokesSubmittedRef.current) return;

    const currentRace = raceRef.current;
    const currentParticipant = myParticipantRef.current;
    if (!currentRace || !currentParticipant) return;

    const keystrokes = keystrokesRef.current;
    if (!Array.isArray(keystrokes) || keystrokes.length === 0) return;

    keystrokesSubmittedRef.current = true;
    sendWsMessage({
      type: "submit_keystrokes",
      raceId: currentRace.id,
      participantId: currentParticipant.id,
      keystrokes: keystrokes.slice(0, 3000),
      clientWpm: clientWpm || 0,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isRacing) return;

    // Block key events if timed race has expired
    if (timedFinishSentRef.current) return;

    if (e.key === 'Backspace' && currentIndexRef.current > 0) {
      e.preventDefault();
      const newIndex = currentIndexRef.current - 1;
      currentIndexRef.current = newIndex;

      const newCharStates = [...charStates];
      if (newCharStates[newIndex] === 'incorrect') {
        errorsRef.current = Math.max(0, errorsRef.current - 1);
        setErrors(errorsRef.current);
      }
      newCharStates[newIndex] = 'pending';
      setCharStates(newCharStates);

      setCurrentIndex(newIndex);
      updateProgress(newIndex, errorsRef.current);
    }
  }

  useEffect(() => {
    if (race && race.paragraphContent && charStates.length !== race.paragraphContent.length) {
      setCharStates(new Array(race.paragraphContent.length).fill('pending'));
    }
  }, [race?.paragraphContent]);

  // Handle case where race is already finished when loaded (e.g., after reconnect or page refresh)
  useEffect(() => {
    // Don't show banner again if user already dismissed it
    if (finishBannerDismissedRef.current) return;
    
    // Skip if we already received race_finished via WebSocket (avoids showing incorrect placement)
    // This effect is only for reconnect/refresh scenarios where race was already finished
    if (raceFinishedReceivedRef.current) return;

    if (race?.status === "finished" && !showFinishBanner) {
      console.log("[Race Debug] Detected finished race from API/state");

      // If participants are empty, refetch race data to get results
      if (participants.length === 0) {
        console.log("[Race Debug] No participants loaded, refetching race data");
        fetchRaceData();
        return;
      }

      console.log("[Race Debug] Showing finish banner with", participants.length, "participants");
      const sortedParticipants = [...participants].sort((a, b) => (a.finishPosition || 999) - (b.finishPosition || 999));

      // Try to find my result, or use the first participant if myParticipant is null
      const myResult = myParticipant
        ? sortedParticipants.find(p => p.id === myParticipant.id)
        : sortedParticipants[0]; // Fallback for when myParticipant isn't loaded

      if (myResult) {
        // Use 'progress' field from server (actual characters typed)
        const chars = myResult.progress || currentIndexRef.current || 0;
        const resultErrors = myResult.errors ?? Math.round(chars * (1 - myResult.accuracy / 100));
        // Consistency estimate: based on accuracy with slight variation
        // High accuracy = high consistency (stable typing with few errors)
        // This is an approximation since we don't track per-interval WPM
        const baseConsistency = myResult.accuracy || 100;
        // Add slight variation based on chars typed (more chars = more opportunity for inconsistency)
        const consistency = Math.max(70, Math.min(100, Math.round(
          baseConsistency * 0.95 + (chars > 100 ? 5 : chars / 20)
        )));

        setFinishBannerData({
          position: myResult.finishPosition || null,
          totalPlayers: participants.length,
          wpm: myResult.wpm,
          accuracy: myResult.accuracy,
        });

        setLastResultSnapshot({
          wpm: myResult.wpm,
          accuracy: myResult.accuracy,
          consistency: consistency,
          placement: myResult.finishPosition || participants.length,
          totalParticipants: participants.length,
          characters: chars,
          errors: resultErrors,
          duration: race?.timeLimitSeconds || 60,
        });

        setShowFinishBanner(true);
        setIsRacing(false);
      }
    }
  }, [race?.status, myParticipant, participants, showFinishBanner]);

  useEffect(() => {
    if (!race || !myParticipant || myParticipant.isFinished) return;

    const progress = currentIndex / race.paragraphContent.length;

    // Request extension when approaching end of content
    if (progress >= extensionThreshold && !extensionRequestedRef.current) {
      extensionRequestedRef.current = true;
      sendWsMessage({
        type: "extend_paragraph",
        raceId: race.id,
        participantId: myParticipant.id,
      });
    }

    // Handle reaching end of paragraph
    if (currentIndex >= race.paragraphContent.length) {
      // For timed races with time remaining, request extension instead of finishing
      if (race.raceType === "timed" && timeRemaining && timeRemaining > 0) {
        // Request more content if not already requested
        if (!extensionRequestedRef.current) {
          extensionRequestedRef.current = true;
          sendWsMessage({
            type: "extend_paragraph",
            raceId: race.id,
            participantId: myParticipant.id,
          });
        }
        // Don't finish - wait for extension or timer expiry
      } else {
        // For non-timed races or when time is up, finish normally
        finishRace();
      }
    }
  }, [currentIndex, race, myParticipant, timeRemaining]);

  async function fetchRaceData() {
    setLoadingMessage("Loading race...");
    setErrorState(null);
    setIsRefreshing(true);

    try {
      // Include guestId for guests so server can return their joinToken
      const guestId = !user ? localStorage.getItem("multiplayer_guest_id") : null;
      const url = guestId 
        ? `/api/races/${params?.id}?guestId=${encodeURIComponent(guestId)}`
        : `/api/races/${params?.id}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setRace(data.race);
        setParticipants(data.participants);
        setErrorState(null);

        // Get current myParticipant from ref (state may be stale in async callback)
        // CRITICAL: Also check localStorage directly as ref may not be updated yet
        let currentMyParticipant = myParticipantRef.current;

        const raceIdKey = `race_${data.race.id}_participant`;
        const roomCodeKey = data.race.roomCode ? `race_${data.race.roomCode}_participant` : null;
        const paramKey = params?.id ? `race_${params.id}_participant` : null;
        
        // Fallback to localStorage if ref is stale (race condition on initial load)
        if (!currentMyParticipant) {
          const stored = localStorage.getItem(raceIdKey) || 
            (roomCodeKey ? localStorage.getItem(roomCodeKey) : null) ||
            (paramKey ? localStorage.getItem(paramKey) : null);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.raceId === data.race.id || !parsed?.raceId) {
                currentMyParticipant = parsed;
                console.log(`[Race] Loaded participant from localStorage fallback:`, parsed.id);
              }
            } catch (e) {
              console.warn("[Race] Failed to parse localStorage fallback:", e);
            }
          }
        }

        const persistParticipant = (p: any) => {
          try {
            localStorage.setItem(raceIdKey, JSON.stringify(p));
            if (roomCodeKey) localStorage.setItem(roomCodeKey, JSON.stringify(p));
            if (paramKey) localStorage.setItem(paramKey, JSON.stringify(p));
          } catch (e) {
            console.warn("[Race] Failed to persist participant:", e);
          }
        };

        const clearParticipantKeys = () => {
          try {
            localStorage.removeItem(raceIdKey);
            if (roomCodeKey) localStorage.removeItem(roomCodeKey);
            if (paramKey) localStorage.removeItem(paramKey);
          } catch (e) {
            console.warn("[Race] Failed to clear participant keys:", e);
          }
        };

        // If we loaded a stale participant (common with room-code URLs), clear it so we can recover
        let effectiveMyParticipant = currentMyParticipant;
        if (effectiveMyParticipant && effectiveMyParticipant.raceId !== data.race.id) {
          console.log(
            `[Race] Clearing stale participant ${effectiveMyParticipant.id} from race ${effectiveMyParticipant.raceId} (current race ${data.race.id})`,
          );
          clearParticipantKeys();
          effectiveMyParticipant = null;
          setMyParticipant(null);
        }

        if (effectiveMyParticipant) {
          // Update existing participant data
          const updatedParticipant = data.participants.find((p: Participant) => p.id === effectiveMyParticipant.id);
          if (updatedParticipant) {
            const merged = {
              ...updatedParticipant,
              joinToken: effectiveMyParticipant.joinToken ?? updatedParticipant.joinToken,
            };
            setMyParticipant(merged);
            persistParticipant(merged);
          } else {
            // Participant not found in race data - stale localStorage, clear it
            console.log(`[Race] Stale participant ${effectiveMyParticipant.id} not found in race ${data.race.id} - clearing localStorage`);
            clearParticipantKeys();
            setMyParticipant(null);
            myParticipantRef.current = null;
          }
        } else if (user) {
          // If no participant set but user is logged in, try to find their participant
          const userParticipant = data.participants.find((p: Participant) => p.userId === user.id);
          if (userParticipant) {
            setMyParticipant(userParticipant);
            persistParticipant(userParticipant);
          }
        }

        // If still no participant, try restore from localStorage via race id / room code / param keys
        if (!myParticipantRef.current) {
          const stored =
            localStorage.getItem(raceIdKey) ||
            (roomCodeKey ? localStorage.getItem(roomCodeKey) : null) ||
            (paramKey ? localStorage.getItem(paramKey) : null);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (!parsed?.raceId || parsed.raceId === data.race.id) {
                const restored = { ...parsed, raceId: data.race.id };
                setMyParticipant(restored);
                persistParticipant(restored);
              } else {
                clearParticipantKeys();
              }
            } catch (e) {
              clearParticipantKeys();
            }
          }
        }
      } else if (response.status === 404) {
        setErrorState({
          type: "race_not_found",
          message: "This race doesn't exist or has ended. The room code may have expired.",
          canRetry: false,
        });
      } else if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === "RACE_FULL") {
          setErrorState({
            type: "race_full",
            message: "This race room is full. Try joining another race or create a new one.",
            canRetry: false,
          });
        } else if (errorData.code === "RACE_STARTED") {
          setErrorState({
            type: "race_started",
            message: "This race has already started. You can join the next one.",
            canRetry: false,
          });
        } else {
          setErrorState({
            type: "unknown",
            message: errorData.message || "Unable to join this race.",
            canRetry: true,
          });
        }
      } else {
        setErrorState({
          type: "unknown",
          message: "Something went wrong while loading the race. Please try again.",
          canRetry: true,
        });
      }
    } catch (error) {
      if (!isOnline) {
        setErrorState({
          type: "network",
          message: "You appear to be offline. Please check your internet connection and try again.",
          canRetry: true,
        });
      } else {
        setErrorState({
          type: "network",
          message: "Unable to connect to the server. Please check your connection and try again.",
          canRetry: true,
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  // Fallback check: If stuck in awaiting approval state, periodically check if we're actually in the race
  useEffect(() => {
    if (!isAwaitingRejoinApproval || !race || !myParticipant) return;
    
    const checkInterval = setInterval(async () => {
      try {
        const guestId = !user ? localStorage.getItem("multiplayer_guest_id") : null;
        const url = guestId 
          ? `/api/races/${race.id}?guestId=${encodeURIComponent(guestId)}`
          : `/api/races/${race.id}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          // Check if our participant is in the participants list (means we were approved)
          const isInRace = data.participants?.some((p: Participant) => p.id === myParticipant.id);
          
          if (isInRace) {
            console.log("[Race Rejoin] Fallback check: Participant is in race, clearing awaiting state");
            setIsAwaitingRejoinApproval(false);
            setParticipants(data.participants);
            setRace(data.race);
            if (data.hostParticipantId !== undefined) {
              setHostParticipantId(data.hostParticipantId);
            }
            setHasJoinedRace(true);
            hasJoinedRef.current = true;
            toast.success("Rejoin approved! Welcome back!", { duration: 3000 });
          }
        }
      } catch (error) {
        console.error("[Race Rejoin] Fallback check failed:", error);
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(checkInterval);
  }, [isAwaitingRejoinApproval, race, myParticipant, user]);

  const canShowToast = (key: string, cooldownMs = 5000) => {
    const now = Date.now();
    const last = toastCooldownRef.current.get(key) ?? 0;
    if (now - last < cooldownMs) return false;
    toastCooldownRef.current.set(key, now);
    return true;
  };

  const blockReconnect = useCallback((reason?: string, fallbackSeconds = 30) => {
    let blockSeconds = fallbackSeconds;
    if (reason) {
      const match = reason.match(/(\d+)\s*seconds?/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          blockSeconds = parsed;
        }
      }
    }
    reconnectBlockedUntilRef.current = Date.now() + blockSeconds * 1000;
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectBlockedUntilRef.current && Date.now() < reconnectBlockedUntilRef.current) {
      return;
    }
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setIsReconnecting(false);
      toast.error("Unable to reconnect. Please refresh the page.", {
        duration: 10000,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
      return;
    }

    if (!isOnline) {
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    reconnectAttempts.current += 1;

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000);

    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }, [isOnline]);

  // Manual reconnect with reset
  const manualReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttempts.current = 0;
    reconnectBlockedUntilRef.current = null;
    setIsReconnecting(true);
    connectWebSocket();
  }, []);

  function connectWebSocket() {
    if (!isOnline) {
      return;
    }
    if (reconnectBlockedUntilRef.current && Date.now() < reconnectBlockedUntilRef.current) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/race`;
    const socket = new WebSocket(wsUrl);
    const socketRaceKey = params?.id;

    socket.onopen = () => {
      setWs(socket);
      wsRef.current = socket; // Also update ref immediately for cleanup to access
      setWsConnected(true);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;

      while (pendingMessagesRef.current.length > 0) {
        const message = pendingMessagesRef.current.shift();
        if (message) {
          socket.send(message);
        }
      }

      if (wasOffline) {
        toast.success("Reconnected to race server");
      }
    };

    socket.onmessage = (event) => {
      // Ignore messages from stale sockets (race changed / reconnect overlap)
      if (socketRaceKey !== params?.id) return;
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("[Race] Failed to parse WebSocket message:", error, event.data);
        // Don't crash the app - just log the error
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsConnected(false);
    };

    socket.onclose = (event) => {
      setWsConnected(false);
      // Use ref to check if this socket is still the current one
      // This avoids stale closure issues with the ws state variable
      if (wsRef.current === socket) {
        setWs(null);
        wsRef.current = null;
      }
      hasJoinedRef.current = false;
      setHasJoinedRace(false); // Reset state to prevent UI from showing authenticated when not
      setIsAwaitingRejoinApproval(false); // Clear rejoin approval state on disconnect

      if (event.code === 1008 || event.code === 1013) {
        blockReconnect(event.reason, 30);
        return;
      }

      if (event.code === 4000) {
        return;
      }

      if (event.code !== 1000 && race?.status !== "finished") {
        attemptReconnect();
      }
    };
  }

  function sendWsMessage(message: object) {
    const messageStr = JSON.stringify(message);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    } else if (isOnline) {
      pendingMessagesRef.current.push(messageStr);
      if (!isReconnecting && ws?.readyState !== WebSocket.CONNECTING) {
        attemptReconnect();
      }
    } else {
      pendingMessagesRef.current.push(messageStr);
    }
  }

  useEffect(() => {
    if (isOnline && wasOffline && !wsConnected && !isReconnecting) {
      reconnectAttempts.current = 0;
      connectWebSocket();
    }
  }, [isOnline, wasOffline, wsConnected, isReconnecting]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (progressFlushTimerRef.current) {
        clearTimeout(progressFlushTimerRef.current);
      }
    };
  }, []);

  function handleWebSocketMessage(message: any) {
    // Filter out messages from different races to prevent state pollution
    // Messages with raceId should match current race
    if (message.raceId && raceRef.current && message.raceId !== raceRef.current.id) {
      console.log(`[Race] Ignoring message for different race (got ${message.raceId}, current ${raceRef.current.id})`);
      return;
    }
    
    switch (message.type) {
      case "joined":
        // Server confirmed our join - NOW we're truly authenticated
        setHasJoinedRace(true);
        joinRetryAttemptsRef.current = 0; // Reset retry counter on successful join
        if (joinRetryTimeoutRef.current) {
          clearTimeout(joinRetryTimeoutRef.current);
          joinRetryTimeoutRef.current = null;
        }
        setRace(message.race);
        setParticipants(message.participants);
        if (message.hostParticipantId) {
          setHostParticipantId(message.hostParticipantId);
        }
        if (message.participants) {
          message.participants.forEach((p: Participant) => {
            seenParticipantJoinsRef.current.add(p.id);
          });
        }
        // Show confirmation toast to the user who just joined
        toast.success("You joined the race!", { duration: 2000 });
        // Handle joining a race that's already in progress
        if (message.race.status === "racing") {
          setIsRacing(true);
          // Phase 3: Use server's startedAt for consistent timing across clients
          // This ensures late joiners see the correct elapsed time
          const serverStartTime = message.race.startedAt ? new Date(message.race.startedAt).getTime() : Date.now();
          setStartTime(serverStartTime);
          setCurrentIndex(0);
          setErrors(0);
          currentIndexRef.current = 0;
          errorsRef.current = 0;
          if (message.race.paragraphContent) {
            setCharStates(new Array(message.race.paragraphContent.length).fill('pending'));
          }
          toast.info("Race in progress - start typing!", { duration: 3000 });
        } else if (message.race.status === "countdown") {
          setCountdown(3);
          toast.info("Race starting soon!", { duration: 2000 });
        }
        break;
      case "participant_joined":
        setParticipants(message.participants);
        if (message.hostParticipantId) {
          setHostParticipantId(message.hostParticipantId);
        }
        if (message.participant && !seenParticipantJoinsRef.current.has(message.participant.id)) {
          seenParticipantJoinsRef.current.add(message.participant.id);
          // Only show notification if this isn't our own join (we already got "joined" message)
          if (message.participant.id !== myParticipantRef.current?.id) {
            toast.success(`${message.participant.username} joined the race!`, { duration: 2000 });
            // Add system message to chat
            setChatMessages(prev => [...prev, {
              id: Date.now(),
              username: "System",
              avatarColor: null,
              message: `${message.participant.username} joined the race`,
              isSystem: true,
              createdAt: new Date().toISOString(),
            }]);
          }
        }
        break;
      case "participants_sync":
        setParticipants(message.participants);
        if (message.hostParticipantId) {
          setHostParticipantId(message.hostParticipantId);
        }
        break;
      case "bots_added":
        fetchRaceData();
        toast.info("More players joined!", { duration: 2000 });
        break;
      case "countdown_start":
        setIsStarting(false);
        setIsTransitioning(false);
        setCountdown(message.countdown);
        if (message.participants) {
          setParticipants(message.participants);
        }
        break;
      case "countdown":
        setCountdown(message.countdown);
        break;
      case "race_start":
        setCountdown(null);
        setIsRacing(true);
        // Phase 3: Use server timestamp with clock drift compensation
        // This ensures consistent timing across all clients
        const serverTimestamp = message.serverTimestamp || Date.now();
        const clientNow = Date.now();
        const clockDrift = clientNow - serverTimestamp;
        // Store clock drift for future time calculations
        if (Math.abs(clockDrift) > 5000) {
          console.warn(`[Race Timer] Large clock drift detected: ${clockDrift}ms`);
        }
        // Use server timestamp as authoritative start time
        setStartTime(serverTimestamp);
        keystrokesRef.current = [];
        keystrokesSubmittedRef.current = false;
        lastKeystrokeTimestampRef.current = 0;
        setCurrentIndex(0);
        setErrors(0);
        currentIndexRef.current = 0;
        errorsRef.current = 0;
        timedFinishSentRef.current = false; // Reset for new race
        if (raceRef.current) {
          setRace({ ...raceRef.current, status: "racing" });
          setCharStates(new Array(raceRef.current.paragraphContent.length).fill('pending'));
        }
        toast.success("Race started! Type as fast as you can!");
        break;
      case "paragraph_extended":
        if (raceRef.current) {
          const newContent = raceRef.current.paragraphContent + " " + message.additionalContent;
          setRace({ ...raceRef.current, paragraphContent: newContent });
          setCharStates(prev => {
            const newStates = [...prev];
            for (let i = prev.length; i < newContent.length; i++) {
              newStates[i] = 'pending';
            }
            return newStates;
          });
          toast.info("More text added! Keep typing!", { duration: 2000 });
          extensionRequestedRef.current = false;
        }
        break;
      case "progress_update":
        setParticipants(prev => prev.map(p =>
          p.id === message.participantId
            ? { ...p, progress: message.progress, wpm: message.wpm, accuracy: message.accuracy, errors: message.errors }
            : p
        ));
        break;
      case "participant_finished":
        setParticipants(prev => prev.map(p =>
          p.id === message.participantId
            ? { ...p, isFinished: 1, finishPosition: message.position }
            : p
        ));
        break;
      case "race_finished":
        // Mark that we've received final results via WebSocket
        raceFinishedReceivedRef.current = true;
        setIsRacing(false);
        setParticipants(message.results);
        if (raceRef.current) {
          setRace({ ...raceRef.current, status: "finished" });
        }
        // Use ref to get current participant ID (avoids stale closure issues)
        const currentParticipant = myParticipantRef.current;
        const myResult = message.results.find((p: Participant) => p.id === currentParticipant?.id);

        // If myResult found, use server values; otherwise default to 100% accuracy for no typing
        const finalWpm = myResult?.wpm ?? 0;
        const finalAccuracy = myResult?.accuracy ?? 100;
        // Use 'progress' field from server (characters typed) - 'characters' doesn't exist in DB schema
        const finalCharacters = myResult?.progress || currentIndexRef.current || 0;
        // Calculate errors from the result or derive from accuracy and characters
        const finalErrors = myResult?.errors ?? Math.round(finalCharacters * (1 - finalAccuracy / 100));
        // Consistency estimate: based on accuracy with slight variation
        // High accuracy = high consistency (stable typing with few errors)
        const baseConsistency = finalAccuracy || 100;
        const finalConsistency = Math.max(70, Math.min(100, Math.round(
          baseConsistency * 0.95 + (finalCharacters > 100 ? 5 : finalCharacters / 20)
        )));

        setFinishBannerData({
          position: myResult?.finishPosition || null,
          totalPlayers: message.results.length,
          wpm: finalWpm,
          accuracy: finalAccuracy,
        });

        setLastResultSnapshot({
          wpm: finalWpm,
          accuracy: finalAccuracy,
          consistency: finalConsistency,
          placement: myResult?.finishPosition || message.results.length,
          totalParticipants: message.results.length,
          characters: finalCharacters,
          errors: finalErrors,
          duration: raceRef.current?.timeLimitSeconds || Math.round(elapsedTime) || 60,
        });

        setShowFinishBanner(true);

        // Extract certificate verification ID from the race_finished message
        if (message.certificates && currentParticipant?.id) {
          const myVerificationId = message.certificates[currentParticipant.id];
          if (myVerificationId) {
            setCertificateVerificationId(myVerificationId);
            console.log(`[Race Certificate] Received verification ID: ${myVerificationId}`);
          }
        }

        if (user) {
          fetch("/api/ratings/me")
            .then(res => res.json())
            .then(data => {
              if (data.rating) {
                setRatingInfo(data.rating);
              }
            })
            .catch(err => console.error("Failed to fetch rating:", err));
        }
        break;
      case "race_results_enriched":
        if (Array.isArray(message.results)) {
          setParticipants(message.results);
        }
        break;
      case "participant_left":
        setParticipants(prev => prev.filter(p => p.id !== message.participantId));
        // Add system message to chat (username may be included in message)
        // Don't show toast for own leave (user already knows they left)
        if (message.username && message.participantId !== myParticipantRef.current?.id) {
          toast.info(`${message.username} left the race`, { duration: 2000 });
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: "System",
            avatarColor: null,
            message: `${message.username} left the race`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          }]);
        }
        break;
      case "participant_removed":
        // A participant (usually a bot) was removed to make room
        setParticipants(message.participants);
        if (message.hostParticipantId) {
          setHostParticipantId(message.hostParticipantId);
        }
        break;
      case "participant_disconnected":
        // Remove participant from list and show notification
        setParticipants(prev => prev.filter(p => p.id !== message.participantId));
        if (message.participantId !== myParticipantRef.current?.id && message.username) {
          toast.warning(`${message.username} disconnected`, {
            description: message.reason === "timeout" ? "Connection timed out" : "Left the race",
            duration: 3000
          });
          // Add system message to chat
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: "System",
            avatarColor: null,
            message: `${message.username} disconnected`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          }]);
        }
        break;
      case "participant_reconnected":
        // Mark participant as reconnected and show notification
        setParticipants(prev => prev.map(p =>
          p.id === message.participantId
            ? { ...p, isDisconnected: false }
            : p
        ));
        if (message.participantId !== myParticipantRef.current?.id && message.username) {
          toast.success(`${message.username} reconnected!`, { duration: 2000 });
          // Add system message to chat
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: "System",
            avatarColor: null,
            message: `${message.username} reconnected`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          }]);
        }
        break;
      case "host_changed":
        // Host was transferred to a new player
        if (message.newHostParticipantId) {
          setHostParticipantId(message.newHostParticipantId);
          const isMe = message.newHostParticipantId === myParticipantRef.current?.id;
          toast.info(isMe ? "You are now the host!" : message.message || `${message.newHostUsername} is now the host`, {
            duration: 3000
          });
          // Add system message to chat
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: "System",
            avatarColor: null,
            message: isMe ? "You are now the host" : `${message.newHostUsername} is now the host`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          }]);
        }
        break;
      case "countdown_cancelled":
        // Countdown was cancelled (not enough players, etc.)
        setCountdown(null);
        setIsStarting(false);
        setIsTransitioning(false);
        toast.warning("Race countdown cancelled", {
          description: message.reason || "Not enough players",
          duration: 4000
        });
        break;
      case "server_shutdown":
        // Server is shutting down gracefully
        toast.warning("Server maintenance", {
          description: message.message || "Server is restarting. Please rejoin shortly.",
          duration: 10000
        });
        break;
      case "participant_dnf":
        // Mark participant as DNF (Did Not Finish)
        setParticipants(prev => prev.map(p =>
          p.id === message.participantId
            ? { ...p, isFinished: 1, finishPosition: 999 }
            : p
        ));
        // Don't show toast for own DNF (user already knows they left)
        if (message.participantId !== myParticipantRef.current?.id) {
          toast.info(`${message.username} left the race (DNF)`, { duration: 2000 });
          // Add system message to chat
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: "System",
            avatarColor: null,
            message: `${message.username} left the race (DNF)`,
            isSystem: true,
            createdAt: new Date().toISOString(),
          }]);
        }
        break;
      case "chat_message":
        const chatData = message.message || message;
        setChatMessages(prev => [...prev, {
          id: chatData.id || Date.now(),
          username: chatData.username,
          avatarColor: chatData.avatarColor,
          message: chatData.content || chatData.message,
          isSystem: chatData.isSystem || false,
          createdAt: chatData.createdAt || new Date().toISOString(),
        }]);
        break;
      case "chat_history":
        // Restore chat history on reconnect
        if (message.messages && Array.isArray(message.messages)) {
          const historyMessages = message.messages.map((msg: any) => ({
            id: msg.id || Date.now(),
            username: msg.username,
            avatarColor: msg.avatarColor,
            message: msg.content || msg.message,
            isSystem: msg.isSystem || false,
            createdAt: msg.createdAt || new Date().toISOString(),
          }));
          // Merge with existing messages, avoiding duplicates
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = historyMessages.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newMessages].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
        break;
      case "rating_update":
        if (message.userId === user?.id) {
          setRatingInfo({
            rating: message.newRating,
            tier: message.tier,
            tierInfo: message.tierInfo,
            ratingChange: message.ratingChange,
          });
        }
        break;
      case "ready_state_update":
        // Update ready states for all participants
        if (message.readyStates) {
          const newReadyStates = new Map<number, boolean>();
          for (const { participantId, isReady: ready } of message.readyStates) {
            newReadyStates.set(participantId, ready);
          }
          setReadyStates(newReadyStates);
          // Update our own ready state if it changed
          if (myParticipantRef.current && message.participantId === myParticipantRef.current.id) {
            setIsReady(message.isReady);
          }
        }
        break;
      case "player_kicked":
        // Use server-provided participants list if available (more reliable)
        // Otherwise fall back to filtering locally
        if (message.participants && Array.isArray(message.participants)) {
          setParticipants(message.participants);
        } else {
          setParticipants(prev => prev.filter(p => p.id !== message.participantId));
        }
        setReadyStates(prev => {
          const newStates = new Map(prev);
          newStates.delete(message.participantId);
          return newStates;
        });
        toast.info(`${message.username || 'A player'} was kicked from the room`, { duration: 3000 });
        // Add system message to chat
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: "System",
          avatarColor: null,
          message: `${message.username || 'A player'} was kicked from the room`,
          isSystem: true,
          createdAt: new Date().toISOString(),
        }]);
        break;
      case "kicked":
        // We were kicked from the room
        toast.error(message.message || "You have been kicked from the room", { duration: 5000 });
        setLocation("/multiplayer");
        break;
      case "rejoin_request":
        // Host receives a rejoin request from a kicked player
        setPendingRejoinRequests(prev => {
          // Avoid duplicates
          if (prev.some(r => r.participantId === message.participantId)) {
            return prev;
          }
          return [...prev, { participantId: message.participantId, username: message.username }];
        });
        toast.info(message.message || `${message.username} is requesting to rejoin`, {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => {} // UI will show pending requests
          }
        });
        break;
      case "rejoin_request_pending":
        // Kicked player's request is pending host approval
        setIsAwaitingRejoinApproval(true);
        toast.info(message.message || "Rejoin request sent. Waiting for host approval...", { duration: 8000 });
        break;
      case "rejoin_approved":
        // Host approved our rejoin request - seamless rejoin without page reload
        try {
          console.log("[Race Rejoin] Received rejoin_approved message", message);
          setIsAwaitingRejoinApproval(false);
          toast.success(message.message || "Rejoin approved! Welcome back!", { duration: 3000 });
          
          // Update local state with the received race data
          if (message.race) {
            setRace(message.race);
            raceRef.current = message.race;
          }
          if (message.participants && Array.isArray(message.participants)) {
            setParticipants(message.participants);
            // Check if we're in the participants list to confirm we're actually joined
            const myParticipantId = myParticipantRef.current?.id;
            if (myParticipantId && message.participants.some((p: Participant) => p.id === myParticipantId)) {
              console.log("[Race Rejoin] Confirmed: participant is in the participants list");
            }
          }
          if (message.hostParticipantId !== undefined) {
            setHostParticipantId(message.hostParticipantId);
          }
          if (message.chatHistory && Array.isArray(message.chatHistory)) {
            setChatMessages(message.chatHistory);
          }
          if (message.isRoomLocked !== undefined) {
            setIsRoomLocked(message.isRoomLocked);
          }
          
          // Mark as joined since we're now part of the race
          setHasJoinedRace(true);
          hasJoinedRef.current = true;
          
          // Reset any error states
          setErrorState(null);
        } catch (error) {
          console.error("[Race Rejoin] Error processing rejoin_approved:", error);
          // Fallback: still clear the awaiting state to prevent UI lock
          setIsAwaitingRejoinApproval(false);
          // Try to fetch fresh race data as fallback
          fetchRaceData();
        }
        break;
      case "rejoin_rejected":
        // Host rejected our rejoin request
        setIsAwaitingRejoinApproval(false);
        toast.error(message.message || "Host rejected your rejoin request", { duration: 5000 });
        setLocation("/multiplayer");
        break;
      case "rejoin_decision_confirmed":
        // Host's decision was processed - remove from pending list
        setPendingRejoinRequests(prev => prev.filter(r => r.participantId !== message.targetParticipantId));
        if (message.approved) {
          toast.success(message.message || `Player allowed to rejoin`, { duration: 3000 });
        } else {
          toast.info(message.message || `Rejoin request rejected`, { duration: 3000 });
        }
        break;
      case "player_rejoin_allowed":
        // Broadcast that a player was allowed to rejoin
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: "System",
          avatarColor: null,
          message: message.message || `${message.username} has been allowed to rejoin`,
          isSystem: true,
          createdAt: new Date().toISOString(),
        }]);
        break;
      case "room_lock_changed":
        setIsRoomLocked(message.isLocked);
        toast.info(message.isLocked ? "Room is now locked" : "Room is now unlocked", { duration: 2000 });
        // Add system message to chat
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: "System",
          avatarColor: null,
          message: message.isLocked ? "Room is now locked - no new players can join" : "Room is now unlocked",
          isSystem: true,
          createdAt: new Date().toISOString(),
        }]);
        break;
      case "rematch_available":
        setRematchInfo({
          newRaceId: message.newRaceId,
          roomCode: message.roomCode,
          createdBy: message.createdBy,
        });
        toast.success(`New race created! Joining...`, {
          duration: 2000,
        });
        
        // Clear old race participant data from localStorage before joining new race
        if (race?.id && race.id !== message.newRaceId) {
          localStorage.removeItem(`race_${race.id}_participant`);
        }
        
        // Close current WebSocket before redirecting to prevent "session taken over"
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close(1000, "Navigating to new race");
        }
        
        // Auto-redirect to the new race
        setTimeout(() => {
          setLocation(`/race/${message.newRaceId}`);
        }, 500);
        break;
      case "race_certificates":
        // Handle server-generated certificate verification IDs
        if (message.certificates && myParticipantRef.current?.id) {
          const myVerificationId = message.certificates[myParticipantRef.current.id];
          if (myVerificationId) {
            setCertificateVerificationId(myVerificationId);
            console.log(`[Race Certificate] Received verification ID: ${myVerificationId}`);
          }
        }
        break;
      case "connection_superseded":
        // Phase 7: Server detected duplicate connection from same identity
        console.warn("[Race Multi-tab] Connection superseded by another session");
        setIsMultiTabBlocked(true);
        if (canShowToast("connection_superseded", 8000)) {
          toast.error("Session taken over", {
            description: message.message || "Another session connected with your account",
            duration: 5000,
          });
        }
        // Don't try to reconnect - the other tab is authoritative
        reconnectAttempts.current = maxReconnectAttempts; // Prevent auto-reconnect
        break;
        
      case "error":
        // Handle server-side errors with typed error codes
        switch (message.code) {
          case "IP_LIMIT_EXCEEDED":
            blockReconnect(message.message, 60);
            reconnectAttempts.current = maxReconnectAttempts;
            setIsReconnecting(false);
            if (canShowToast("ip_limit_exceeded", 10000)) {
              toast.error("Connection limit reached", {
                description: message.message || "Please wait before reconnecting",
                duration: 5000,
              });
            }
            break;
          case "CHAT_RATE_LIMITED":
            toast.error("Slow down!", {
              description: message.message || "Please wait before sending another message",
              duration: 2000
            });
            break;
          case "NOT_HOST":
            toast.error("Permission denied", {
              description: message.message || "Only the host can do this",
              duration: 3000
            });
            break;
          case "NOT_ENOUGH_PLAYERS":
            toast.warning("Not enough players", {
              description: message.message || "Need at least 2 players to start",
              duration: 4000
            });
            break;
          case "PLAYERS_NOT_READY":
            toast.warning("Players not ready", {
              description: message.message || "All players must be ready to start",
              duration: 4000
            });
            break;
          case "ROOM_LOCKED":
            toast.error("Room locked", {
              description: message.message || "This room is not accepting new players",
              duration: 3000
            });
            break;
          case "KICKED":
            toast.error("Kicked", {
              description: message.message || "You have been kicked from the room",
              duration: 5000
            });
            setLocation("/multiplayer");
            break;
          case "PLAYER_NOT_FOUND":
            toast.error("Player not found", {
              description: message.message || "The player may have already left the room",
              duration: 3000
            });
            break;
          case "CANNOT_KICK_SELF":
            toast.error("Cannot kick yourself", {
              description: message.message || "You cannot remove yourself from the room",
              duration: 3000
            });
            break;
          case "ROOM_NOT_FOUND":
            toast.error("Room not found", {
              description: message.message || "The race room no longer exists",
              duration: 3000
            });
            break;
          case "RACE_IN_PROGRESS":
            toast.error("Race in progress", {
              description: message.message || "Cannot perform this action during an active race",
              duration: 3000
            });
            break;
          case "RACE_FINISHED":
            toast.error("Race finished", {
              description: message.message || "Cannot perform this action on a finished race",
              duration: 3000
            });
            break;
          case "RACE_STARTING":
            toast.info("Race starting", {
              description: message.message || "The race is already starting...",
              duration: 2000
            });
            break;
          case "ALREADY_KICKED":
            toast.warning("Already kicked", {
              description: message.message || "This player has already been kicked",
              duration: 2000
            });
            break;
          case "INVALID_REQUEST":
            toast.error("Invalid request", {
              description: message.message || "The request was invalid",
              duration: 3000
            });
            break;
          case "INVALID_RACE_STATUS":
            toast.error("Invalid action", {
              description: message.message || "Cannot perform this action in the current race state",
              duration: 3000
            });
            break;
          case "RATE_LIMITED":
            toast.error("Too fast", {
              description: message.message || "Please slow down and try again",
              duration: 2000
            });
            break;
          case "INVALID_PAYLOAD":
            toast.error("Invalid data", {
              description: message.message || "The data sent was invalid",
              duration: 3000
            });
            break;
          case "TOKEN_REQUIRED":
          case "INVALID_TOKEN":
            // Auth token issue - clear localStorage and retry with exponential backoff
            console.warn(`[Race] Auth token error, attempt ${joinRetryAttemptsRef.current + 1}/${maxJoinRetryAttempts}`);
            if (race?.id) {
              localStorage.removeItem(`race_${race.id}_participant`);
              if (race.roomCode) localStorage.removeItem(`race_${race.roomCode}_participant`);
            }
            if (params?.id) {
              localStorage.removeItem(`race_${params.id}_participant`);
            }
            setMyParticipant(null);
            hasJoinedRef.current = false;
            setHasJoinedRace(false);
            
            if (joinRetryAttemptsRef.current < maxJoinRetryAttempts) {
              joinRetryAttemptsRef.current++;
              // Exponential backoff: 1s, 2s, 4s
              const retryDelay = Math.pow(2, joinRetryAttemptsRef.current - 1) * 1000;
              toast.error("Authentication failed", {
                description: `Retrying in ${retryDelay / 1000}s...`,
                duration: retryDelay
              });
              joinRetryTimeoutRef.current = setTimeout(() => {
                fetchRaceData();
              }, retryDelay);
            } else {
              toast.error("Authentication failed", {
                description: "Please refresh the page or go back to the lobby",
                duration: 5000
              });
            }
            break;
          case "NOT_IN_RACE":
            toast.error("Not connected", {
              description: message.message || "You are not connected to this race",
              duration: 3000
            });
            // Try to reconnect
            if (!isReconnecting) {
              connectWebSocket();
            }
            break;
          case "INSUFFICIENT_PLAYERS":
            toast.warning("Not enough players", {
              description: message.message || "More players needed to start the race",
              duration: 4000
            });
            break;
          case "RACE_UNAVAILABLE":
            // Race is no longer available (finished, cancelled, or not found)
            setIsStarting(false);
            toast.error("Race unavailable", {
              description: message.message || "This race is no longer available",
              duration: 5000
            });
            // Redirect to multiplayer after a short delay
            setTimeout(() => {
              setLocation("/multiplayer");
            }, 2000);
            break;
          default:
            // Check for auth-related error messages
            const authErrorPatterns = ["not authenticated", "invalid participant", "join token", "authentication"];
            const isAuthError = authErrorPatterns.some(pattern => 
              message.message?.toLowerCase().includes(pattern)
            );
            
            if (isAuthError) {
              console.warn(`[Race] Auth error detected, attempt ${joinRetryAttemptsRef.current + 1}/${maxJoinRetryAttempts}`);
              if (race?.id) {
                localStorage.removeItem(`race_${race.id}_participant`);
                if (race.roomCode) localStorage.removeItem(`race_${race.roomCode}_participant`);
              }
              if (params?.id) {
                localStorage.removeItem(`race_${params.id}_participant`);
              }
              setMyParticipant(null);
              hasJoinedRef.current = false;
              setHasJoinedRace(false);
              
              if (joinRetryAttemptsRef.current < maxJoinRetryAttempts) {
                joinRetryAttemptsRef.current++;
                const retryDelay = Math.pow(2, joinRetryAttemptsRef.current - 1) * 1000;
                joinRetryTimeoutRef.current = setTimeout(() => {
                  fetchRaceData();
                }, retryDelay);
              }
            }
            
            if (message.message) {
              toast.error(message.message, { duration: 3000 });
            }
            console.warn("Server error:", message.code, message.message);
        }
        break;
      case "ready_state_changed":
        // A player's ready state changed
        setReadyStates(prev => {
          const newMap = new Map(prev);
          newMap.set(message.participantId, message.isReady);
          return newMap;
        });
        break;
      case "participant_kicked":
        // A player was kicked by the host (different from player_kicked which is the older handler)
        setParticipants(prev => prev.filter(p => p.id !== message.participantId));
        if (message.username) {
          toast.warning(`${message.username} was removed by the host`, { duration: 3000 });
        }
        break;
    }
  }


  function updateProgress(progress: number, errorCount = errors) {
    if (!myParticipant || !startTime || !race) return;

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const correctChars = Math.max(0, progress - errorCount);
    const wpm = calculateWPM(correctChars, elapsedSeconds);
    const accuracy = calculateAccuracy(correctChars, progress);

    const now = Date.now();
    const flush = () => {
      const pending = pendingProgressRef.current;
      if (!pending) return;
      pendingProgressRef.current = null;
      lastProgressSentRef.current = Date.now();
      sendWsMessage({
        type: "progress",
        participantId: myParticipant.id,
        progress: pending.progress,
        wpm: pending.wpm,
        accuracy: pending.accuracy,
        errors: pending.errors,
      });
    };

    if (now - lastProgressSentRef.current < 100) {
      pendingProgressRef.current = { progress, errors: errorCount, wpm: wpm || 0, accuracy };
      if (!progressFlushTimerRef.current) {
        progressFlushTimerRef.current = setTimeout(() => {
          progressFlushTimerRef.current = null;
          flush();
        }, 100);
      }
    } else {
      pendingProgressRef.current = { progress, errors: errorCount, wpm: wpm || 0, accuracy };
      flush();
    }

    setMyParticipant(prev => prev ? { ...prev, progress, wpm: wpm || 0, accuracy, errors: errorCount } : null);
  }

  function finishRace() {
    if (!myParticipant) return;

    submitKeystrokes(liveWpm);

    setIsRacing(false);
    sendWsMessage({
      type: "finish",
      raceId: race?.id,
      participantId: myParticipant.id,
    });

    setMyParticipant(prev => prev ? { ...prev, isFinished: 1 } : null);
  }

  function copyRoomCode() {
    if (race) {
      navigator.clipboard.writeText(race.roomCode);
      setCopied(true);
      toast.success("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyShareLink() {
    if (race) {
      const shareUrl = `${window.location.origin}/race/${race.id}?code=${race.roomCode}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Invite link copied! Share it with friends.");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function startRace() {
    if (!participants.length || isStarting || isTransitioning) return;

    // Only the host can start the race
    if (hostParticipantId && myParticipant?.id !== hostParticipantId) {
      toast.error("Only the room host can start the race");
      return;
    }

    setIsStarting(true);
    setIsTransitioning(true);
    setTransitionMessage("Preparing race...");
    sendWsMessage({
      type: "ready",
      raceId: race?.id,
      participantId: myParticipant?.id,
    });
  }

  function handleLeaveClick() {
    // If in waiting room (not racing), leave directly without confirmation
    // No need for scary confirmation when race hasn't started
    if (race?.status === "waiting" && !isRacing) {
      // Clean up and navigate directly
      if (myParticipant && race) {
        hasLeftRef.current = true; // Prevent cleanup from sending duplicate leave
        sendWsMessage({
          type: "leave",
          raceId: race.id,
          participantId: myParticipant.id,
          isRacing: false,
          progress: 0,
          wpm: 0,
          accuracy: 100,
        });
        localStorage.removeItem(`race_${race.id}_participant`);
        localStorage.removeItem(`race_${race.roomCode}_participant`);
      }
      toast.info("Left the race lobby", { duration: 2000 });
      setLocation("/multiplayer");
      return;
    }

    // During active racing, show confirmation dialog
    setShowLeaveConfirmation(true);
  }

  function confirmLeaveRace() {
    setIsLeaving(true);
    setShowLeaveConfirmation(false);

    try {
      if (myParticipant && race) {
        hasLeftRef.current = true; // Prevent cleanup from sending duplicate leave
        // Send leave with current progress for DNF tracking
        sendWsMessage({
          type: "leave",
          raceId: race.id,
          participantId: myParticipant.id,
          isRacing: isRacing || race.status === "racing",
          progress: currentIndex,
          wpm: liveWpm,
          accuracy: liveAccuracy,
        });

        // Clean up local storage
        localStorage.removeItem(`race_${race.id}_participant`);
        localStorage.removeItem(`race_${race.roomCode}_participant`);

        toast.info("You left the race", { duration: 2000 });
      } else {
        toast.warning("Leaving race...", { duration: 1500 });
      }
    } catch (error) {
      console.error("[Leave Race] Error:", error);
      toast.error("Failed to leave race properly. Redirecting...", { duration: 2000 });
    } finally {
      // Always redirect to multiplayer
      setTimeout(() => {
        setLocation("/multiplayer");
      }, 100);
    }
  }

  function cancelLeaveRace() {
    setShowLeaveConfirmation(false);
  }

  // Handle error state
  if (errorState) {
    return (
      <RaceErrorDisplay
        error={errorState}
        onRetry={errorState.canRetry ? fetchRaceData : undefined}
        onGoBack={() => setLocation("/multiplayer")}
      />
    );
  }

  // Handle loading state
  if (!race) {
    return (
      <RaceLoadingDisplay
        message={loadingMessage}
        subMessage="Connecting to race server..."
      />
    );
  }

  // Handle awaiting rejoin approval state
  if (isAwaitingRejoinApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-amber-400">Waiting for Host Approval</p>
            <p className="text-muted-foreground">
              You were previously removed from this race. Your rejoin request has been sent to the host.
            </p>
            <p className="text-sm text-muted-foreground/70">
              The host will receive a notification and can choose to allow you back into the race.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/multiplayer")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // Handle transition state (starting race) - but not if countdown has started
  if (isTransitioning && countdown === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{transitionMessage}</p>
            <p className="text-muted-foreground mt-2">Get ready to type!</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle countdown state - check this BEFORE waiting room
  if (countdown !== null || race.status === "countdown") {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6">
            {/* Preparation tip with tooltip */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help bg-muted/30 px-4 py-2 rounded-full">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Get ready to type!</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">Preparation Tips</p>
                  <ul className="text-zinc-400 text-sm list-disc list-inside mt-1">
                    <li>Position your fingers on the home row</li>
                    <li>Focus on the first few words</li>
                    <li>Race begins automatically when timer hits zero</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Countdown number */}
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary animate-pulse" data-testid="countdown-number">
              {countdown === 0 ? "GO!" : countdown ?? "..."}
            </div>

            {/* Dynamic instruction */}
            {countdown === null || countdown > 0 ? (
              <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Position your fingers on the keyboard!
              </p>
            ) : (
              <p className="text-green-500 text-lg font-medium flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Start typing now!
              </p>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (race.status === "waiting") {
    // Quick matches are public (isPrivate = 0), so we limit display to 4 to match the actual experience
    const displayMaxPlayers = !race.isPrivate ? 4 : race.maxPlayers;

    return (
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl lg:max-w-6xl">
            <AuthPrompt message="save your race results and climb the global ranks!" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 space-y-3 sm:space-y-0 mt-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveClick}
                    data-testid="button-leave-race"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Lobby
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Leave the race and return to multiplayer lobby</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Waiting for Players
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">Waiting Room</p>
                          <p className="text-zinc-400">Share your room code with friends to invite them to race!</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Share the room code with friends</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={copyRoomCode}
                          data-testid="button-copy-code"
                          className="font-mono text-sm sm:text-base h-10 sm:h-auto"
                        >
                          {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Share2 className="h-4 w-4 mr-2" />}
                          {race.roomCode}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="font-medium">{copied ? "Copied!" : "Click to copy room code"}</p>
                        <p className="text-zinc-400">Share this code with friends to let them join</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchRaceData()}
                          disabled={isRefreshing}
                          data-testid="button-refresh-participants"
                          className="h-10 w-10"
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="font-medium">Refresh</p>
                        <p className="text-zinc-400">Sync participant list with server</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Room Settings Display */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-3 pt-3 border-t space-y-2 sm:space-y-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>{race.timeLimitSeconds ? `${race.timeLimitSeconds}s race` : 'Untimed'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium">
                      Players ({participants.length})
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{participants.length} {participants.length === 1 ? 'player' : 'players'} in the race</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid gap-2">
                    {participants.length === 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center py-6 text-muted-foreground cursor-help border-2 border-dashed border-muted rounded-lg">
                            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">Waiting for players to join...</p>
                            <p className="text-xs mt-1 opacity-70">Share the room code to invite friends</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="font-medium">Invite Players</p>
                          <p className="text-zinc-400">
                            Share the room code with friends to invite them.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      participants.map((p) => {
                        const playerReady = readyStates.get(p.id) ?? (p.id === hostParticipantId);
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg transition-colors ${p.id === myParticipant?.id ? 'border-primary/50 bg-primary/5' : ''
                              } ${p.id === hostParticipantId ? 'border-yellow-500/50' : ''
                              } ${playerReady ? 'bg-green-500/5' : ''}`}
                            data-testid={`participant-${p.id}`}
                          >
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${p.avatarColor || 'bg-primary'} flex items-center justify-center text-white font-medium relative`}>
                              {p.username[0].toUpperCase()}
                              {p.id === hostParticipantId && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                  <Trophy className="h-3 w-3 text-white" />
                                </div>
                              )}
                              {playerReady && p.id !== hostParticipantId && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                                <span className="truncate">{p.username}</span>
                                {p.id === hostParticipantId && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-yellow-500 text-yellow-500 shrink-0">
                                    Host
                                  </Badge>
                                )}
                                {playerReady && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-green-500 text-green-500 shrink-0">
                                    Ready
                                  </Badge>
                                )}
                              </div>
                              {p.id === myParticipant?.id && (
                                <div className="text-xs text-primary flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  You
                                </div>
                              )}
                            </div>
                            {/* Kick button - only visible to host for other players */}
                            {myParticipant?.id === hostParticipantId && p.id !== myParticipant?.id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => {
                                      if (!wsConnected || !hasJoinedRace) {
                                        toast.warning("Please wait for connection to be established", { duration: 2000 });
                                        return;
                                      }
                                      sendWsMessage({
                                        type: "kick_player",
                                        raceId: race.id,
                                        participantId: myParticipant.id,
                                        targetParticipantId: p.id,
                                      });
                                    }}
                                    disabled={!wsConnected || !hasJoinedRace}
                                    data-testid={`kick-player-${p.id}`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Kick {p.username}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {myParticipant && (
                  <RaceChat
                    raceId={race.id}
                    participantId={myParticipant.id}
                    username={myParticipant.username}
                    avatarColor={myParticipant.avatarColor}
                    sendWsMessage={sendWsMessage}
                    messages={chatMessages}
                    isEnabled={true}
                    wsConnected={wsConnected}
                  />
                )}

                {/* Host controls: Lock room toggle */}
                {myParticipant?.id === hostParticipantId && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm cursor-help">
                          <Lock className="h-4 w-4" />
                          <span>Lock Room</span>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p>When locked, no new players can join the room. Use this once all your friends have joined to prevent strangers from entering.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant={isRoomLocked ? "default" : "outline"}
                      size="sm"
                      className="h-8 sm:h-auto px-2 sm:px-3"
                      onClick={() => {
                        // Ensure we're connected and authenticated before sending
                        if (!wsConnected || !hasJoinedRace) {
                          toast.warning("Please wait for connection to be established", { duration: 2000 });
                          return;
                        }
                        sendWsMessage({
                          type: "lock_room",
                          raceId: race.id,
                          participantId: myParticipant.id,
                          locked: !isRoomLocked,
                        });
                      }}
                      disabled={!wsConnected || !hasJoinedRace}
                      data-testid="button-lock-room"
                    >
                      {isRoomLocked ? "Unlock" : "Lock"}
                    </Button>
                  </div>
                )}

                {/* Pending Rejoin Requests - only visible to host */}
                {myParticipant?.id === hostParticipantId && pendingRejoinRequests.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-medium text-sm">
                      <UserPlus className="h-4 w-4" />
                      <span>Pending Rejoin Requests ({pendingRejoinRequests.length})</span>
                    </div>
                    <div className="space-y-2">
                      {pendingRejoinRequests.map((request) => (
                        <div key={request.participantId} className="flex items-center justify-between gap-2 p-2 bg-background/50 rounded-md">
                          <span className="text-sm truncate">{request.username}</span>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-green-400 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => {
                                sendWsMessage({
                                  type: "rejoin_decision",
                                  raceId: race.id,
                                  participantId: myParticipant.id,
                                  targetParticipantId: request.participantId,
                                  approved: true,
                                });
                              }}
                              disabled={!wsConnected || !hasJoinedRace}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Allow
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => {
                                sendWsMessage({
                                  type: "rejoin_decision",
                                  raceId: race.id,
                                  participantId: myParticipant.id,
                                  targetParticipantId: request.participantId,
                                  approved: false,
                                });
                              }}
                              disabled={!wsConnected || !hasJoinedRace}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show Start Race button only for the host, or show waiting message for others */}
                {(() => {
                  const botCount = participants.filter((p: any) => p.isBot === 1).length;
                  const playerCount = participants.filter((p: any) => p.isBot !== 1).length;
                  const hasBots = botCount > 0;
                  // With bots: 1 player can start. Without bots: 2 players required.
                  const minPlayersNeeded = hasBots ? 1 : 2;
                  const canStart = playerCount >= minPlayersNeeded;
                  const playersNeeded = minPlayersNeeded - playerCount;

                  return (!hostParticipantId || myParticipant?.id === hostParticipantId) ? (
                    <div className="space-y-2">
                      {!canStart && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {hasBots
                              ? "Waiting for you to connect..."
                              : `Waiting for ${playersNeeded} more player${playersNeeded > 1 ? 's' : ''} to join...`}
                          </span>
                        </div>
                      )}


                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={startRace}
                            disabled={!canStart || isStarting}
                            size="lg"
                            className="w-full"
                            data-testid="button-start-race"
                          >
                            {isStarting ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                {!canStart
                                  ? (hasBots ? 'Waiting...' : `Need ${playersNeeded} more player${playersNeeded > 1 ? 's' : ''}`)
                                  : 'Start Race'}
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {!canStart ? (
                            <>
                              <p className="font-medium">Need more players</p>
                              <p className="text-zinc-400">
                                {hasBots
                                  ? "Make sure you're connected to start racing!"
                                  : "Share the room code with friends to start racing!"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">Begin the race</p>
                              <p className="text-zinc-400">A countdown will start and the race begins!</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Waiting for host to start the race...</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (race.status === "racing" || isRacing) {
    return (
      <TooltipProvider delayDuration={300}>
        {/* Leave Race Confirmation Dialog */}
        <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Are you sure you want to leave?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>You're in the middle of an active race. If you leave now:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>You'll be marked as <strong>DNF</strong> (Did Not Finish)</li>
                    <li>Your current progress won't be saved</li>
                    <li>Any rating changes will be forfeited</li>
                  </ul>
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    Current progress: {currentIndex} characters typed
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelLeaveRace}>
                Keep Racing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmLeaveRace}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Leave Race
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl lg:max-w-7xl">
            <div className="mb-6">
              <AuthPrompt message="save this race's results and increase your global rating!" />
            </div>
            {/* Network status banner */}
            <RaceNetworkBanner
              isConnected={wsConnected}
              isReconnecting={isReconnecting}
              reconnectAttempt={reconnectAttempts.current}
              maxAttempts={maxReconnectAttempts}
              onManualRetry={manualReconnect}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 space-y-3 sm:space-y-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLeaveClick}
                    disabled={isLeaving}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                    data-testid="button-leave-race"
                  >
                    {isLeaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Leaving...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Race
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">Click to leave race</p>
                  <p className="text-zinc-400 text-xs">You'll be asked to confirm. Leaving marks you as DNF (Did Not Finish).</p>
                </TooltipContent>
              </Tooltip>

            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-primary" />
                      {race.raceType === "timed" ? "Timed Race" : "Live Race Progress"}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">Real-time Leaderboard</p>
                          <p className="text-zinc-400">
                            {race.raceType === "timed"
                              ? "Type as much as you can before time runs out!"
                              : "Track all racers' progress, speed, and accuracy as they type"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {race.raceType === "timed" && timeRemaining !== null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg font-mono text-base sm:text-lg cursor-help ${timeRemaining <= 10
                            ? 'bg-red-500/20 text-red-400 animate-pulse'
                            : timeRemaining <= 30
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-primary/20 text-primary'
                            }`}>
                            <Timer className="h-5 w-5" />
                            <span data-testid="time-remaining">
                              {Math.floor(timeRemaining / 60)}:{String(Math.floor(timeRemaining % 60)).padStart(2, '0')}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="font-medium">Time Remaining</p>
                          <p className="text-zinc-400">
                            {timeRemaining <= 10
                              ? "Hurry! Almost out of time!"
                              : "Keep typing to maximize your WPM!"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {participants
                      .sort((a, b) => b.progress - a.progress)
                      .map((p) => {
                        const progressPercent = (p.progress / race.paragraphContent.length) * 100;
                        return (
                          <div key={p.id} className="space-y-2" data-testid={`progress-${p.id}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full ${p.avatarColor || 'bg-primary'} flex items-center justify-center text-white text-xs sm:text-sm cursor-help relative`}>
                                      {p.username[0].toUpperCase()}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p className="font-medium">{p.username}</p>
                                    <p className="text-zinc-400">{p.id === myParticipant?.id ? "You" : "Racer"}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="font-medium truncate max-w-[120px] sm:max-w-none">{p.username}</span>
                                  {p.id === myParticipant?.id && (
                                    <span className="text-xs text-primary whitespace-nowrap">(You)</span>
                                  )}
                                  {p.isFinished === 1 && p.finishPosition && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs font-semibold text-yellow-500 cursor-help whitespace-nowrap" data-testid={`text-position-${p.id}`}>
                                          {p.finishPosition === 1 ? '🥇 1st' : p.finishPosition === 2 ? '🥈 2nd' : p.finishPosition === 3 ? '🥉 3rd' : `#${p.finishPosition}`}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
                                        <p className="font-medium">Finished #{p.finishPosition}</p>
                                        <p className="text-zinc-400">{p.username} completed the race!</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-right">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1 cursor-help">
                                        <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                                        <span className="text-xs sm:text-sm">{p.wpm} WPM</span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <p className="font-medium">Words Per Minute</p>
                                      <p className="text-zinc-400">Typing speed measured in words per minute</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1 cursor-help">
                                        <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                                        <span className="text-xs sm:text-sm">{p.accuracy}%</span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <p className="font-medium">Accuracy</p>
                                      <p className="text-zinc-400">Percentage of characters typed correctly</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <Progress value={progressPercent} className="h-2 sm:h-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="font-medium">{Math.round(progressPercent)}% complete</p>
                                <p className="text-zinc-400 text-xs">{p.progress} of {race.paragraphContent.length} characters</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              <div
                className={`cursor-text transition-all duration-200 rounded-lg ${isFocused
                  ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                  : ''
                  }`}
                onClick={() => hiddenInputRef.current?.focus()}
                role="application"
                aria-label="Typing test area"
              >
                {!isFocused && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse py-3">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Click here or press any key to focus</span>
                  </div>
                )}

                <div className="relative">
                  <div
                    ref={textContainerRef}
                    className="text-lg sm:text-xl leading-[1.8] sm:leading-[2] font-mono select-none max-h-[200px] sm:max-h-[280px] overflow-y-auto scroll-smooth p-4 sm:p-6 lg:p-8 bg-zinc-900 rounded-lg whitespace-pre-wrap break-words"
                    data-testid="text-paragraph"
                    role="textbox"
                    aria-readonly="true"
                    aria-label="Text to type"
                    aria-describedby="typing-instructions"
                  >
                    {(() => {
                      const text = race.paragraphContent;
                      const words = text.split(/(\s+)/);
                      let charIndex = 0;

                      const findCurrentWordBounds = () => {
                        let start = 0;
                        for (const word of words) {
                          const end = start + word.length;
                          if (currentIndex >= start && currentIndex < end) {
                            return { start, end };
                          }
                          start = end;
                        }
                        return { start: 0, end: text.length };
                      };

                      const currentWordBounds = findCurrentWordBounds();

                      return words.map((word, wordIdx) => {
                        const wordStartIdx = charIndex;
                        const isCurrentWord = currentIndex >= wordStartIdx && currentIndex < wordStartIdx + word.length;
                        const isCompletedWord = currentIndex >= wordStartIdx + word.length;
                        const isPureSpace = /^\s+$/.test(word);

                        const renderedChars = word.split('').map((char, charIdx) => {
                          const idx = charIndex;
                          charIndex++;

                          const state = charStates[idx] || 'pending';
                          const isCurrent = idx === currentIndex;
                          const isSpace = char === ' ';

                          let className = 'transition-colors duration-75 ';

                          if (state === 'correct') {
                            className += 'text-zinc-100';
                          } else if (state === 'incorrect') {
                            className += 'text-red-500 bg-red-500/20 rounded-sm';
                            if (isSpace) {
                              className += ' border-b-2 border-red-500';
                            }
                          } else if (isCurrent) {
                            className += 'text-zinc-500';
                          } else if (isCurrentWord && !isPureSpace) {
                            className += 'text-zinc-500';
                          } else {
                            className += 'text-zinc-600';
                          }

                          if (isCurrent) {
                            return (
                              <span
                                key={idx}
                                ref={caretRef}
                                className={`${className} relative`}
                              >
                                <span
                                  className={`caret-ultra-smooth ${isFocused ? 'caret-focused' : 'caret-unfocused'}`}
                                />
                                {isSpace ? '\u00A0' : char}
                              </span>
                            );
                          }

                          return (
                            <span
                              key={idx}
                              className={className}
                            >
                              {isSpace ? '\u00A0' : char}
                            </span>
                          );
                        });

                        if (isPureSpace) {
                          return <span key={`word-${wordIdx}`}>{renderedChars}</span>;
                        }

                        return (
                          <span key={`word-${wordIdx}`}>
                            {renderedChars}
                          </span>
                        );
                      });
                    })()}
                  </div>

                  <div id="typing-instructions" className="sr-only">
                    Type the text shown above. Use backspace to correct mistakes. Your progress is tracked in real-time.
                  </div>

                  <input
                    ref={hiddenInputRef}
                    type="text"
                    onInput={handleTyping}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onPaste={handlePaste}
                    onCut={handleCut}
                    disabled={!isRacing || race?.status === "finished" || (race?.raceType === "timed" && timeRemaining !== null && timeRemaining <= 0)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-testid="input-typing"
                    aria-label="Typing input for race"
                    aria-describedby="typing-instructions"
                  />
                </div>
              </div>

              {/* Chat is hidden during active racing to minimize distractions */}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (race.status === "finished") {
    const sortedParticipants = [...participants].sort((a, b) => (a.finishPosition || 999) - (b.finishPosition || 999));
    const myResult = sortedParticipants.find(p => p.id === myParticipant?.id);
    const myPosition = myResult ? sortedParticipants.indexOf(myResult) + 1 : null;

    return (
      <TooltipProvider delayDuration={300}>
        {showFinishBanner && finishBannerData && (
          <RaceFinishBanner
            position={finishBannerData.position}
            totalPlayers={finishBannerData.totalPlayers}
            wpm={finishBannerData.wpm}
            accuracy={finishBannerData.accuracy}
            isWinner={finishBannerData.position === 1}
            onDismiss={() => {
              finishBannerDismissedRef.current = true;
              setShowFinishBanner(false);
            }}
          />
        )}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl lg:max-w-7xl">
            {/* Hero Section */}
            <div className="relative mb-8">
              {/* Background decoration */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-500/10 to-primary/10 rounded-3xl blur-3xl opacity-50" />

              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation("/multiplayer")}
                    className="hover:bg-white/10"
                    data-testid="button-back-to-lobby"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Lobby
                  </Button>
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                    <Flag className="h-3 w-3 mr-1" />
                    Race Complete
                  </Badge>
                </div>

                {/* Your Result Hero */}
                {myResult && lastResultSnapshot && (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center">
                      {myPosition === 1 ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full" />
                          <div className="relative text-4xl sm:text-6xl md:text-7xl">🏆</div>
                        </div>
                      ) : myPosition === 2 ? (
                        <div className="text-4xl sm:text-6xl">🥈</div>
                      ) : myPosition === 3 ? (
                        <div className="text-4xl sm:text-6xl">🥉</div>
                      ) : (
                        <div className="text-3xl sm:text-5xl">🏁</div>
                      )}
                    </div>

                    <div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
                        {myPosition === 1 ? "Victory!" : myPosition === 2 ? "Runner Up!" : myPosition === 3 ? "Podium Finish!" : "Race Complete!"}
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        You finished #{myPosition} of {sortedParticipants.length} racers
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                          <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Speed</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">{lastResultSnapshot.wpm}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">WPM</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-green-400 mb-1">
                          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Accuracy</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">{lastResultSnapshot.accuracy}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Correct</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
                          <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Duration</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">{lastResultSnapshot.duration}s</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Time</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-orange-400 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Consistency</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">{lastResultSnapshot.consistency}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Stable</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Characters</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">{lastResultSnapshot.characters}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Typed</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 border border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-yellow-400 mb-1">
                          <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-[10px] sm:text-xs uppercase tracking-wide">Tier</span>
                        </div>
                        <p className="text-base sm:text-xl font-bold">{getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy).badge}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Performance</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="leaderboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 bg-zinc-900/50 border border-white/10 p-1 rounded-xl h-auto">
                <TabsTrigger value="leaderboard" className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/40 data-[state=active]:shadow font-medium" data-testid="tab-leaderboard">
                  <Trophy className="h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground group-data-[state=active]:text-primary" />
                  <span className="hidden sm:inline">Leaderboard</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:ring-1 data-[state=active]:ring-green-400/40 data-[state=active]:shadow font-medium" data-testid="tab-stats">
                  <Target className="h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground group-data-[state=active]:text-green-400" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="certificate" className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 data-[state=active]:ring-1 data-[state=active]:ring-yellow-400/40 data-[state=active]:shadow font-medium" data-testid="tab-certificate">
                  <Award className="h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground group-data-[state=active]:text-yellow-400" />
                  <span className="hidden sm:inline">Certificate</span>
                </TabsTrigger>
                <TabsTrigger value="share" className="group relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-colors data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:ring-1 data-[state=active]:ring-purple-400/40 data-[state=active]:shadow font-medium" data-testid="tab-share">
                  <Share2 className="h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground group-data-[state=active]:text-purple-400" />
                  <span className="hidden sm:inline">Share</span>
                </TabsTrigger>
              </TabsList>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-3 sm:space-y-4">
                <Card className="bg-zinc-900/50 border-white/10">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Final Standings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6">
                    {sortedParticipants.map((p, idx) => {
                      const isParticipantBot = p.isBot === 1 || p.isBot === true;
                      const tierColor = p.tierInfo?.color || 'gray';
                      return (
                        <div
                          key={p.id}
                          className={`rounded-xl transition-all duration-200 hover:scale-[1.005] ${p.id === myParticipant?.id
                            ? 'bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30'
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                            }`}
                          data-testid={`result-${p.id}`}
                        >
                          {/* Mobile Layout */}
                          <div className="flex sm:hidden p-3">
                            <div className="flex items-start gap-2 w-full">
                              <div className="text-lg font-bold w-7 text-center shrink-0 pt-1">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              </div>
                              <div className={`h-9 w-9 rounded-full ${p.avatarColor || 'bg-primary'} flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0`}>
                                {p.username[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-sm truncate max-w-[120px]">{p.username}</span>
                                  {p.id === myParticipant?.id && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-0">
                                      You
                                    </Badge>
                                  )}
                                  {!isParticipantBot && p.tier && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 capitalize"
                                      style={{ borderColor: tierColor, color: tierColor }}
                                    >
                                      {p.tierInfo?.name || p.tier}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                                  {!isParticipantBot && p.rating !== null && p.rating !== undefined && (
                                    <span className="flex items-center gap-0.5">
                                      <Award className="h-2.5 w-2.5" />
                                      {p.rating}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-0.5">
                                    <Zap className="h-2.5 w-2.5" />
                                    {p.progress} chars
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <div className="text-lg font-bold text-primary">{p.wpm}</div>
                                <div className="text-[10px] text-muted-foreground">WPM • {p.accuracy}%</div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center gap-4 p-4">
                            <div className="text-2xl font-bold w-12 text-center shrink-0">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </div>
                            <div className={`h-12 w-12 rounded-full ${p.avatarColor || 'bg-primary'} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
                              {p.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold flex items-center gap-2 flex-wrap">
                                <span className="truncate">{p.username}</span>
                                {p.id === myParticipant?.id && (
                                  <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-0">
                                    You
                                  </Badge>
                                )}
                                {!isParticipantBot && p.tier && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 capitalize"
                                    style={{ borderColor: tierColor, color: tierColor }}
                                  >
                                    {p.tierInfo?.name || p.tier}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                {!isParticipantBot && p.rating !== null && p.rating !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {p.rating} Rating
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {p.progress} chars
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 min-w-[90px]">
                              <div className="text-2xl font-bold text-primary">{p.wpm}</div>
                              <div className="text-xs text-muted-foreground">WPM • {p.accuracy}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Your Performance Card */}
                  {myResult && lastResultSnapshot && (
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <User className="h-5 w-5 text-primary" />
                          Your Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-2xl sm:text-3xl font-bold text-primary">{lastResultSnapshot.wpm}</p>
                            <p className="text-xs text-muted-foreground">Words/Min</p>
                          </div>
                          <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-2xl sm:text-3xl font-bold text-green-400">{lastResultSnapshot.accuracy}%</p>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                          </div>
                          <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{lastResultSnapshot.characters}</p>
                            <p className="text-xs text-muted-foreground">Characters</p>
                          </div>
                          <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                            <p className="text-2xl sm:text-3xl font-bold text-red-400">{lastResultSnapshot.errors}</p>
                            <p className="text-xs text-muted-foreground">Errors</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-sm text-muted-foreground">Race Duration</span>
                          <span className="font-bold">{lastResultSnapshot.duration}s</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-sm text-muted-foreground">Consistency</span>
                          <span className="font-bold">{lastResultSnapshot.consistency}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Rating Card */}
                  <Card className="bg-zinc-900/50 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                        Rating & Ranking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user ? (
                        ratingInfo ? (
                          <RatingChangeDisplay ratingInfo={ratingInfo} position={myPosition} />
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading your rating...</span>
                          </div>
                        )
                      ) : (
                        <div className="text-center p-6">
                          <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">Sign in to track your competitive rating</p>
                          <Button variant="outline" className="mt-4" onClick={() => setLocation("/login")}>
                            Sign In
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Certificate Tab */}
              <TabsContent value="certificate" className="space-y-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                  <CardContent className="pt-6">
                    {!user && (
                      <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-yellow-400">
                              Sign in to get a verifiable certificate
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Your certificate cannot be verified without an account. Sign in to get an official, verifiable certificate with a unique verification ID.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                              onClick={() => setLocation("/login")}
                            >
                              Sign In for Verifiable Certificate
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {lastResultSnapshot ? (
                      <div className="overflow-x-auto -mx-2 sm:mx-0 px-2">
                        <RaceCertificate
                          wpm={lastResultSnapshot.wpm}
                          accuracy={lastResultSnapshot.accuracy}
                          consistency={lastResultSnapshot.consistency}
                          placement={lastResultSnapshot.placement}
                          totalParticipants={lastResultSnapshot.totalParticipants}
                          characters={lastResultSnapshot.characters}
                          errors={lastResultSnapshot.errors}
                          duration={lastResultSnapshot.duration}
                          username={user?.username}
                          raceId={race?.id?.toString()}
                          verificationId={certificateVerificationId || undefined}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <Award className="h-12 w-12 mx-auto mb-3" />
                        <p>Certificate data not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Share Tab */}
              <TabsContent value="share" className="space-y-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Share2 className="h-5 w-5 text-purple-400" />
                      Share Your Achievement
                    </CardTitle>
                    <CardDescription>
                      Let everyone know about your race performance!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Share Message Preview */}
                    {lastResultSnapshot && (
                      <div className="relative">
                        <div className="absolute -top-2 left-3 px-2 bg-background text-xs font-medium text-muted-foreground">
                          Share Message Preview
                        </div>
                        <div className="p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-purple-500/20 text-sm leading-relaxed">
                          <div className="space-y-2">
                            <p className="text-base font-medium">
                              🏁 <span className="text-purple-400 font-bold">RACE COMPLETE: #{lastResultSnapshot.placement} Place!</span>
                            </p>
                            <p className="text-muted-foreground">
                              ⚡ Speed: <span className="text-foreground font-semibold">{lastResultSnapshot.wpm} WPM</span>
                            </p>
                            <p className="text-muted-foreground">
                              ✨ Accuracy: <span className="text-foreground font-semibold">{lastResultSnapshot.accuracy}%</span>
                            </p>
                            <p className="text-muted-foreground">
                              🎖️ Result: <span className="text-foreground font-semibold">#{lastResultSnapshot.placement} of {lastResultSnapshot.totalParticipants}</span>
                            </p>
                            <p className="text-muted-foreground">
                              🏆 Level: <span className="text-purple-400 font-semibold">{getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy).title}</span>
                            </p>
                            <p className="text-primary/80 text-xs mt-3 font-medium">
                              Can you beat my race time? 🏎️
                            </p>
                            <p className="text-xs text-primary mt-2 font-medium">
                              🔗 https://typemasterai.com/multiplayer
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #TypeMasterAI #TypingRace #Multiplayer
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                            const text = `🏁 Just finished a multiplayer race!\n\n⚡ ${lastResultSnapshot.wpm} WPM with ${lastResultSnapshot.accuracy}% accuracy\n🏆 Placed #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants}\n🎖️ ${rating.title}\n\nCan you beat my time?\n\n🔗 https://typemasterai.com/multiplayer\n\n#TypeMasterAI #TypingRace`;
                            navigator.clipboard.writeText(text);
                            toast.success("Share message copied!", { description: "Paste into your social media post" });
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/50 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}

                    {/* Quick Share Buttons */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
                        Click to Share Instantly
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          className="gap-2 bg-[#1DA1F2]/10 border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20 text-[#1DA1F2]"
                          onClick={() => {
                            const text = `🏁 Just finished a multiplayer race!\n\n⚡ ${lastResultSnapshot?.wpm} WPM with ${lastResultSnapshot?.accuracy}% accuracy\n🏆 Placed #${lastResultSnapshot?.placement} of ${lastResultSnapshot?.totalParticipants}\n\nCan you beat my time?\n\n🔗 typemasterai.com/multiplayer`;
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <Twitter className="h-4 w-4" />
                          <span className="text-xs font-medium">X (Twitter)</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 bg-[#1877F2]/10 border-[#1877F2]/30 hover:bg-[#1877F2]/20 text-[#1877F2]"
                          onClick={() => {
                            const text = `🏁 I just finished a multiplayer typing race! Placed #${lastResultSnapshot?.placement} of ${lastResultSnapshot?.totalParticipants} with ${lastResultSnapshot?.wpm} WPM and ${lastResultSnapshot?.accuracy}% accuracy! 🏎️`;
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://typemasterai.com/multiplayer')}&quote=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <Facebook className="h-4 w-4" />
                          <span className="text-xs font-medium">Facebook</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 bg-[#0A66C2]/10 border-[#0A66C2]/30 hover:bg-[#0A66C2]/20 text-[#0A66C2]"
                          onClick={() => {
                            const text = `Just completed a multiplayer typing race! ${lastResultSnapshot?.wpm} WPM with ${lastResultSnapshot?.accuracy}% accuracy. #typing #productivity`;
                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://typemasterai.com/multiplayer')}&summary=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <Linkedin className="h-4 w-4" />
                          <span className="text-xs font-medium">LinkedIn</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366]"
                          onClick={() => {
                            const rating = getTypingPerformanceRating(lastResultSnapshot?.wpm || 0, lastResultSnapshot?.accuracy || 0);
                            const waText = `*TypeMasterAI Race Result*\n\nPlacement: *#${lastResultSnapshot?.placement} of ${lastResultSnapshot?.totalParticipants}*\nSpeed: *${lastResultSnapshot?.wpm} WPM*\nAccuracy: *${lastResultSnapshot?.accuracy}%*\nLevel: ${rating.title}\n\nJoin the race: https://typemasterai.com/multiplayer`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">WhatsApp</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 bg-[#0088cc]/10 border-[#0088cc]/30 hover:bg-[#0088cc]/20 text-[#0088cc]"
                          onClick={() => {
                            const rating = getTypingPerformanceRating(lastResultSnapshot?.wpm || 0, lastResultSnapshot?.accuracy || 0);
                            const text = `🏁 RACE COMPLETE!\n\n🏎️ #${lastResultSnapshot?.placement} of ${lastResultSnapshot?.totalParticipants}\n⚡ ${lastResultSnapshot?.wpm} WPM | ✨ ${lastResultSnapshot?.accuracy}%\n🎖️ ${rating.title}`;
                            window.open(`https://t.me/share/url?url=${encodeURIComponent('https://typemasterai.com/multiplayer')}&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <Send className="h-4 w-4" />
                          <span className="text-xs font-medium">Telegram</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/20 text-gray-400"
                          onClick={() => {
                            const rating = getTypingPerformanceRating(lastResultSnapshot?.wpm || 0, lastResultSnapshot?.accuracy || 0);
                            const subject = encodeURIComponent(`🏁 TypeMasterAI Race Result - #${lastResultSnapshot?.placement} Place!`);
                            const body = encodeURIComponent(`Hello!\n\nI earned a TypeMasterAI Race Certificate!\n\n🏎️ Placement: #${lastResultSnapshot?.placement} of ${lastResultSnapshot?.totalParticipants}\n⚡ Speed: ${lastResultSnapshot?.wpm} WPM\n✨ Accuracy: ${lastResultSnapshot?.accuracy}%\n🎖️ Level: ${rating.title}\n\n👉 Join: https://typemasterai.com/multiplayer`);
                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="text-xs font-medium">Email</span>
                        </Button>
                      </div>
                    </div>

                    {/* Copy Link */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
                        Permanent Link
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Input
                          readOnly
                          value="typemasterai.com/multiplayer"
                          className="bg-white/5 border-white/10 flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => {
                            navigator.clipboard.writeText('https://typemasterai.com/multiplayer');
                            toast.success('Link copied!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Share Certificate Button */}
                    <Button
                      onClick={() => setShareDialogOpen(true)}
                      className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Award className="h-4 w-4" />
                      Share Certificate Image
                    </Button>

                    {/* Sharing Tips */}
                    <div className="space-y-2">
                      <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-xs text-center text-muted-foreground">
                          📱 <span className="font-medium text-foreground">Mobile:</span> Use "Share Certificate Image" to attach the certificate directly!
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                        <p className="text-xs text-center text-muted-foreground">
                          💻 <span className="font-medium text-foreground">Desktop:</span> Copy the share message above, then paste into Twitter, LinkedIn, Discord, or any social media!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons Section */}
            <Card className="mt-4 sm:mt-6 bg-zinc-900/50 border-white/10">
              <CardContent className="p-3 sm:p-6">
                {/* Rematch Notification */}
                {rematchInfo && (
                  <div className="p-3 sm:p-4 mb-3 sm:mb-4 border border-green-500/30 rounded-xl bg-green-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium text-green-400 text-sm sm:text-base">New Race Ready!</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Room Code: {rematchInfo.roomCode}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        // Close current WebSocket before redirecting to prevent "session taken over"
                        if (ws && ws.readyState === WebSocket.OPEN) {
                          ws.close(1000, "Navigating to new race");
                        }
                        setLocation(`/race/${rematchInfo.newRaceId}?code=${rematchInfo.roomCode}`);
                      }}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      Join Now
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setLocation("/multiplayer")}
                        className="flex-1"
                        data-testid="button-back"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Back to Lobby
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Return to multiplayer lobby to find more races</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={async () => {
                          // Set loading state
                          setIsCreatingRematch(true);

                          try {
                            const response = await fetch("/api/races/quick-match", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                            });
                            if (response.ok) {
                              const data = await response.json();

                              // CRITICAL: Save participant to localStorage before redirect
                              // This ensures the race page can find the participant on load
                              if (data.participant) {
                                localStorage.setItem(`race_${data.race.id}_participant`, JSON.stringify(data.participant));
                                if (data.race?.roomCode) {
                                  localStorage.setItem(`race_${data.race.roomCode}_participant`, JSON.stringify(data.participant));
                                }
                                console.log(`[Play Again] Saved new participant ${data.participant.id} for race ${data.race.id}`);
                              }

                              // Clear old race participant from localStorage to avoid confusion
                              if (race?.id && race.id !== data.race.id) {
                                localStorage.removeItem(`race_${race.id}_participant`);
                              }

                              setRematchInfo({
                                newRaceId: data.race.id,
                                roomCode: data.race.roomCode,
                                createdBy: myParticipant?.username || "You",
                              });

                              // Close current WebSocket before redirecting to prevent "session taken over"
                              if (ws && ws.readyState === WebSocket.OPEN) {
                                ws.close(1000, "Navigating to new race");
                              }

                              // Auto-redirect to new race
                              setTimeout(() => {
                                setLocation(`/race/${data.race.id}`);
                              }, 300);
                            } else {
                              const errorData = await response.json().catch(() => ({}));
                              toast.error(errorData.message || "Failed to create race");
                              setIsCreatingRematch(false);
                            }
                          } catch (error) {
                            toast.error("Failed to create race. Please try again.");
                            setIsCreatingRematch(false);
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        data-testid="button-rematch"
                        disabled={isCreatingRematch || !!rematchInfo}
                      >
                        {isCreatingRematch ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Race...
                          </>
                        ) : rematchInfo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Play Again
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="font-medium">{rematchInfo ? "Rematch ready!" : "Start a new race"}</p>
                      <p className="text-zinc-400">
                        {rematchInfo
                          ? "Click 'Join Rematch' above to continue"
                          : "Create a new race with same settings"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Dialog with Race Certificate */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Race Result
              </DialogTitle>
              <DialogDescription>
                Share your multiplayer race achievement with others!
              </DialogDescription>
            </DialogHeader>

            {lastResultSnapshot && (
              <Tabs defaultValue="certificate" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="certificate" className="gap-2" data-testid="tab-race-certificate">
                        <Award className="w-4 h-4" />
                        Certificate
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Professional 1200×675 certificate with verification ID</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>

                <TabsContent value="certificate" className="space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 mb-2">
                      <Award className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold">Share Your Certificate</h3>
                    <p className="text-sm text-muted-foreground">
                      Show off your official Race Typing Certificate - #{lastResultSnapshot.placement} of {lastResultSnapshot.totalParticipants}!
                    </p>
                  </div>

                  {/* Certificate Stats Preview */}
                  <div className="p-4 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 rounded-xl border border-yellow-500/20">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Typing Speed</p>
                        <p className="text-2xl font-bold text-primary">{lastResultSnapshot.wpm} WPM</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-green-400">{lastResultSnapshot.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Placement</p>
                        <p className="text-sm font-bold text-yellow-400">#{lastResultSnapshot.placement} of {lastResultSnapshot.totalParticipants}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Performance</p>
                        <p className="text-sm font-bold">{getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy).badge}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hidden pre-rendered certificate for sharing */}
                  <div
                    className="absolute -z-50 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
                    aria-hidden="true"
                    data-testid="hidden-certificate-container"
                  >
                    <RaceCertificate
                      wpm={lastResultSnapshot.wpm}
                      accuracy={lastResultSnapshot.accuracy}
                      consistency={lastResultSnapshot.consistency}
                      placement={lastResultSnapshot.placement}
                      totalParticipants={lastResultSnapshot.totalParticipants}
                      characters={lastResultSnapshot.characters}
                      errors={lastResultSnapshot.errors}
                      duration={lastResultSnapshot.duration}
                      username={user?.username}
                      raceId={race?.id?.toString()}
                      verificationId={certificateVerificationId || undefined}
                      minimal={true}
                    />
                  </div>

                  {/* View & Share Certificate Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                    >
                      <Award className="w-5 h-5" />
                      View Certificate
                    </button>
                    <button
                      onClick={async () => {
                        const certCanvas = document.querySelector('[data-testid="hidden-certificate-container"] [data-testid="certificate-canvas"]') as HTMLCanvasElement;
                        if (!certCanvas) {
                          toast("Certificate not ready", { description: "Please try again." });
                          return;
                        }
                        try {
                          const blob = await new Promise<Blob>((resolve, reject) => {
                            certCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed")), "image/png");
                          });
                          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                          setCertificateImageCopied(true);
                          setTimeout(() => setCertificateImageCopied(false), 2000);
                          toast("Certificate Copied!", { description: "Paste directly into Twitter, Discord, or LinkedIn!" });
                        } catch {
                          toast("Copy Failed", { description: "Please download instead." });
                        }
                      }}
                      className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                    >
                      {certificateImageCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {certificateImageCopied ? "Copied!" : "Copy Image"}
                    </button>
                  </div>

                  {/* Share Certificate with Image Button */}
                  {'share' in navigator && (
                    <button
                      onClick={async () => {
                        const certCanvas = document.querySelector('[data-testid="hidden-certificate-container"] [data-testid="certificate-canvas"]') as HTMLCanvasElement;
                        if (!certCanvas) {
                          toast("Certificate not ready", { description: "Please try again." });
                          return;
                        }
                        setIsSharingCertificate(true);
                        try {
                          const blob = await new Promise<Blob>((resolve, reject) => {
                            certCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed")), "image/png");
                          });
                          const file = new File([blob], `TypeMasterAI_Race_Certificate_${lastResultSnapshot.wpm}WPM.png`, { type: "image/png" });
                          if (navigator.canShare?.({ files: [file] })) {
                            const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                            await navigator.share({
                              title: `TypeMasterAI Race Certificate - ${lastResultSnapshot.wpm} WPM`,
                              text: `🏆 I finished #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants} in a TypeMasterAI Race!\n\n⚡ ${lastResultSnapshot.wpm} WPM | ✨ ${lastResultSnapshot.accuracy}% Accuracy\n🎖️ ${rating.badge} Badge\n\n🔗 typemasterai.com/multiplayer`,
                              files: [file],
                            });
                            toast("Certificate Shared!", { description: "Your achievement is on its way!" });
                          }
                        } catch (error: any) {
                          if (error.name !== 'AbortError') {
                            toast("Share failed", { description: "Please try Copy Image instead." });
                          }
                        } finally {
                          setIsSharingCertificate(false);
                        }
                      }}
                      disabled={isSharingCertificate}
                      className="w-full py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-5 h-5" />
                      {isSharingCertificate ? "Preparing..." : "Share Certificate with Image"}
                    </button>
                  )}

                  {/* Certificate Share Message Preview */}
                  <div className="relative">
                    <div className="absolute -top-2 left-3 px-2 bg-background text-xs font-medium text-muted-foreground">
                      Certificate Share Message
                    </div>
                    <div className="p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-yellow-500/20 text-sm leading-relaxed">
                      <div className="space-y-2">
                        <p className="text-base font-medium">
                          🏆 <span className="text-yellow-400 font-bold">RACE CERTIFIED: #{lastResultSnapshot.placement} Place!</span>
                        </p>
                        <p className="text-muted-foreground">
                          ⚡ Speed: <span className="text-foreground font-semibold">{lastResultSnapshot.wpm} WPM</span>
                        </p>
                        <p className="text-muted-foreground">
                          ✨ Accuracy: <span className="text-foreground font-semibold">{lastResultSnapshot.accuracy}%</span>
                        </p>
                        <p className="text-muted-foreground">
                          🎖️ Result: <span className="text-foreground font-semibold">#{lastResultSnapshot.placement} of {lastResultSnapshot.totalParticipants}</span>
                        </p>
                        <p className="text-muted-foreground">
                          🏆 Level: <span className="text-yellow-400 font-semibold">{getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy).title}</span>
                        </p>
                        <p className="text-primary/80 text-xs mt-3 font-medium">
                          Official race certificate earned! 🏎️
                        </p>
                        <p className="text-xs text-primary mt-2 font-medium">
                          🔗 https://typemasterai.com/multiplayer
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                        const text = `🏆 Just earned my TypeMasterAI Race Certificate! #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants} 🏎️

⚡ ${lastResultSnapshot.wpm} WPM | ✨ ${lastResultSnapshot.accuracy}% Accuracy
🎖️ ${rating.title}

🔗 https://typemasterai.com/multiplayer

#TypeMasterAI #TypingRace`;
                        navigator.clipboard.writeText(text);
                        toast("Certificate Message Copied!", { description: "Paste into your social media post" });
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Certificate Social Share Buttons */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
                      Share Certificate On
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const text = encodeURIComponent(`🏆 Just earned my TypeMasterAI Race Certificate! #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants} with ${lastResultSnapshot.wpm} WPM! 🏎️

#TypeMasterAI #TypingRace`);
                          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent('https://typemasterai.com/multiplayer')}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/20 transition-all"
                      >
                        <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                        <span className="text-xs font-medium">X (Twitter)</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = encodeURIComponent(`🏆 I just earned my official TypeMasterAI Race Certificate!

Finished #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants} with ${lastResultSnapshot.wpm} WPM and ${lastResultSnapshot.accuracy}% accuracy! 🏎️`);
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://typemasterai.com/multiplayer')}&quote=${text}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/25 border border-[#1877F2]/20 transition-all"
                      >
                        <Facebook className="w-4 h-4 text-[#1877F2]" />
                        <span className="text-xs font-medium">Facebook</span>
                      </button>
                      <button
                        onClick={() => {
                          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://typemasterai.com/multiplayer')}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/20 transition-all"
                      >
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        <span className="text-xs font-medium">LinkedIn</span>
                      </button>
                      <button
                        onClick={() => {
                          const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                          const waText = `*TypeMasterAI Race Certificate*\n\nPlacement: *#${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants}*\nSpeed: *${lastResultSnapshot.wpm} WPM*\nAccuracy: *${lastResultSnapshot.accuracy}%*\nLevel: ${rating.title}\n\nJoin the race: https://typemasterai.com/multiplayer`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span className="text-xs font-medium">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                          const text = `🏆 RACE CERTIFIED!\n\n🏎️ #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants}\n⚡ ${lastResultSnapshot.wpm} WPM | ✨ ${lastResultSnapshot.accuracy}%\n🎖️ ${rating.title}`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent('https://typemasterai.com/multiplayer')}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/25 border border-[#0088cc]/20 transition-all"
                      >
                        <Send className="w-4 h-4 text-[#0088cc]" />
                        <span className="text-xs font-medium">Telegram</span>
                      </button>
                      <button
                        onClick={() => {
                          const rating = getTypingPerformanceRating(lastResultSnapshot.wpm, lastResultSnapshot.accuracy);
                          const subject = encodeURIComponent(`🏆 TypeMasterAI Race Certificate - #${lastResultSnapshot.placement} Place!`);
                          const body = encodeURIComponent(`Hello!\n\nI earned a TypeMasterAI Race Certificate!\n\n🏎️ Placement: #${lastResultSnapshot.placement} of ${lastResultSnapshot.totalParticipants}\n⚡ Speed: ${lastResultSnapshot.wpm} WPM\n✨ Accuracy: ${lastResultSnapshot.accuracy}%\n🎖️ Level: ${rating.title}\n\n👉 Join: https://typemasterai.com/multiplayer`);
                          window.open(`mailto:?subject=${subject}&body=${body}`);
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/25 border border-gray-500/20 transition-all"
                      >
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium">Email</span>
                      </button>
                    </div>
                  </div>

                  {/* Certificate Sharing Tips */}
                  <div className="space-y-2">
                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-center text-muted-foreground">
                        📱 <span className="font-medium text-foreground">Mobile:</span> Use "Share Certificate with Image" to attach the certificate directly!
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                      <p className="text-xs text-center text-muted-foreground">
                        💻 <span className="font-medium text-foreground">Desktop:</span> Use "Copy Image" then paste directly into Twitter, LinkedIn, Discord, or any social media!
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* View Certificate Dialog */}
                {showCertificate && user && lastResultSnapshot && (
                  <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-400" />
                          Your Race Certificate
                        </DialogTitle>
                      </DialogHeader>
                      <RaceCertificate
                        wpm={lastResultSnapshot.wpm}
                        accuracy={lastResultSnapshot.accuracy}
                        consistency={lastResultSnapshot.consistency}
                        placement={lastResultSnapshot.placement}
                        totalParticipants={lastResultSnapshot.totalParticipants}
                        characters={lastResultSnapshot.characters}
                        errors={lastResultSnapshot.errors}
                        duration={lastResultSnapshot.duration}
                        username={user?.username}
                        raceId={race?.id?.toString()}
                        verificationId={certificateVerificationId || undefined}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }

  return null;
}
