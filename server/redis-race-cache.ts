import type { Race, RaceParticipant } from "@shared/schema";
import { redisClient, redisPub, redisSub, REDIS_KEYS, REDIS_TTL, REDIS_ENABLED, SERVER_ID } from './redis-client';

/**
 * Distributed Race Cache using Redis
 * 
 * Provides Redis-backed storage for race state that can be shared across
 * multiple server instances. Falls back to in-memory storage if Redis is disabled.
 */

interface CachedRace {
  race: Race;
  participants: RaceParticipant[];
  updatedAt: number;
  accessedAt: number;
  version: number;
}

interface ParticipantProgress {
  progress: number;
  wpm: number;
  accuracy: number;
  errors: number;
  lastUpdate: number;
  dirty: boolean;
  version: number;
  flushInProgress: boolean;
}

interface RedisCacheStats {
  hits: number;
  misses: number;
  redisErrors: number;
  fallbackHits: number;
}

// In-memory fallback cache
const fallbackCache: Map<number, CachedRace> = new Map();
const fallbackProgress: Map<number, ParticipantProgress> = new Map();
const fallbackParticipantToRace: Map<number, number> = new Map();

// Stats tracking
const stats: RedisCacheStats = {
  hits: 0,
  misses: 0,
  redisErrors: 0,
  fallbackHits: 0,
};

/**
 * Set race data in distributed cache
 */
export async function setRaceDistributed(race: Race, participants: RaceParticipant[] = []): Promise<void> {
  const now = Date.now();
  const cacheData: CachedRace = {
    race,
    participants,
    updatedAt: now,
    accessedAt: now,
    version: 1,
  };

  if (!REDIS_ENABLED) {
    fallbackCache.set(race.id, cacheData);
    for (const p of participants) {
      fallbackParticipantToRace.set(p.id, race.id);
    }
    return;
  }

  try {
    const multi = redisClient.multi();
    
    // Store race data as hash
    multi.hset(REDIS_KEYS.race(race.id), {
      race: JSON.stringify(race),
      updatedAt: now.toString(),
      accessedAt: now.toString(),
      version: '1',
    });
    
    // Store participants as separate hash for efficient updates
    if (participants.length > 0) {
      const participantData: Record<string, string> = {};
      for (const p of participants) {
        participantData[p.id.toString()] = JSON.stringify(p);
        // Set participant-to-race mapping
        multi.set(REDIS_KEYS.participantRace(p.id), race.id.toString(), 'EX', REDIS_TTL.race);
      }
      multi.hset(REDIS_KEYS.raceParticipants(race.id), participantData);
    }
    
    // Set TTL on race data
    multi.expire(REDIS_KEYS.race(race.id), REDIS_TTL.race);
    multi.expire(REDIS_KEYS.raceParticipants(race.id), REDIS_TTL.race);
    
    await multi.exec();
    // Note: This is a write operation, not a hit (hits are for reads)
  } catch (error) {
    console.error('[RedisRaceCache] setRace error:', error);
    stats.redisErrors++;
    // Fallback to in-memory
    fallbackCache.set(race.id, cacheData);
    for (const p of participants) {
      fallbackParticipantToRace.set(p.id, race.id);
    }
    stats.fallbackHits++;
  }
}

/**
 * Get race data from distributed cache
 */
export async function getRaceDistributed(raceId: number): Promise<CachedRace | undefined> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) stats.fallbackHits++;
    return entry;
  }

  try {
    const multi = redisClient.multi();
    multi.hgetall(REDIS_KEYS.race(raceId));
    multi.hgetall(REDIS_KEYS.raceParticipants(raceId));
    
    const results = await multi.exec();
    if (!results || results.length < 2) {
      stats.misses++;
      return undefined;
    }
    
    const [raceResult, participantsResult] = results;
    const raceData = raceResult?.[1] as Record<string, string> | null;
    const participantsData = participantsResult?.[1] as Record<string, string> | null;
    
    if (!raceData || !raceData.race) {
      stats.misses++;
      return undefined;
    }
    
    const race = JSON.parse(raceData.race) as Race;
    const participants: RaceParticipant[] = [];
    
    if (participantsData) {
      for (const [, value] of Object.entries(participantsData)) {
        if (value) {
          participants.push(JSON.parse(value) as RaceParticipant);
        }
      }
    }
    
    // Update access time
    await redisClient.hset(REDIS_KEYS.race(raceId), 'accessedAt', Date.now().toString());
    
    stats.hits++;
    return {
      race,
      participants,
      updatedAt: parseInt(raceData.updatedAt || '0', 10),
      accessedAt: Date.now(),
      version: parseInt(raceData.version || '1', 10),
    };
  } catch (error) {
    console.error('[RedisRaceCache] getRace error:', error);
    stats.redisErrors++;
    // Fallback to in-memory
    const entry = fallbackCache.get(raceId);
    if (entry) stats.fallbackHits++;
    return entry;
  }
}

