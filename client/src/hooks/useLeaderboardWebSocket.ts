/**
 * React Hook for Real-time Leaderboard Updates via WebSocket
 * 
 * Enhanced with graceful degradation:
 * - Falls back to HTTP polling when WebSocket fails
 * - Local state caching for offline resilience
 * - Connection quality indicator
 * - Exponential backoff for reconnection
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  oldRank?: number;
  wpm: number;
  accuracy: number;
  mode?: number;
  avatarColor?: string;
  isVerified?: boolean;
}

interface LeaderboardUpdate {
  type: 'leaderboard_update' | 'rank_change' | 'new_entry' | 'score_update';
  updateType?: 'rank_change' | 'new_entry' | 'score_update';
  mode: string;
  timeframe: string;
  language: string;
  entry: LeaderboardEntry;
  timestamp: number;
}

// Connection quality levels
type ConnectionQuality = 'excellent' | 'good' | 'degraded' | 'poor' | 'offline';

interface UseLeaderboardWebSocketOptions {
  mode?: string;
  timeframe?: 'all' | 'daily' | 'weekly' | 'monthly';
  language?: string;
  userId?: string;
  enabled?: boolean;
  enableHttpFallback?: boolean; // Enable HTTP polling fallback
  rateLimitCooldownMs?: number; // Cooldown after rate limit before retry
  httpPollingInterval?: number; // Polling interval in ms (default: 10000)
  onUpdate?: (update: LeaderboardUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseLeaderboardWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  lastUpdate: LeaderboardUpdate | null;
  updates: LeaderboardUpdate[];
  error: Event | null;
  reconnect: () => void;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed' | 'polling';
  connectionQuality: ConnectionQuality;
  isUsingFallback: boolean;
  latencyMs: number | null;
}

/**
 * Hook to connect to leaderboard WebSocket and receive real-time updates
 * With graceful degradation to HTTP polling when WebSocket is unavailable
 */
