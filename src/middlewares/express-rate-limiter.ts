/**
 * Node Modules
 */
import { rateLimit } from 'express-rate-limit';
import type { RateLimitRequestHandler, Options } from 'express-rate-limit';

type RateLimitType = 'basic' | 'auth' | 'passwordReset';

const defaultLimitOpt: Partial<Options> = {
  windowMs: 6000, // 1-minute time window for request limiting
  legacyHeaders: false, // Disable deprecated X-RateLimit headers
  standardHeaders: true, // Enable standard rate limit headers
};

const rateLimitOpt = new Map<string, Partial<Options>>([
  ['basic', { ...defaultLimitOpt, limit: 100 }], // 100 requests per window
  ['auth', { ...defaultLimitOpt, limit: 10 }], // 10 requests per window
  ['passwordReset', { ...defaultLimitOpt, limit: 3 }], // 3 requests per window
]);

// Configure rate limiting middleware to prevent abuse
export const expressRateLimit = (
  type: RateLimitType,
): RateLimitRequestHandler => {
  return rateLimit(rateLimitOpt.get(type));
};
