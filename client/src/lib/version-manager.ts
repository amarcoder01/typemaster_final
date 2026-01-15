/**
 * Version Manager - Handles application version tracking and cache self-healing
 * 
 * This module provides automatic detection of version mismatches between the
 * currently loaded app and what's stored in the browser, triggering cache
 * cleanup and recovery when needed.
 */

const VERSION_STORAGE_KEY = 'typemasterai_app_version';
const LAST_CLEANUP_KEY = 'typemasterai_last_cleanup';
const CLEANUP_COOLDOWN_MS = 5000; // Prevent cleanup loops

// Keys that should be preserved during cleanup (user preferences, not cache)
const PRESERVED_KEYS = [
  'typemasterai-theme',
  'typemasterai_cookie_consent',
  'notifications_disabled',
  'keyboardSoundsEnabled',
  'keyboardSoundType',
  'smoothCaret',
  'caretSpeed',
  'quickRestart',
  'zenMode',
];

// Keys that are cache-only and should always be cleared on version mismatch
const CACHE_KEYS = [
  'topics_cache',
  'paragraph_cache',
  'book_detail_',
  'book_cache',
  'chapter_cache_',
  'race_',
  'dictation_session_backup',
  'typemaster_custom_code',
  'pending_offline_actions',
];

interface VersionInfo {
  buildId: string;
  buildTime: string;
  storedAt: number;
}

/**
 * Get the current build version from compile-time constants
 * Falls back to 'development' if build constants are not defined
 */
export function getCurrentVersion(): VersionInfo {
  // In development mode, these might not be defined
  const buildId = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'development';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
  
  return {
    buildId,
    buildTime,
    storedAt: Date.now(),
  };
}

/**
 * Get the stored version from localStorage
 */
export function getStoredVersion(): VersionInfo | null {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save the current version to localStorage
 */
export function saveCurrentVersion(): void {
  try {
    const version = getCurrentVersion();
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(version));
  } catch (e) {
    console.warn('[VersionManager] Failed to save version:', e);
  }
}

/**
 * Check if there's a version mismatch
 */
export function hasVersionMismatch(): boolean {
  const stored = getStoredVersion();
  if (!stored) return false; // First visit, no mismatch
  
  const current = getCurrentVersion();
  return stored.buildId !== current.buildId;
}

/**
 * Check if we're within the cleanup cooldown period
 */
function isInCleanupCooldown(): boolean {
  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    if (!lastCleanup) return false;
    
    const elapsed = Date.now() - parseInt(lastCleanup, 10);
    return elapsed < CLEANUP_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * Mark that cleanup was performed
 */
function markCleanupPerformed(): void {
  try {
    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
  } catch {
    // Ignore
  }
}

/**
 * Clear all browser caches (Cache API)
 */
export async function clearBrowserCaches(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[VersionManager] Cleared browser caches:', cacheNames);
    } catch (e) {
      console.warn('[VersionManager] Failed to clear browser caches:', e);
    }
  }
}

/**
 * Clear cached localStorage entries while preserving user preferences
 */
export function clearCachedStorage(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Skip preserved keys
      if (PRESERVED_KEYS.includes(key)) continue;
      
      // Check if it matches cache patterns
      const isCacheKey = CACHE_KEYS.some(pattern => key.startsWith(pattern));
      if (isCacheKey) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('[VersionManager] Cleared cached storage keys:', keysToRemove);
  } catch (e) {
    console.warn('[VersionManager] Failed to clear cached storage:', e);
  }
}

/**
 * Trigger service worker update
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    
    // Check for updates
    await registration.update();
    
    // If there's a waiting worker, activate it
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to take over
      return new Promise((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve(true);
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve(false);
        }, 5000);
      });
    }
    
    return true;
  } catch (e) {
    console.warn('[VersionManager] Failed to update service worker:', e);
    return false;
  }
}

/**
 * Perform full cache cleanup and recovery
 */
export async function performCacheCleanup(): Promise<void> {
  console.log('[VersionManager] Performing cache cleanup...');
  
  // Clear browser caches (Cache API)
  await clearBrowserCaches();
  
  // Clear cached localStorage
  clearCachedStorage();
  
  // Update service worker
  await updateServiceWorker();
  
  // Mark cleanup performed
  markCleanupPerformed();
  
  // Save current version
  saveCurrentVersion();
  
  console.log('[VersionManager] Cache cleanup complete');
}

/**
 * Main entry point - check version and recover if needed
 * Returns true if a reload is required
 */
