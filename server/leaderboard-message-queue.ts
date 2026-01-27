/**
 * Memory-Safe Message Queue for WebSocket
 * 
 * Bounded queue for WebSocket messages with backpressure handling.
 * Prevents memory exhaustion under high load by limiting queue sizes
 * and implementing intelligent message dropping.
 * 
 * Key features:
 * - Per-client message queue with configurable max size
 * - Priority for user's own updates
 * - Drop oldest on overflow
 * - Queue drain rate limiting
 * - Backpressure detection via bufferedAmount
 */

import { WebSocket } from 'ws';
import { getLeaderboardConfig } from '../shared/leaderboard-types';

// Configuration
const config = getLeaderboardConfig();

// Message priority levels
export enum MessagePriority {
  HIGH = 0,    // User's own rank changes
  MEDIUM = 1,  // Nearby rank changes
  LOW = 2,     // General updates
}

interface QueuedMessage {
  data: string;
  priority: MessagePriority;
  timestamp: number;
  userId?: string; // Target user for priority matching
}

interface ClientQueue {
  messages: QueuedMessage[];
  draining: boolean;
  drainTimer: NodeJS.Timeout | null;
  stats: {
    enqueued: number;
    sent: number;
    dropped: number;
    backpressureEvents: number;
  };
}

// Per-client queues
const clientQueues = new Map<string, ClientQueue>();

// Global stats
const globalStats = {
  totalEnqueued: 0,
  totalSent: 0,
  totalDropped: 0,
  currentQueueSize: 0,
  backpressureClients: 0,
  peakQueueSize: 0,
};

// Drain interval in ms
const DRAIN_INTERVAL_MS = 50;

// Maximum buffered amount before considering backpressure (16KB default)
const BACKPRESSURE_THRESHOLD = config.backpressureThresholdBytes;

/**
 * Initialize queue for a client
 */
export function initializeClientQueue(clientId: string): void {
  if (clientQueues.has(clientId)) {
    return;
  }

  clientQueues.set(clientId, {
    messages: [],
    draining: false,
    drainTimer: null,
    stats: {
      enqueued: 0,
      sent: 0,
      dropped: 0,
      backpressureEvents: 0,
    },
  });
}

/**
 * Clean up queue for a client
 */
export function cleanupClientQueue(clientId: string): void {
  const queue = clientQueues.get(clientId);
  if (!queue) return;

  if (queue.drainTimer) {
    clearInterval(queue.drainTimer);
  }

  globalStats.currentQueueSize -= queue.messages.length;
  clientQueues.delete(clientId);
}

/**
 * Enqueue a message for a client
 * Returns true if message was queued, false if dropped
 */
export function enqueueMessage(
  clientId: string,
  ws: WebSocket,
  data: string,
  priority: MessagePriority = MessagePriority.LOW,
  targetUserId?: string
): boolean {
  let queue = clientQueues.get(clientId);
  
  if (!queue) {
    initializeClientQueue(clientId);
    queue = clientQueues.get(clientId)!;
  }

  // Check if we can send immediately (no backpressure)
  if (
    queue.messages.length === 0 &&
    ws.readyState === WebSocket.OPEN &&
    ws.bufferedAmount < BACKPRESSURE_THRESHOLD
  ) {
    try {
      ws.send(data);
      queue.stats.sent++;
      globalStats.totalSent++;
      return true;
    } catch (error) {
      console.error('[MessageQueue] Send error:', error);
      // Fall through to queue
    }
  }

  // Check queue capacity
  if (queue.messages.length >= config.maxQueuePerClient) {
    // Queue full - need to drop something
    if (priority === MessagePriority.HIGH) {
      // High priority: drop oldest low priority message
      const lowPriorityIdx = queue.messages.findIndex(m => m.priority === MessagePriority.LOW);
      if (lowPriorityIdx >= 0) {
        queue.messages.splice(lowPriorityIdx, 1);
        queue.stats.dropped++;
        globalStats.totalDropped++;
        globalStats.currentQueueSize--;
      } else {
        // No low priority to drop, drop oldest medium
        const medPriorityIdx = queue.messages.findIndex(m => m.priority === MessagePriority.MEDIUM);
        if (medPriorityIdx >= 0) {
          queue.messages.splice(medPriorityIdx, 1);
          queue.stats.dropped++;
          globalStats.totalDropped++;
          globalStats.currentQueueSize--;
        } else {
          // All high priority - drop oldest
          queue.messages.shift();
          queue.stats.dropped++;
          globalStats.totalDropped++;
          globalStats.currentQueueSize--;
        }
      }
    } else {
      // Non-high priority: drop this message
      queue.stats.dropped++;
      globalStats.totalDropped++;
      return false;
    }
  }

  // Add to queue
  queue.messages.push({
    data,
    priority,
    timestamp: Date.now(),
    userId: targetUserId,
  });

  // Sort by priority (stable sort preserves order within priority)
  queue.messages.sort((a, b) => a.priority - b.priority);

  queue.stats.enqueued++;
  globalStats.totalEnqueued++;
  globalStats.currentQueueSize++;

  if (globalStats.currentQueueSize > globalStats.peakQueueSize) {
    globalStats.peakQueueSize = globalStats.currentQueueSize;
  }

  // Start draining if not already
  startDraining(clientId, ws);

  return true;
}