/**
 * Update race status in distributed cache
 */
export async function updateRaceStatusDistributed(
  raceId: number,
  status: string,
  startedAt?: Date,
  finishedAt?: Date
): Promise<void> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) {
      entry.race.status = status;
      if (startedAt) entry.race.startedAt = startedAt;
      if (finishedAt) entry.race.finishedAt = finishedAt;
      entry.updatedAt = Date.now();
      entry.version++;
    }
    return;
  }

  try {
    const script = `
      local key = KEYS[1]
      local raceData = redis.call('HGET', key, 'race')
      if not raceData then
        return 0
      end
      local race = cjson.decode(raceData)
      race.status = ARGV[1]
      if ARGV[2] ~= '' then race.startedAt = ARGV[2] end
      if ARGV[3] ~= '' then race.finishedAt = ARGV[3] end
      redis.call('HSET', key, 'race', cjson.encode(race), 'updatedAt', ARGV[4])
      redis.call('HINCRBY', key, 'version', 1)
      return 1
    `;
    await redisClient.eval(
      script,
      1,
      REDIS_KEYS.race(raceId),
      status,
      startedAt ? startedAt.toISOString() : '',
      finishedAt ? finishedAt.toISOString() : '',
      Date.now().toString()
    );
  } catch (error) {
    console.error('[RedisRaceCache] updateRaceStatus error:', error);
    stats.redisErrors++;
    // Fallback
    const entry = fallbackCache.get(raceId);
    if (entry) {
      entry.race.status = status;
      if (startedAt) entry.race.startedAt = startedAt;
      if (finishedAt) entry.race.finishedAt = finishedAt;
      entry.updatedAt = Date.now();
      entry.version++;
    }
  }
}

/**
 * Add participant to distributed cache
 */
export async function addParticipantDistributed(raceId: number, participant: RaceParticipant): Promise<void> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) {
      const existingIdx = entry.participants.findIndex(p => p.id === participant.id);
      if (existingIdx >= 0) {
        entry.participants[existingIdx] = participant;
      } else {
        entry.participants.push(participant);
      }
      entry.updatedAt = Date.now();
      entry.version++;
      fallbackParticipantToRace.set(participant.id, raceId);
    }
    return;
  }

  try {
    const multi = redisClient.multi();
    
    // Add/update participant in race's participant hash
    multi.hset(
      REDIS_KEYS.raceParticipants(raceId),
      participant.id.toString(),
      JSON.stringify(participant)
    );
    
    // Set participant-to-race mapping
    multi.set(REDIS_KEYS.participantRace(participant.id), raceId.toString(), 'EX', REDIS_TTL.race);
    
    // Update race metadata
    multi.hset(REDIS_KEYS.race(raceId), 'updatedAt', Date.now().toString());
    multi.hincrby(REDIS_KEYS.race(raceId), 'version', 1);
    
    await multi.exec();
  } catch (error) {
    console.error('[RedisRaceCache] addParticipant error:', error);
    stats.redisErrors++;
    // Fallback
    const entry = fallbackCache.get(raceId);
    if (entry) {
      const existingIdx = entry.participants.findIndex(p => p.id === participant.id);
      if (existingIdx >= 0) {
        entry.participants[existingIdx] = participant;
      } else {
        entry.participants.push(participant);
      }
      entry.updatedAt = Date.now();
      entry.version++;
      fallbackParticipantToRace.set(participant.id, raceId);
    }
  }
}

