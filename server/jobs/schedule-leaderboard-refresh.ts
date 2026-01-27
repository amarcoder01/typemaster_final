/**
 * Scheduler for Leaderboard Cache Refresh Job
 * Automatically refreshes materialized views at configurable intervals
 * 
 * Enhanced for scale architecture:
 * - Targeted refresh by timeframe
 * - Refresh coalescing (skip if refresh in progress)
 * - Priority queue for timeframe refreshes
 * 
 * Environment Variables:
 * - LEADERBOARD_REFRESH_INTERVAL_MS: Refresh interval in ms (default: 30000 = 30 seconds)
 * - LEADERBOARD_REFRESH_ENABLED: Enable/disable auto-refresh (default: true)
 * - LEADERBOARD_EVENT_DEBOUNCE_MS: Debounce for event-driven refresh (default: 500ms)
 */

import { refreshLeaderboardViews, refreshSpecificView, checkMaterializedViewsExist } from './refresh-leaderboard-cache.js';
import { LeaderboardTimeframe } from '../../shared/leaderboard-types';

let refreshInterval: NodeJS.Timeout | null = null;
let pendingRefresh: NodeJS.Timeout | null = null;

// Track in-progress refreshes to prevent overlap
const refreshInProgress: Set<string> = new Set();
const pendingRefreshes: Map<string, NodeJS.Timeout> = new Map();

// Configurable refresh interval - default 30 seconds for better performance
const REFRESH_INTERVAL_MS = parseInt(process.env.LEADERBOARD_REFRESH_INTERVAL_MS || '30000', 10);
const REFRESH_ENABLED = process.env.LEADERBOARD_REFRESH_ENABLED !== 'false';

// Debounce time for event-driven refreshes to batch rapid updates
const EVENT_REFRESH_DEBOUNCE_MS = parseInt(process.env.LEADERBOARD_EVENT_DEBOUNCE_MS || '500', 10);

// Priority order for timeframe refreshes (daily changes most frequently)
const TIMEFRAME_PRIORITY: LeaderboardTimeframe[] = ['daily', 'weekly', 'monthly', 'all'];

// Map LeaderboardTimeframe to view names
const TIMEFRAME_TO_VIEW: Record<LeaderboardTimeframe, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  all: 'global',
};

/**
 * Start the leaderboard cache refresh scheduler
 */
export async function startLeaderboardRefreshScheduler(): Promise<void> {
  if (!REFRESH_ENABLED) {
    console.log('[Leaderboard Scheduler] Auto-refresh disabled via environment variable');
    return;
  }

  // Check if materialized views exist before starting
  const viewsExist = await checkMaterializedViewsExist();
  
  if (!viewsExist) {
    console.warn('[Leaderboard Scheduler] Materialized views not found. Please run migration 003_create_leaderboard_materialized_views.sql');
    console.warn('[Leaderboard Scheduler] Scheduler will not start until views are created.');
    return;
  }

  // Stop existing job if running
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Schedule refresh at configurable interval
  refreshInterval = setInterval(async () => {
    try {
      await refreshLeaderboardViews();
    } catch (error: any) {
      // Suppress quota exceeded errors to avoid log spam
      if (!error?.message?.includes('compute time quota')) {
        console.error('[Leaderboard Scheduler] Failed to refresh views:', error);
      }
    }
  }, REFRESH_INTERVAL_MS);

  const intervalSeconds = Math.round(REFRESH_INTERVAL_MS / 1000);
  console.log(`[Leaderboard Scheduler] Started - refreshing materialized views every ${intervalSeconds} seconds`);

  // Run initial refresh
  try {
    await refreshLeaderboardViews();
  } catch (error: any) {
    // Suppress quota exceeded errors to avoid log spam
    if (!error?.message?.includes('compute time quota')) {
      console.error('[Leaderboard Scheduler] Initial refresh failed:', error);
    }
  }
}

/**
 * Trigger an immediate refresh of materialized views (event-driven)
 * Uses debouncing to batch rapid updates and avoid overloading the database
 */