/**
 * Check if a client is experiencing backpressure
 */
export function hasBackpressure(ws: WebSocket): boolean {
  return ws.bufferedAmount > BACKPRESSURE_THRESHOLD;
}

/**
 * Get queue statistics for a client
 */
export function getClientQueueStats(clientId: string): {
  queueSize: number;
  enqueued: number;
  sent: number;
  dropped: number;
  backpressureEvents: number;
} | null {
  const queue = clientQueues.get(clientId);
  if (!queue) return null;

  return {
    queueSize: queue.messages.length,
    ...queue.stats,
  };
}

/**
 * Get global queue statistics
 */
export function getGlobalQueueStats(): typeof globalStats & {
  activeQueues: number;
  averageQueueSize: number;
} {
  const activeQueues = clientQueues.size;
  const averageQueueSize = activeQueues > 0 
    ? globalStats.currentQueueSize / activeQueues 
    : 0;

  return {
    ...globalStats,
    activeQueues,
    averageQueueSize: Math.round(averageQueueSize * 100) / 100,
  };
}

/**
 * Reset global statistics
 */
export function resetQueueStats(): void {
  globalStats.totalEnqueued = 0;
  globalStats.totalSent = 0;
  globalStats.totalDropped = 0;
  globalStats.peakQueueSize = globalStats.currentQueueSize;
  globalStats.backpressureClients = 0;

  for (const queue of clientQueues.values()) {
    queue.stats.enqueued = 0;
    queue.stats.sent = 0;
    queue.stats.dropped = 0;
    queue.stats.backpressureEvents = 0;
  }
}

/**
 * Send a message with backpressure awareness
 * Will queue if backpressure is detected
 */
export function sendWithBackpressure(
  clientId: string,
  ws: WebSocket,
  data: string,
  priority: MessagePriority = MessagePriority.LOW,
  targetUserId?: string
): boolean {
  // Check for backpressure
  if (hasBackpressure(ws)) {
    const queue = clientQueues.get(clientId);
    if (queue) {
      queue.stats.backpressureEvents++;
      globalStats.backpressureClients++;
    }
    
    // Queue the message
    return enqueueMessage(clientId, ws, data, priority, targetUserId);
  }

  // No backpressure - send directly
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(data);
      
      const queue = clientQueues.get(clientId);
      if (queue) {
        queue.stats.sent++;
      }
      globalStats.totalSent++;
      
      return true;
    } catch (error) {
      console.error('[MessageQueue] Send error:', error);
      // Fall back to queue
      return enqueueMessage(clientId, ws, data, priority, targetUserId);
    }
  }

  return false;
}

// --- Private helpers ---

function startDraining(clientId: string, ws: WebSocket): void {
  const queue = clientQueues.get(clientId);
  if (!queue || queue.draining) return;

  queue.draining = true;
  queue.drainTimer = setInterval(() => {
    drainQueue(clientId, ws);
  }, DRAIN_INTERVAL_MS);
}

function stopDraining(clientId: string): void {
  const queue = clientQueues.get(clientId);
  if (!queue) return;

  if (queue.drainTimer) {
    clearInterval(queue.drainTimer);
    queue.drainTimer = null;
  }
  queue.draining = false;
}

function drainQueue(clientId: string, ws: WebSocket): void {
  const queue = clientQueues.get(clientId);
  if (!queue) {
    stopDraining(clientId);
    return;
  }

  // Check if WebSocket is still open
  if (ws.readyState !== WebSocket.OPEN) {
    stopDraining(clientId);
    return;
  }

  // Check for backpressure
  if (hasBackpressure(ws)) {
    // Wait for buffer to drain
    return;
  }

  // Send up to N messages per drain cycle
  const maxPerDrain = 5;
  let sent = 0;

  while (queue.messages.length > 0 && sent < maxPerDrain && !hasBackpressure(ws)) {
    const message = queue.messages.shift()!;
    
    try {
      ws.send(message.data);
      queue.stats.sent++;
      globalStats.totalSent++;
      globalStats.currentQueueSize--;
      sent++;
    } catch (error) {
      console.error('[MessageQueue] Drain send error:', error);
      // Put message back at front
      queue.messages.unshift(message);
      break;
    }
  }

  // Stop draining if queue is empty
  if (queue.messages.length === 0) {
    stopDraining(clientId);
  }
}

/**
 * Cleanup all client queues (for shutdown)
 */
export function cleanupAllQueues(): void {
  for (const [clientId, queue] of clientQueues) {
    if (queue.drainTimer) {
      clearInterval(queue.drainTimer);
    }
  }
  clientQueues.clear();
  globalStats.currentQueueSize = 0;
}