/**
 * Remove participant from distributed cache
 */
export async function removeParticipantDistributed(raceId: number, participantId: number): Promise<void> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) {
      entry.participants = entry.participants.filter(p => p.id !== participantId);
      entry.updatedAt = Date.now();
      entry.version++;
      fallbackParticipantToRace.delete(participantId);
    }
    return;
  }

  try {
    const multi = redisClient.multi();
    
    // Remove participant from race hash
    multi.hdel(REDIS_KEYS.raceParticipants(raceId), participantId.toString());
    
    // Remove participant-to-race mapping
    multi.del(REDIS_KEYS.participantRace(participantId));
    
    // Update race metadata
    multi.hset(REDIS_KEYS.race(raceId), 'updatedAt', Date.now().toString());
    multi.hincrby(REDIS_KEYS.race(raceId), 'version', 1);
    
    await multi.exec();
  } catch (error) {
    console.error('[RedisRaceCache] removeParticipant error:', error);
    stats.redisErrors++;
    // Fallback
    const entry = fallbackCache.get(raceId);
    if (entry) {
      entry.participants = entry.participants.filter(p => p.id !== participantId);
      entry.updatedAt = Date.now();
      entry.version++;
      fallbackParticipantToRace.delete(participantId);
    }
  }
}

/**
 * Buffer participant progress in distributed cache
 */
export async function bufferProgressDistributed(
  participantId: number,
  progress: number,
  wpm: number,
  accuracy: number,
  errors: number
): Promise<void> {
  const now = Date.now();
  const progressData: ParticipantProgress = {
    progress,
    wpm,
    accuracy,
    errors,
    lastUpdate: now,
    dirty: true,
    version: 1,
    flushInProgress: false,
  };

  if (!REDIS_ENABLED) {
    const existing = fallbackProgress.get(participantId);
    progressData.version = existing ? existing.version + 1 : 1;
    fallbackProgress.set(participantId, progressData);
    return;
  }

  try {
    const raceIdStr = await redisClient.get(REDIS_KEYS.participantRace(participantId));
    if (!raceIdStr) {
      await redisClient.set(
        REDIS_KEYS.progress(participantId),
        JSON.stringify(progressData),
        'EX',
        REDIS_TTL.progress
      );
      return;
    }
    const raceId = parseInt(raceIdStr, 10);
    const script = `
      local progressKey = KEYS[1]
      local participantRaceKey = KEYS[2]
      local raceParticipantsKey = KEYS[3]
      local participantId = ARGV[1]
      local progressJson = ARGV[2]
      local ttl = tonumber(ARGV[3])
      local progress = tonumber(ARGV[4])
      local wpm = tonumber(ARGV[5])
      local accuracy = tonumber(ARGV[6])
      local errors = tonumber(ARGV[7])
      redis.call('SET', progressKey, progressJson, 'EX', ttl)
      local participantStr = redis.call('HGET', raceParticipantsKey, participantId)
      if participantStr then
        local participant = cjson.decode(participantStr)
        participant.progress = progress
        participant.wpm = wpm
        participant.accuracy = accuracy
        participant.errors = errors
        redis.call('HSET', raceParticipantsKey, participantId, cjson.encode(participant))
      end
      return 1
    `;
    await redisClient.eval(
      script,
      3,
      REDIS_KEYS.progress(participantId),
      REDIS_KEYS.participantRace(participantId),
      REDIS_KEYS.raceParticipants(raceId),
      participantId.toString(),
      JSON.stringify(progressData),
      REDIS_TTL.progress.toString(),
      progress.toString(),
      wpm.toString(),
      accuracy.toString(),
      errors.toString()
    );
  } catch (error) {
    console.error('[RedisRaceCache] bufferProgress error:', error);
    stats.redisErrors++;
    // Fallback
    const existing = fallbackProgress.get(participantId);
    progressData.version = existing ? existing.version + 1 : 1;
    fallbackProgress.set(participantId, progressData);
  }
}

/**
 * Get progress from distributed cache
 */
