/**
 * Tiered Update Dispatcher
 * 
 * Implements tiered delivery of leaderboard updates based on client classification:
 * - Active (1-2s): Real-time delta updates for users who recently submitted scores
 * - Passive (5-10s): Batched updates for authenticated viewers
 * - Observer (30s+): Minimal updates for anonymous/idle connections
 * 
 * Key features:
 * - Reduces bandwidth by delivering fewer updates to inactive clients
 * - Prioritizes real-time experience for engaged users
 * - Accumulates updates for delayed delivery to passive/observer tiers
 */

import { 
  ClientTier, 
  LeaderboardDelta, 
  LeaderboardMode, 
  LeaderboardTimeframe,
  getLeaderboardConfig 
} from '../shared/leaderboard-types';
import { 
  getAllLocalConnections, 
  getActiveUserIds 
} from './leaderboard-connection-registry';
import { leaderboardWS, LeaderboardUpdate } from './leaderboard-websocket';

// Configuration
const config = getLeaderboardConfig();

// Pending updates accumulated for delayed delivery
interface PendingUpdates {
  passive: Map<string, LeaderboardDelta[]>;  // key: mode:timeframe:language
  observer: Map<string, LeaderboardDelta[]>;
}

const pendingUpdates: PendingUpdates = {
  passive: new Map(),
  observer: new Map(),
};

// Timers for batch delivery
let passiveFlushTimer: NodeJS.Timeout | null = null;
let observerFlushTimer: NodeJS.Timeout | null = null;

// Stats
const stats = {
  activeDeliveries: 0,
  passiveDeliveries: 0,
  observerDeliveries: 0,
  droppedUpdates: 0,
};

const MAX_PENDING_KEYS = parseInt(process.env.LEADERBOARD_MAX_PENDING_KEYS || '500', 10);
// Track last update time per client for tier demotion
const clientLastActivity: Map<string, number> = new Map();

/**
 * Initialize the tiered dispatcher
 */
export function initializeDispatcher(): void {
  // Start passive tier flush timer
  if (!passiveFlushTimer) {
    passiveFlushTimer = setInterval(() => {
      flushPassiveUpdates();
    }, config.tierPassiveIntervalMs);
  }

  // Start observer tier flush timer
  if (!observerFlushTimer) {
    observerFlushTimer = setInterval(() => {
      flushObserverUpdates();
    }, config.tierObserverIntervalMs);
  }

  console.log('[Dispatcher] Tiered update dispatcher initialized');
  console.log(`  Active interval: ${config.tierActiveIntervalMs}ms`);
  console.log(`  Passive interval: ${config.tierPassiveIntervalMs}ms`);
  console.log(`  Observer interval: ${config.tierObserverIntervalMs}ms`);
}

/**
 * Dispatch a delta update to all tiers appropriately
 */
export async function dispatchDelta(delta: LeaderboardDelta): Promise<void> {
  const { mode, timeframe, language } = delta;
  const subscriptionKey = `${mode}:${timeframe}:${language}`;

  // Get active user IDs for tier classification
  const activeUserIds = new Set(await getActiveUserIds());

  // Get all local connections
  const connections = getAllLocalConnections();
  
  for (const [clientId, ws] of connections) {
    // Get client metadata (stored in ws or tracked separately)
    const clientData = getClientData(clientId);
    if (!clientData) continue;

    // Check if this client is subscribed to this update
    if (!isSubscribed(clientData, mode, timeframe, language)) continue;

    // Determine tier
    const tier = classifyClient(clientData, activeUserIds);

    // Dispatch based on tier
    switch (tier) {
      case 'active':
        // Immediate delivery
        deliverImmediately(clientId, delta);
        stats.activeDeliveries++;
        break;

      case 'passive':
        // Accumulate for batched delivery
        accumulateUpdate(pendingUpdates.passive, subscriptionKey, delta);
        break;

      case 'observer':
        // Accumulate for infrequent delivery
        accumulateUpdate(pendingUpdates.observer, subscriptionKey, delta);
        break;
    }
  }
}

/**
 * Dispatch a full update (for legacy compatibility)
 */
