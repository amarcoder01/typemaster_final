/**
 * Batched Leaderboard API Client
 * Fetches multiple leaderboard data points in a single request for better performance
 * Production-ready with proper error handling and edge case protection
 */

export type TimeFrame = 'all' | 'daily' | 'weekly' | 'monthly';

export interface BatchLeaderboardRequest {
  type: 'leaderboard' | 'aroundMe';
  timeframe?: TimeFrame;
  language?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  range?: number;
}

export interface BatchLeaderboardResponse {
  results: Array<{
    type: string;
    data?: any;
    error?: string;
  }>;
}

/**
 * Validate and sanitize timeframe parameter
 */
export function validateTimeframe(timeframe: string | undefined): TimeFrame {
  const validTimeframes: TimeFrame[] = ['all', 'daily', 'weekly', 'monthly'];
  if (!timeframe || !validTimeframes.includes(timeframe as TimeFrame)) {
    return 'all';
  }
  return timeframe as TimeFrame;
}

/**
 * Validate and sanitize limit parameter
 */
function validateLimit(limit: number | undefined): number {
  const num = Number(limit) || 20;
  return Math.max(1, Math.min(100, Math.floor(num)));
}

/**
 * Validate and sanitize offset parameter
 */
function validateOffset(offset: number | undefined): number {
  const num = Number(offset) || 0;
  return Math.max(0, Math.floor(num));
}

/**
 * Fetch multiple leaderboard data points in a single batched request
 * Includes retry logic for transient failures
 */
export async function fetchLeaderboardBatch(
  requests: BatchLeaderboardRequest[],
  retries: number = 2
): Promise<BatchLeaderboardResponse> {
  // Validate and sanitize requests
  const sanitizedRequests = requests.map(req => ({
    ...req,
    timeframe: validateTimeframe(req.timeframe),
    limit: validateLimit(req.limit),
    offset: validateOffset(req.offset),
    range: req.range ? Math.max(1, Math.min(20, req.range)) : 5,
  }));

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/leaderboard/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: sanitizedRequests }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Batch request failed: ${response.statusText}`);
        }
        // Retry on server errors (5xx)
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || !Array.isArray(data.results)) {
        throw new Error('Invalid response format');
      }

      return data;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort or client errors
      if (error.name === 'AbortError' || (error.message && error.message.includes('Batch request failed'))) {
        break;
      }
      
      // Wait before retry with exponential backoff
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw lastError || new Error('Failed to fetch leaderboard data');
}

/**
 * Fetch leaderboard and user rank in a single request
 * Production-ready with proper validation and error handling
 */
export async function fetchLeaderboardWithRank(
  userId: string | undefined,
  timeframe: TimeFrame = 'all',
  language: string = 'en',
  limit: number = 20,
  offset: number = 0
): Promise<{
  leaderboard: any;
  aroundMe: any;
}> {
  // Validate inputs
  const safeTimeframe = validateTimeframe(timeframe);
  const safeLimit = validateLimit(limit);
  const safeOffset = validateOffset(offset);
  const safeLanguage = language && typeof language === 'string' ? language.toLowerCase().slice(0, 5) : 'en';

  const requests: BatchLeaderboardRequest[] = [
    {
      type: 'leaderboard',
      timeframe: safeTimeframe,
      language: safeLanguage,
      limit: safeLimit,
      offset: safeOffset,
    },
  ];

  // Only fetch aroundMe if user is logged in with valid userId
  if (userId && typeof userId === 'string' && userId.length > 0) {
    requests.push({
      type: 'aroundMe',
      timeframe: safeTimeframe,
      language: safeLanguage,
      userId,
      range: 3,
    });
  }

  try {
    const response = await fetchLeaderboardBatch(requests);

    // Handle partial failures gracefully
    const leaderboardResult = response.results[0];
    const aroundMeResult = response.results[1];

    return {
      leaderboard: leaderboardResult?.error ? null : (leaderboardResult?.data || null),
      aroundMe: aroundMeResult?.error ? null : (aroundMeResult?.data || null),
    };
  } catch (error) {
    console.error('[LeaderboardAPI] Failed to fetch leaderboard:', error);
    // Return empty result instead of throwing to allow graceful degradation
    return {
      leaderboard: null,
      aroundMe: null,
    };
  }
}