export async function getProgressDistributed(participantId: number): Promise<ParticipantProgress | undefined> {
  if (!REDIS_ENABLED) {
    return fallbackProgress.get(participantId);
  }

  try {
    const data = await redisClient.get(REDIS_KEYS.progress(participantId));
    if (data) {
      return JSON.parse(data) as ParticipantProgress;
    }
    return undefined;
  } catch (error) {
    console.error('[RedisRaceCache] getProgress error:', error);
    stats.redisErrors++;
    return fallbackProgress.get(participantId);
  }
}

/**
 * Delete race from distributed cache
 */
export async function deleteRaceDistributed(raceId: number): Promise<void> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) {
      for (const p of entry.participants) {
        fallbackParticipantToRace.delete(p.id);
        fallbackProgress.delete(p.id);
      }
    }
    fallbackCache.delete(raceId);
    return;
  }

  try {
    // Get participants first to clean up their mappings
    const participantsData = await redisClient.hgetall(REDIS_KEYS.raceParticipants(raceId));
    
    const multi = redisClient.multi();
    
    // Delete race data
    multi.del(REDIS_KEYS.race(raceId));
    multi.del(REDIS_KEYS.raceParticipants(raceId));
    
    // Delete participant mappings
    if (participantsData) {
      for (const participantId of Object.keys(participantsData)) {
        multi.del(REDIS_KEYS.participantRace(parseInt(participantId, 10)));
        multi.del(REDIS_KEYS.progress(parseInt(participantId, 10)));
      }
    }
    
    await multi.exec();
  } catch (error) {
    console.error('[RedisRaceCache] deleteRace error:', error);
    stats.redisErrors++;
    // Fallback
    const entry = fallbackCache.get(raceId);
    if (entry) {
      for (const p of entry.participants) {
        fallbackParticipantToRace.delete(p.id);
        fallbackProgress.delete(p.id);
      }
    }
    fallbackCache.delete(raceId);
  }
}

/**
 * Finish participant in distributed cache
 */
export async function finishParticipantDistributed(
  raceId: number,
  participantId: number,
  position: number
): Promise<void> {
  if (!REDIS_ENABLED) {
    const entry = fallbackCache.get(raceId);
    if (entry) {
      const participant = entry.participants.find(p => p.id === participantId);
      if (participant) {
        participant.isFinished = 1;
        participant.finishPosition = position;
        participant.finishedAt = new Date();
      }
      entry.updatedAt = Date.now();
      entry.version++;
    }
    return;
  }

  try {
    const participantStr = await redisClient.hget(
      REDIS_KEYS.raceParticipants(raceId),
      participantId.toString()
    );
    
    if (participantStr) {
      const participant = JSON.parse(participantStr) as RaceParticipant;
      participant.isFinished = 1;
      participant.finishPosition = position;
      participant.finishedAt = new Date();
      
      const multi = redisClient.multi();
      multi.hset(
        REDIS_KEYS.raceParticipants(raceId),
        participantId.toString(),
        JSON.stringify(participant)
      );
      multi.hset(REDIS_KEYS.race(raceId), 'updatedAt', Date.now().toString());
      multi.hincrby(REDIS_KEYS.race(raceId), 'version', 1);
      
      await multi.exec();
    }
  } catch (error) {
    console.error('[RedisRaceCache] finishParticipant error:', error);
    stats.redisErrors++;
    // Fallback
    const entry = fallbackCache.get(raceId);
    if (entry) {
      const participant = entry.participants.find(p => p.id === participantId);
      if (participant) {
        participant.isFinished = 1;
        participant.finishPosition = position;
        participant.finishedAt = new Date();
      }
      entry.updatedAt = Date.now();
      entry.version++;
    }
  }
}

/**
 * Get race ID for a participant from distributed cache
 */
export async function getParticipantRaceDistributed(participantId: number): Promise<number | undefined> {
  if (!REDIS_ENABLED) {
    return fallbackParticipantToRace.get(participantId);
  }

  try {
    const raceIdStr = await redisClient.get(REDIS_KEYS.participantRace(participantId));
    if (raceIdStr) {
      return parseInt(raceIdStr, 10);
    }
    return undefined;
  } catch (error) {
    console.error('[RedisRaceCache] getParticipantRace error:', error);
    stats.redisErrors++;
    return fallbackParticipantToRace.get(participantId);
  }
}