export async function dispatchUpdate(update: LeaderboardUpdate): Promise<void> {
  // Convert to delta format
  const delta: LeaderboardDelta = {
    version: Date.now(),
    mode: update.mode as LeaderboardMode,
    timeframe: update.timeframe as LeaderboardTimeframe,
    language: update.language,
    changes: [
      {
        userId: update.entry.userId,
        username: update.entry.username,
        oldRank: update.entry.oldRank ?? null,
        newRank: update.entry.rank,
        wpm: update.entry.wpm,
        accuracy: update.entry.accuracy,
        avatarColor: update.entry.avatarColor,
        isVerified: update.entry.isVerified,
        changeType: update.entry.oldRank ? 'improved' : 'new',
      },
    ],
    removed: [],
    topN: 100,
    timestamp: Date.now(),
  };

  await dispatchDelta(delta);
}

/**
 * Record client activity (called on score submission)
 */
export function recordClientActivity(userId: string): void {
  clientLastActivity.set(userId, Date.now());
}

/**
 * Get dispatcher stats
 */
export function getDispatcherStats(): {
  activeDeliveries: number;
  passiveDeliveries: number;
  observerDeliveries: number;
  droppedUpdates: number;
  pendingPassive: number;
  pendingObserver: number;
} {
  let pendingPassive = 0;
  let pendingObserver = 0;

  for (const deltas of pendingUpdates.passive.values()) {
    pendingPassive += deltas.length;
  }
  for (const deltas of pendingUpdates.observer.values()) {
    pendingObserver += deltas.length;
  }

  return {
    ...stats,
    pendingPassive,
    pendingObserver,
  };
}

/**
 * Shutdown the dispatcher
 */
export function shutdownDispatcher(): void {
  if (passiveFlushTimer) {
    clearInterval(passiveFlushTimer);
    passiveFlushTimer = null;
  }
  if (observerFlushTimer) {
    clearInterval(observerFlushTimer);
    observerFlushTimer = null;
  }

  // Flush any remaining updates
  flushPassiveUpdates();
  flushObserverUpdates();

  console.log('[Dispatcher] Shutdown complete');
}

// --- Private helpers ---

interface ClientData {
  userId?: string;
  mode: LeaderboardMode;
  timeframe: LeaderboardTimeframe;
  language: string;
  tier: ClientTier;
}

// Simple in-memory tracking (in production, this would be in the connection registry)
const clientDataMap = new Map<string, ClientData>();

function getClientData(clientId: string): ClientData | null {
  return clientDataMap.get(clientId) || null;
}

export function registerClientData(clientId: string, data: ClientData): void {
  clientDataMap.set(clientId, data);
}

export function unregisterClientData(clientId: string): void {
  clientDataMap.delete(clientId);
}

function classifyClient(clientData: ClientData, activeUserIds: Set<string>): ClientTier {
  const { userId, tier: currentTier } = clientData;

  // No userId means anonymous - always observer
  if (!userId) {
    return 'observer';
  }

  // Check if user has recent activity
  if (activeUserIds.has(userId)) {
    return 'active';
  }

  // Check last activity time
  const lastActivity = clientLastActivity.get(userId);
  if (lastActivity) {
    const timeSinceActivity = Date.now() - lastActivity;
    
    // Active if activity within 5 minutes
    if (timeSinceActivity < 5 * 60 * 1000) {
      return 'active';
    }
    
    // Passive if activity within 30 minutes
    if (timeSinceActivity < 30 * 60 * 1000) {
      return 'passive';
    }
  }

  // Fall back to stored tier or observer
  return currentTier === 'active' ? 'passive' : (currentTier || 'observer');
}

function isSubscribed(
  clientData: ClientData, 
  mode: LeaderboardMode, 
  timeframe: LeaderboardTimeframe, 
  language: string
): boolean {
  if (clientData.mode !== mode) return false;
  if (clientData.language !== language) return false;
  
  // Timeframe matching: 'all' matches everything
  if (clientData.timeframe === 'all' || timeframe === 'all') return true;
  return clientData.timeframe === timeframe;
}

