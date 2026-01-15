/**
 * Storage Manager - Versioned localStorage wrapper with schema migration support
 * 
 * This module provides a type-safe wrapper around localStorage that:
 * - Automatically versions stored data
 * - Supports schema migrations
 * - Handles corruption detection and recovery
 * - Provides TTL/expiration support
 */

interface StoredData<T> {
  version: number;
  data: T;
  timestamp: number;
  expiry?: number; // Optional expiration timestamp
}

interface StorageConfig<T> {
  key: string;
  version: number;
  defaultValue: T;
  ttlMs?: number; // Time to live in milliseconds
  migrations?: Record<number, (data: unknown) => unknown>; // Version -> migration function
}

/**
 * Create a versioned storage accessor for a specific key
 */
export function createStorage<T>(config: StorageConfig<T>) {
  const { key, version, defaultValue, ttlMs, migrations = {} } = config;

  /**
   * Get stored data, handling migrations and expiration
   */
  function get(): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      const stored: StoredData<unknown> = JSON.parse(raw);

      // Check expiration
      if (stored.expiry && Date.now() > stored.expiry) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      // Check TTL
      if (ttlMs && Date.now() - stored.timestamp > ttlMs) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      // Handle version mismatch
      if (stored.version !== version) {
        // Try to migrate
        let migratedData = stored.data;
        let currentVersion = stored.version;

        // Apply migrations in order
        while (currentVersion < version) {
          const nextVersion = currentVersion + 1;
          const migrate = migrations[nextVersion];
          
          if (migrate) {
            try {
              migratedData = migrate(migratedData);
              currentVersion = nextVersion;
            } catch (e) {
              console.warn(`[StorageManager] Migration from v${currentVersion} to v${nextVersion} failed for ${key}:`, e);
              localStorage.removeItem(key);
              return defaultValue;
            }
          } else {
            // No migration available, reset to default
            console.warn(`[StorageManager] No migration from v${currentVersion} to v${nextVersion} for ${key}, resetting`);
            localStorage.removeItem(key);
            return defaultValue;
          }
        }

        // Save migrated data
        set(migratedData as T);
        return migratedData as T;
      }

      return stored.data as T;
    } catch (e) {
      console.warn(`[StorageManager] Failed to parse ${key}, resetting:`, e);
      localStorage.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Store data with version and timestamp
   */
  function set(data: T, expiryMs?: number): void {
    try {
      const stored: StoredData<T> = {
        version,
        data,
        timestamp: Date.now(),
        expiry: expiryMs ? Date.now() + expiryMs : undefined,
      };
      localStorage.setItem(key, JSON.stringify(stored));
    } catch (e) {
      console.warn(`[StorageManager] Failed to save ${key}:`, e);
    }
  }

  /**
   * Remove stored data
   */
  function remove(): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageManager] Failed to remove ${key}:`, e);
    }
  }

  /**
   * Check if data exists and is valid
   */
  function exists(): boolean {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;

      const stored: StoredData<unknown> = JSON.parse(raw);
      
      // Check expiration
      if (stored.expiry && Date.now() > stored.expiry) {
        return false;
      }
      
      // Check TTL
      if (ttlMs && Date.now() - stored.timestamp > ttlMs) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update data using a function
   */
  function update(updater: (current: T) => T): void {
    const current = get();
    set(updater(current));
  }

  return { get, set, remove, exists, update };
}

/**
 * Simple storage for primitive values (not versioned)
 */
export function createSimpleStorage<T extends string | number | boolean>(
  key: string,
  defaultValue: T
) {
  function get(): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      
      if (typeof defaultValue === 'number') {
        return parseFloat(raw) as T;
      }
      if (typeof defaultValue === 'boolean') {
        return (raw === 'true') as T;
      }
      return raw as T;
    } catch {
      return defaultValue;
    }
  }

  function set(value: T): void {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
      console.warn(`[StorageManager] Failed to save ${key}:`, e);
    }
  }

  function remove(): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  return { get, set, remove };
}

/**
 * Cache storage with automatic expiration
 */
export function createCacheStorage<T>(
  keyPrefix: string,
  ttlMs: number
) {
  function get(id: string): T | null {
    const key = `${keyPrefix}${id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const stored: StoredData<T> = JSON.parse(raw);
      
      // Check expiration
      if (Date.now() - stored.timestamp > ttlMs) {
        localStorage.removeItem(key);
        return null;
      }
      
      return stored.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  function set(id: string, data: T): void {
    const key = `${keyPrefix}${id}`;
    try {
      const stored: StoredData<T> = {
        version: 1,
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(stored));
    } catch (e) {
      console.warn(`[StorageManager] Failed to cache ${key}:`, e);
    }
  }

  function remove(id: string): void {
    const key = `${keyPrefix}${id}`;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  function clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(keyPrefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore
    }
  }

  return { get, set, remove, clearAll };
}

/**
 * Session storage wrapper (cleared on tab close)
 */
export function createSessionStorage<T>(key: string, defaultValue: T) {
  function get(): T {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  function set(data: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`[StorageManager] Failed to save session ${key}:`, e);
    }
  }

  function remove(): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  return { get, set, remove };
}

/**
 * Utility to clear all versioned storage items
 */
export function clearAllVersionedStorage(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const parsed = JSON.parse(raw);
      // Check if it looks like versioned data
      if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
        keysToRemove.push(key);
      }
    } catch {
      // Not JSON, skip
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[StorageManager] Cleared versioned storage keys:', keysToRemove);
}

/**
 * Utility to get storage usage statistics
 */
export function getStorageStats(): {
  totalKeys: number;
  totalSize: number;
  largestKeys: Array<{ key: string; size: number }>;
} {
  const stats: Array<{ key: string; size: number }> = [];
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key) || '';
    const size = key.length + value.length;
    totalSize += size;
    stats.push({ key, size });
  }
  
  // Sort by size descending
  stats.sort((a, b) => b.size - a.size);
  
  return {
    totalKeys: stats.length,
    totalSize,
    largestKeys: stats.slice(0, 10),
  };
}
