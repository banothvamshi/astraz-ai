/**
 * Response cache for AI generations
 * Reduces costs and improves performance
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 10000; // Maximum cache entries
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from content
 */
function generateCacheKey(resumeText: string, jobDescription: string, options?: { includeCoverLetter?: boolean }): string {
  // Create hash from content AND options
  const coverLetterFlag = options?.includeCoverLetter ? "with_cl" : "no_cl";
  const content = `${resumeText.substring(0, 500)}:${jobDescription.substring(0, 500)}:${coverLetterFlag}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `gen:${Math.abs(hash)}`;
}

/**
 * Get cached response
 */
export function getCachedResponse(
  resumeText: string,
  jobDescription: string,
  options?: { includeCoverLetter?: boolean }
): { resume: string; coverLetter?: string } | null {
  const key = generateCacheKey(resumeText, jobDescription, options);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Cache response
 */
export function setCachedResponse(
  resumeText: string,
  jobDescription: string,
  data: { resume: string; coverLetter?: string },
  options?: { includeCoverLetter?: boolean }
): void {
  // Prevent cache from growing too large
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple FIFO)
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  const key = generateCacheKey(resumeText, jobDescription);
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * Clear expired cache entries
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

// Cleanup every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanupCache, 60 * 60 * 1000);
}