export function useLeaderboardWebSocket(
  options: UseLeaderboardWebSocketOptions = {}
): UseLeaderboardWebSocketReturn {
  const {
    mode = 'global',
    timeframe = 'all',
    language = 'en',
    userId,
    enabled = true,
    enableHttpFallback = false,
    rateLimitCooldownMs = 30000,
    httpPollingInterval = 10000,
    onUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed' | 'polling'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<LeaderboardUpdate | null>(null);
  const [updates, setUpdates] = useState<LeaderboardUpdate[]>([]);
  const [error, setError] = useState<Event | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('offline');
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const onUpdateRef = useRef<UseLeaderboardWebSocketOptions['onUpdate']>(onUpdate);
  const prevOnUpdateRef = useRef<UseLeaderboardWebSocketOptions['onUpdate']>(onUpdate);
  const onConnectRef = useRef<UseLeaderboardWebSocketOptions['onConnect']>(onConnect);
  const onDisconnectRef = useRef<UseLeaderboardWebSocketOptions['onDisconnect']>(onDisconnect);
  const onErrorRef = useRef<UseLeaderboardWebSocketOptions['onError']>(onError);
  const instanceIdRef = useRef(`lbws_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const manualCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const lastFetchedEntriesRef = useRef<Map<string, LeaderboardEntry>>(new Map());
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // Start with 1 second

  // HTTP polling fallback function
  const startHttpPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('[Leaderboard] Starting HTTP polling fallback');
    setIsUsingFallback(true);
    setIsReconnecting(false);
    setConnectionState('polling');
    setConnectionQuality('degraded');

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/leaderboard?mode=${mode}&timeframe=${timeframe}&language=${language}&limit=50`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const entries: LeaderboardEntry[] = data.entries || [];

        // Detect changes by comparing with previous fetch
        const previousEntries = lastFetchedEntriesRef.current;
        const newEntries = new Map<string, LeaderboardEntry>();

        for (const entry of entries) {
          newEntries.set(entry.userId, entry);
          const prev = previousEntries.get(entry.userId);

          // If entry changed, emit an update
          if (!prev || prev.rank !== entry.rank || prev.wpm !== entry.wpm) {
            const update: LeaderboardUpdate = {
              type: 'leaderboard_update',
              updateType: prev && prev.rank !== entry.rank ? 'rank_change' : 'score_update',
              mode,
              timeframe,
              language,
              entry: {
                ...entry,
                oldRank: prev?.rank,
              },
              timestamp: Date.now(),
            };

            setLastUpdate(update);
            setUpdates((prev) => [...prev.slice(-49), update]);
            onUpdateRef.current?.(update);
          }
        }

        lastFetchedEntriesRef.current = newEntries;
      } catch (err) {
        console.error('[Leaderboard] HTTP polling error:', err);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, httpPollingInterval);
  }, [mode, timeframe, language, httpPollingInterval]);

  const stopHttpPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsUsingFallback(false);
  }, []);

  // Calculate connection quality based on latency
  const updateConnectionQuality = useCallback((ms: number) => {
    setLatencyMs(ms);
    if (ms < 100) {
      setConnectionQuality('excellent');
    } else if (ms < 300) {
      setConnectionQuality('good');
    } else if (ms < 1000) {
      setConnectionQuality('degraded');
    } else {
      setConnectionQuality('poor');
    }
  }, []);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
    prevOnUpdateRef.current = onUpdate;
  }, [onUpdate, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Stop HTTP polling if running
    stopHttpPolling();

    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      manualCloseRef.current = false;
      setConnectionState(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');
      setConnectionQuality('offline');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}/ws/leaderboard?mode=${mode}&timeframe=${timeframe}&language=${language}${userId ? `&userId=${userId}` : ''}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Leaderboard WS] Connected');
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);
        setConnectionState('connected');
        setConnectionQuality('good');
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe with user ID if available
        if (userId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            userId,
            mode,
            timeframe,
            language,
          }));
        }

        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('[Leaderboard WS] Connection confirmed:', data.clientId);
            return;
          }

          if (data.type === 'pong') {
            // Calculate latency
            if (lastPingTimeRef.current > 0) {
              const latency = Date.now() - lastPingTimeRef.current;
              updateConnectionQuality(latency);
            }
            return;
          }

          if (data.type === 'leaderboard_update') {
            const update: LeaderboardUpdate = data;
            setLastUpdate(update);
            setUpdates((prev) => [...prev.slice(-49), update]); // Keep last 50 updates
            onUpdateRef.current?.(update);
          }
        } catch (err) {
          console.error('[Leaderboard WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Leaderboard WS] Error:', event);
        setError(event);
        setConnectionQuality('poor');
        onErrorRef.current?.(event);
      };

      ws.onclose = (event) => {
        console.log('[Leaderboard WS] Disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnectRef.current?.();

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (manualCloseRef.current) {
          manualCloseRef.current = false;
          setConnectionState('disconnected');
          setConnectionQuality('offline');
          return;
        }

        const closeCode = event?.code ?? 0;
        const closeReason = event?.reason || '';
        const isRateLimited = closeCode === 1008 || /rate limit/i.test(closeReason);

        if (isRateLimited) {
          setIsReconnecting(true);
          setConnectionState('reconnecting');
          setConnectionQuality('poor');
          reconnectAttemptsRef.current = 0;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, rateLimitCooldownMs);
          return;
        }

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setIsReconnecting(true);
          setReconnectAttempt(reconnectAttemptsRef.current);
          setConnectionState('reconnecting');
          
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`[Leaderboard WS] Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setIsReconnecting(true);
          console.log('[Leaderboard WS] Max reconnection attempts reached, cooling down');
          reconnectAttemptsRef.current = 0;
          setConnectionState('reconnecting');
          setConnectionQuality('poor');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, rateLimitCooldownMs);
        } else {
          setConnectionState('disconnected');
          setConnectionQuality('offline');
        }
      };

      // Send periodic pings to keep connection alive and measure latency
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingTimeRef.current = Date.now();
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Every 30 seconds
    } catch (err) {
      console.error('[Leaderboard WS] Connection failed:', err);
      
      // Fall back to HTTP polling on immediate failure
      if (enableHttpFallback && reconnectAttemptsRef.current >= maxReconnectAttempts) {
        startHttpPolling();
      }
    }
  }, [enabled, mode, timeframe, language, userId, enableHttpFallback, rateLimitCooldownMs, startHttpPolling, stopHttpPolling, updateConnectionQuality]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHttpPolling();

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      manualCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionQuality('offline');
  }, [stopHttpPolling]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        // Check if connection is dead and reconnect
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reconnectAttemptsRef.current = 0;
          connect();
        }
      }
    };

    const handleOnline = () => {
      if (enabled && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, connect]);

  // Resubscribe when parameters change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        userId,
        mode,
        timeframe,
        language,
      }));
    }
    
    // Also clear last fetched entries for HTTP polling
    lastFetchedEntriesRef.current = new Map();
  }, [mode, timeframe, language, userId]);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    maxReconnectAttempts,
    lastUpdate,
    updates,
    error,
    reconnect,
    connectionState,
    connectionQuality,
    isUsingFallback,
    latencyMs,
  };
}

/**
 * Hook to get real-time rank updates for the current user
 */
export function useUserRankUpdates(
  userId: string | undefined,
  mode: string = 'global',
  timeframe: 'all' | 'daily' | 'weekly' | 'monthly' = 'all',
  language: string = 'en'
): {
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
  lastUpdate: Date | null;
} {
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useLeaderboardWebSocket({
    mode,
    timeframe,
    language,
    userId,
    enabled: !!userId,
    onUpdate: (update) => {
      if (update.entry.userId === userId) {
        setPreviousRank(currentRank);
        setCurrentRank(update.entry.rank);
        setLastUpdate(new Date(update.timestamp));
      }
    },
  });

  const rankChange = currentRank !== null && previousRank !== null
    ? previousRank - currentRank // Positive = moved up, negative = moved down
    : 0;

  return {
    currentRank,
    previousRank,
    rankChange,
    lastUpdate,
  };
}