export function triggerImmediateRefresh(timeframe?: 'global' | 'daily' | 'weekly' | 'monthly'): void {
  // Clear any pending refresh to debounce
  if (pendingRefresh) {
    clearTimeout(pendingRefresh);
  }

  // Schedule refresh with debounce
  pendingRefresh = setTimeout(async () => {
    try {
      if (timeframe) {
        await refreshSpecificView(timeframe);
      } else {
        await refreshLeaderboardViews();
      }
    } catch (error: any) {
      // Suppress quota exceeded errors
      if (!error?.message?.includes('compute time quota')) {
        console.error('[Leaderboard Scheduler] Event-driven refresh failed:', error);
      }
    }
    pendingRefresh = null;
  }, EVENT_REFRESH_DEBOUNCE_MS);
}

/**
 * Trigger a targeted refresh for a specific timeframe
 * Uses coalescing to prevent overlapping refreshes
 * 
 * @param timeframe - The timeframe to refresh (daily, weekly, monthly, all)
 */
export async function triggerTargetedRefresh(timeframe: LeaderboardTimeframe): Promise<void> {
  const viewName = TIMEFRAME_TO_VIEW[timeframe];
  const refreshKey = `view:${viewName}`;
  
  // Check if refresh is already in progress
  if (refreshInProgress.has(refreshKey)) {
    console.log(`[Leaderboard Scheduler] Refresh for ${viewName} already in progress, skipping`);
    return;
  }
  
  // Check if there's a pending debounced refresh
  const pending = pendingRefreshes.get(refreshKey);
  if (pending) {
    clearTimeout(pending);
  }
  
  // Schedule with debounce
  const timer = setTimeout(async () => {
    pendingRefreshes.delete(refreshKey);
    
    // Mark as in progress
    refreshInProgress.add(refreshKey);
    
    try {
      await refreshSpecificView(viewName as any);
      console.log(`[Leaderboard Scheduler] Targeted refresh completed for ${viewName}`);
    } catch (error: any) {
      if (!error?.message?.includes('compute time quota')) {
        console.error(`[Leaderboard Scheduler] Targeted refresh failed for ${viewName}:`, error);
      }
    } finally {
      refreshInProgress.delete(refreshKey);
    }
  }, EVENT_REFRESH_DEBOUNCE_MS);
  
  pendingRefreshes.set(refreshKey, timer);
}

/**
 * Trigger refresh for all affected timeframes in priority order
 * Used by batch processor to refresh after processing events
 * 
 * @param timeframes - Array of timeframes to refresh
 */
export async function triggerPrioritizedRefresh(timeframes: LeaderboardTimeframe[]): Promise<void> {
  // Sort by priority
  const sorted = timeframes.sort((a, b) => 
    TIMEFRAME_PRIORITY.indexOf(a) - TIMEFRAME_PRIORITY.indexOf(b)
  );
  
  // Trigger refreshes sequentially to avoid overwhelming the database
  for (const timeframe of sorted) {
    await triggerTargetedRefresh(timeframe);
  }
}

/**
 * Check if a refresh is currently in progress for a timeframe
 */
export function isRefreshInProgress(timeframe?: LeaderboardTimeframe): boolean {
  if (timeframe) {
    const viewName = TIMEFRAME_TO_VIEW[timeframe];
    return refreshInProgress.has(`view:${viewName}`);
  }
  return refreshInProgress.size > 0;
}

/**
 * Stop the leaderboard cache refresh scheduler
 */
export function stopLeaderboardRefreshScheduler(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('[Leaderboard Scheduler] Stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  intervalMs: number;
  enabled: boolean;
  debounceMs: number;
  refreshesInProgress: string[];
  pendingRefreshCount: number;
} {
  return {
    running: refreshInterval !== null,
    intervalMs: REFRESH_INTERVAL_MS,
    enabled: REFRESH_ENABLED,
    debounceMs: EVENT_REFRESH_DEBOUNCE_MS,
    refreshesInProgress: Array.from(refreshInProgress),
    pendingRefreshCount: pendingRefreshes.size,
  };
}