function accumulateUpdate(
  storage: Map<string, LeaderboardDelta[]>,
  key: string,
  delta: LeaderboardDelta
): void {
  if (!storage.has(key) && storage.size >= MAX_PENDING_KEYS) {
    const oldestKey = storage.keys().next().value;
    if (oldestKey) {
      storage.delete(oldestKey);
      stats.droppedUpdates++;
    }
  }
  if (!storage.has(key)) {
    storage.set(key, []);
  }

  const deltas = storage.get(key)!;
  
  // Limit accumulated updates to prevent memory growth
  const maxAccumulated = 50;
  if (deltas.length >= maxAccumulated) {
    deltas.shift(); // Remove oldest
    stats.droppedUpdates++;
  }

  deltas.push(delta);
}

function deliverImmediately(clientId: string, delta: LeaderboardDelta): void {
  // Convert delta to update format for WebSocket delivery
  const update: LeaderboardUpdate = {
    type: 'leaderboard_update',
    updateType: 'score_update',
    mode: delta.mode,
    timeframe: delta.timeframe,
    language: delta.language,
    entry: delta.changes[0] ? {
      userId: delta.changes[0].userId,
      username: delta.changes[0].username,
      rank: delta.changes[0].newRank,
      oldRank: delta.changes[0].oldRank ?? undefined,
      wpm: delta.changes[0].wpm,
      accuracy: delta.changes[0].accuracy,
      avatarColor: delta.changes[0].avatarColor ?? undefined,
      isVerified: delta.changes[0].isVerified,
    } : {
      userId: '',
      username: '',
      rank: 0,
      wpm: 0,
      accuracy: 0,
    },
  };

  // Use existing WebSocket broadcast for individual delivery
  leaderboardWS.broadcastUpdate(update);
}

function flushPassiveUpdates(): void {
  for (const [key, deltas] of pendingUpdates.passive) {
    if (deltas.length === 0) continue;

    // Merge deltas into a single update
    const mergedDelta = mergeDeltas(deltas);
    
    // Broadcast to passive clients
    broadcastToTier('passive', mergedDelta);
    
    stats.passiveDeliveries++;
  }

  pendingUpdates.passive.clear();
}

function flushObserverUpdates(): void {
  for (const [key, deltas] of pendingUpdates.observer) {
    if (deltas.length === 0) continue;

    // Merge deltas into a single update
    const mergedDelta = mergeDeltas(deltas);
    
    // Broadcast to observer clients
    broadcastToTier('observer', mergedDelta);
    
    stats.observerDeliveries++;
  }

  pendingUpdates.observer.clear();
}

function mergeDeltas(deltas: LeaderboardDelta[]): LeaderboardDelta {
  if (deltas.length === 0) {
    throw new Error('Cannot merge empty deltas');
  }

  if (deltas.length === 1) {
    return deltas[0];
  }

  // Keep only the latest state for each user
  const userChanges = new Map<string, typeof deltas[0]['changes'][0]>();
  const removedUsers = new Set<string>();

  for (const delta of deltas) {
    for (const change of delta.changes) {
      userChanges.set(change.userId, change);
    }
    for (const userId of delta.removed) {
      removedUsers.add(userId);
    }
  }

  // Remove users that were both changed and removed (removed wins)
  for (const userId of removedUsers) {
    userChanges.delete(userId);
  }

  const last = deltas[deltas.length - 1];
  return {
    version: last.version,
    mode: last.mode,
    timeframe: last.timeframe,
    language: last.language,
    changes: Array.from(userChanges.values()),
    removed: Array.from(removedUsers),
    topN: last.topN,
    timestamp: Date.now(),
    batchId: `merged-${Date.now()}`,
  };
}

function broadcastToTier(tier: ClientTier, delta: LeaderboardDelta): void {
  // Convert to update format
  for (const change of delta.changes) {
    const update: LeaderboardUpdate = {
      type: 'leaderboard_update',
      updateType: 'score_update',
      mode: delta.mode,
      timeframe: delta.timeframe,
      language: delta.language,
      entry: {
        userId: change.userId,
        username: change.username,
        rank: change.newRank,
        oldRank: change.oldRank ?? undefined,
        wpm: change.wpm,
        accuracy: change.accuracy,
        avatarColor: change.avatarColor ?? undefined,
        isVerified: change.isVerified,
      },
    };

    // The WebSocket service will handle the actual delivery
    // We just need to broadcast; tier filtering happens on the client side
    // or through the subscription index
    leaderboardWS.broadcastUpdate(update);
  }
}
