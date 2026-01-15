/**
 * IndexNow Service for TypeMasterAI
 * Instantly notify search engines when content is created or updated
 * Supports Bing, Yandex, and other IndexNow-compatible search engines
 */

const BASE_URL = 'https://typemasterai.com';

// IndexNow API key - should be a unique string stored as a file at /{key}.txt on the site
// For production, store this in environment variables
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'typemasterai-indexnow-key-2026';

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

/**
 * Submit URLs to IndexNow for instant indexing
 */
export async function submitToIndexNow(urls: string[]): Promise<{ success: boolean; errors: string[] }> {
  if (urls.length === 0) {
    return { success: true, errors: [] };
  }

  // IndexNow has a limit of 10,000 URLs per request
  const MAX_URLS = 10000;
  const urlsToSubmit = urls.slice(0, MAX_URLS);

  const payload: IndexNowPayload = {
    host: new URL(BASE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urlsToSubmit.map(url => url.startsWith('http') ? url : `${BASE_URL}${url}`),
  };

  const errors: string[] = [];

  // Submit to all IndexNow endpoints
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        console.log(`[IndexNow] Successfully submitted ${urlsToSubmit.length} URLs to ${endpoint}`);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        errors.push(`${endpoint}: ${response.status} - ${errorText}`);
        console.error(`[IndexNow] Failed to submit to ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${endpoint}: ${errorMessage}`);
      console.error(`[IndexNow] Error submitting to ${endpoint}:`, errorMessage);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Submit a single URL for indexing
 */
export async function submitUrlToIndexNow(url: string): Promise<boolean> {
  const result = await submitToIndexNow([url]);
  return result.success;
}

/**
 * Notify search engines when a new shared result is created
 */
export async function notifyNewSharedResult(shareToken: string): Promise<void> {
  const url = `${BASE_URL}/share/${shareToken}`;
  await submitUrlToIndexNow(url);
}

/**
 * Notify search engines when a new certificate is verified
 */
export async function notifyNewCertificate(verificationId: string): Promise<void> {
  const url = `${BASE_URL}/verify/${verificationId}`;
  await submitUrlToIndexNow(url);
}

/**
 * Notify search engines about updated leaderboard
 */
export async function notifyLeaderboardUpdate(): Promise<void> {
  const urls = [
    '/leaderboard',
    '/leaderboards',
    '/code-leaderboard',
    '/stress-leaderboard',
  ];
  await submitToIndexNow(urls);
}

/**
 * Batch notify for multiple URLs (useful for bulk updates)
 */
export async function notifyBatchUrls(paths: string[]): Promise<void> {
  const urls = paths.map(path => path.startsWith('/') ? path : `/${path}`);
  await submitToIndexNow(urls);
}

/**
 * Get the IndexNow key for verification file
 */
export function getIndexNowKey(): string {
  return INDEXNOW_KEY;
}

/**
 * Generate the verification file content
 */
export function getIndexNowKeyFileContent(): string {
  return INDEXNOW_KEY;
}

