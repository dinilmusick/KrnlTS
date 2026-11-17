import { RateLimitConfig, RateLimitTier } from './types';

export const RATE_LIMIT_TIERS: Record<RateLimitTier, { requests: number; windowMs: number }> = {
  CHEAP_READ: { requests: 120, windowMs: 60 * 1000 },
  NORMAL_MUTATION: { requests: 60, windowMs: 60 * 1000 },
  EXPENSIVE_OPERATION: { requests: 20, windowMs: 60 * 1000 },
  AUTHENTICATION: { requests: 25, windowMs: 15 * 60 * 1000 },
};

interface WindowBucket {
  timestamps: number[];
}

const buckets = new Map<string, WindowBucket>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = {},
  multiplier = 1.0
): { allowed: boolean; remaining: number; limit: number; resetTimeMs: number; retryAfterSeconds: number } {
  const tierConfig = config.tier ? RATE_LIMIT_TIERS[config.tier] : RATE_LIMIT_TIERS.NORMAL_MUTATION;
  const baseRequests = config.requests || tierConfig.requests;
  const windowMs = config.windowMs || tierConfig.windowMs;

  const effectiveLimit = Math.max(1, Math.floor(baseRequests * multiplier));
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= effectiveLimit) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = Math.max(0, windowMs - (now - oldest));
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      limit: effectiveLimit,
      resetTimeMs: oldest + windowMs,
      retryAfterSeconds,
    };
  }

  bucket.timestamps.push(now);
  const remaining = Math.max(0, effectiveLimit - bucket.timestamps.length);

  return {
    allowed: true,
    remaining,
    limit: effectiveLimit,
    resetTimeMs: now + windowMs,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