/**
 * Get cache statistics
 */
export function getRedisRaceCacheStats(): RedisCacheStats {
  return { ...stats };
}

/**
 * Publish race event to all servers
 */
export async function publishRaceEvent(raceId: number, event: any): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    await redisPub.publish(
      REDIS_KEYS.raceEvents(raceId),
      JSON.stringify({ serverId: SERVER_ID, ...event })
    );
  } catch (error) {
    console.error('[RedisRaceCache] publishRaceEvent error:', error);
  }
}

/**
 * Subscribe to race events from other servers
 */
export async function subscribeToRaceEvents(
  callback: (raceId: number, event: any) => void
): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    await redisSub.psubscribe('race:*:events');
    
    redisSub.on('pmessage', (pattern, channel, message) => {
      try {
        // Extract race ID from channel: race:{raceId}:events
        const match = channel.match(/^race:(\d+):events$/);
        if (match) {
          const raceId = parseInt(match[1], 10);
          const event = JSON.parse(message);
          
          // Only process events from other servers
          if (event.serverId !== SERVER_ID) {
            callback(raceId, event);
          }
        }
      } catch (error) {
        console.error('[RedisRaceCache] Error processing race event:', error);
      }
    });
    
    console.log('[RedisRaceCache] Subscribed to race events');
  } catch (error) {
    console.error('[RedisRaceCache] subscribeToRaceEvents error:', error);
  }
}

/**
 * Get active races from distributed cache
 * Scans Redis for race keys and filters by active status
 */
export async function getActiveRacesDistributed(): Promise<Race[]> {
  if (!REDIS_ENABLED) {
    const activeRaces: Race[] = [];
    const now = Date.now();
    for (const entry of fallbackCache.values()) {
      if (now - entry.updatedAt <= 5 * 60 * 1000) { // 5 minute TTL
        if (['waiting', 'countdown', 'racing'].includes(entry.race.status)) {
          activeRaces.push(entry.race);
        }
      }
    }
    return activeRaces;
  }

  try {
    // Scan Redis for race keys using SCAN (non-blocking)
    const activeRaces: Race[] = [];
    let cursor = '0';
    const scannedRaceIds = new Set<number>();
    
    do {
      const [newCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'race:*', 'COUNT', 100);
      cursor = newCursor;
      
      for (const key of keys) {
        // Extract race ID from key pattern: race:{raceId} (not race:{raceId}:participants)
        const match = key.match(/^race:(\d+)$/);
        if (match) {
          const raceId = parseInt(match[1], 10);
          if (scannedRaceIds.has(raceId)) continue;
          scannedRaceIds.add(raceId);
          
          try {
            const raceData = await redisClient.hget(key, 'race');
            if (raceData) {
              const race = JSON.parse(raceData) as Race;
              if (['waiting', 'countdown', 'racing'].includes(race.status)) {
                activeRaces.push(race);
              }
            }
          } catch (parseError) {
            // Skip invalid race data
            console.error(`[RedisRaceCache] Failed to parse race ${raceId}:`, parseError);
          }
        }
      }
    } while (cursor !== '0');
    
    // Also include any races in fallback cache that might not be in Redis yet
    for (const entry of fallbackCache.values()) {
      if (['waiting', 'countdown', 'racing'].includes(entry.race.status)) {
        if (!scannedRaceIds.has(entry.race.id)) {
          activeRaces.push(entry.race);
        }
      }
    }
    
    return activeRaces;
  } catch (error) {
    console.error('[RedisRaceCache] getActiveRaces error:', error);
    stats.redisErrors++;
    
    // Fallback to in-memory on error
    const activeRaces: Race[] = [];
    for (const entry of fallbackCache.values()) {
      if (['waiting', 'countdown', 'racing'].includes(entry.race.status)) {
        activeRaces.push(entry.race);
      }
    }
    return activeRaces;
  }
}
