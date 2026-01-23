/**
 * Rate limiter for API endpoints
 * Prevents abuse and ensures fair usage
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Rate limit configurations
const RATE_LIMITS = {
  generate: {
    free: { requests: 5, window: 60 * 60 * 1000 }, // 5 per hour
    premium: { requests: 100, window: 60 * 60 * 1000 }, // 100 per hour
  },
  download: {
    free: { requests: 1, window: 24 * 60 * 60 * 1000 }, // 1 per 24 hours (Strict "1 Free Use")
    premium: { requests: 500, window: 60 * 60 * 1000 }, // 500 per hour
  },
};

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  endpoint: "generate" | "download",
  isPremium: boolean = false
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${identifier}:${endpoint}`;
  const limits = RATE_LIMITS[endpoint][isPremium ? "premium" : "free"];
  const now = Date.now();

  // Get or initialize rate limit data
  let rateLimitData = store[key];

  // Reset if window expired
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + limits.window,
    };
    store[key] = rateLimitData;
  }

  // Check if limit exceeded
  if (rateLimitData.count >= limits.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimitData.resetTime,
    };
  }

  // Increment count
  rateLimitData.count++;

  return {
    allowed: true,
    remaining: limits.requests - rateLimitData.count,
    resetAt: rateLimitData.resetTime,
  };
}

/**
 * Get client identifier (IP address or user ID)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return ip;
}

/**
 * Clean up old rate limit entries (prevent memory leak)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