export async function checkAndRecoverVersion(): Promise<boolean> {
  const storedVersion = getStoredVersion();
  const currentVersion = getCurrentVersion();
  
  // First visit - just save version
  if (!storedVersion) {
    console.log('[VersionManager] First visit, saving version:', currentVersion.buildId);
    saveCurrentVersion();
    return false;
  }
  
  // Check for version mismatch
  if (storedVersion.buildId === currentVersion.buildId) {
    // Version matches, no action needed
    return false;
  }
  
  console.log('[VersionManager] Version mismatch detected:', {
    stored: storedVersion.buildId,
    current: currentVersion.buildId,
  });
  
  // Check cooldown to prevent infinite loops
  if (isInCleanupCooldown()) {
    console.warn('[VersionManager] Within cleanup cooldown, skipping');
    saveCurrentVersion(); // Update version to break the loop
    return false;
  }
  
  // Perform cleanup
  await performCacheCleanup();
  
  // Return true to indicate reload is needed
  return true;
}

/**
 * Force a complete cache reset (for error recovery)
 */
export async function forceCompleteReset(): Promise<void> {
  console.log('[VersionManager] Forcing complete reset...');
  
  // Clear ALL localStorage (except critical auth data)
  const authKeys = ['typemasterai-theme']; // Keep theme for UX
  const authData: Record<string, string> = {};
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) authData[key] = value;
  });
  
  localStorage.clear();
  
  // Restore preserved data
  Object.entries(authData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  // Clear all caches
  await clearBrowserCaches();
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
  }
  
  // Save new version
  saveCurrentVersion();
  markCleanupPerformed();
  
  console.log('[VersionManager] Complete reset finished');
}

/**
 * Check if a specific error is cache-related
 */
export function isCacheRelatedError(error: Error): boolean {
  // Check for ChunkLoadError by name (common in Webpack/Vite)
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
    'error loading dynamically imported module',
    'unexpected token \'<\'', // Often HTML error page served instead of JS
    'unexpected token < in json',
    'is not valid json',
    'syntaxerror: unexpected token',
    'typeerror: failed to fetch',
    'networkerror when attempting to fetch',
  ];
  
  return cacheErrorPatterns.some(pattern => 
    message.includes(pattern) || stack.includes(pattern)
  );
}

/**
 * Check if error is specifically a chunk load error
 */
export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.toLowerCase().includes('loading chunk') ||
    error.message.toLowerCase().includes('loading css chunk') ||
    error.message.toLowerCase().includes('failed to fetch dynamically imported module')
  );
}

/**
 * Retry a dynamic import with cache busting
 * Use this as a wrapper around lazy() imports
 */
export async function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (isLastAttempt) {
        // On final failure, attempt cache clear and throw
        console.error('[DynamicImport] All retry attempts failed:', error);
        throw error;
      }
      
      console.warn(`[DynamicImport] Attempt ${attempt + 1} failed, retrying...`);
      
      // Clear caches before retry
      if (attempt === 1) {
        await clearBrowserCaches();
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  
  throw new Error('Dynamic import failed after all retries');
}

/**
 * Handle a cache-related error by performing recovery
 */
export async function handleCacheError(error: Error): Promise<boolean> {
  if (!isCacheRelatedError(error)) {
    return false;
  }
  
  console.error('[VersionManager] Cache-related error detected:', error.message);
  
  if (isInCleanupCooldown()) {
    console.warn('[VersionManager] Within cleanup cooldown, not recovering');
    return false;
  }
  
  await forceCompleteReset();
  return true;
}

/**
 * Check for updates when user returns to the tab
 * Call this in a visibility change listener
 */
export async function checkForUpdatesOnVisibilityChange(): Promise<void> {
  if (document.visibilityState !== 'visible') return;
  
  try {
    // Check if there's a new service worker waiting
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        
        if (registration.waiting) {
          console.log('[VersionManager] New service worker waiting, activating...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }
  } catch (e) {
    console.warn('[VersionManager] Error checking for updates:', e);
  }
}

/**
 * Initialize visibility change listener for update checking
 */
export function initVisibilityChangeListener(): () => void {
  const handler = () => {
    checkForUpdatesOnVisibilityChange();
  };
  
  document.addEventListener('visibilitychange', handler);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handler);
  };
}

/**
 * Check version via API (for server-coordinated updates)
 * Optional: Can be used to check if server has a newer version
 */
export async function checkServerVersion(): Promise<{ hasUpdate: boolean; serverVersion?: string }> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    
    if (!response.ok) {
      return { hasUpdate: false };
    }
    
    const data = await response.json();
    const serverVersion = data.version || data.buildId;
    
    if (serverVersion && serverVersion !== getCurrentVersion().buildId) {
      return { hasUpdate: true, serverVersion };
    }
    
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}
