// lib/ratelimit.js
// Per-IP rate limiting using Upstash Redis.
// If Upstash isn't configured, rate limiting is disabled (returns success: true).

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MAX_SEARCHES_PER_DAY = parseInt(
  process.env.MAX_SEARCHES_PER_IP_PER_DAY || "5",
  10
);

let ratelimit = null;

function getLimiter() {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null; // No rate limiting configured
  }

  const redis = new Redis({ url, token });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(MAX_SEARCHES_PER_DAY, "1 d"),
    analytics: true,
    prefix: "karell-jobs:rl",
  });

  return ratelimit;
}

export async function checkRateLimit(ip) {
  const limiter = getLimiter();

  if (!limiter) {
    // Upstash not configured — allow all requests
    return {
      success: true,
      limit: MAX_SEARCHES_PER_DAY,
      remaining: MAX_SEARCHES_PER_DAY,
      reset: 0,
      configured: false,
    };
  }

  const result = await limiter.limit(ip);
  return { ...result, configured: true };
}

export { MAX_SEARCHES_PER_DAY };
