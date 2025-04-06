import { Request, Response, NextFunction } from 'express';

/**
 * RateLimiter options interface
 */
interface RateLimiterOptions {
  windowMs: number; 
  max: number;
  keyGenerator: (req: Request) => string;
  message?: string;
}

/**
 * In-memory store to track requests
 */
const requestCounts = new Map<string, { count: number; firstRequestTimestamp: number }>();

/**
 * Creates a rate limiter middleware.
 * @param options Configuration options for rate limiting.
 * 
 * @returns Express middleware function.
 * @since v1.0.0
 */
const rateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    max,
    // Default key generator based on IP address
    keyGenerator = (req: Request) => req.ip ?? req.socket.remoteAddress ?? '',
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const currentTime = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, firstRequestTimestamp: currentTime });
      next();
      return;
    }

    const requestData = requestCounts.get(key)!;

    if (currentTime - requestData.firstRequestTimestamp > windowMs) {
      // Reset the count and timestamp
      requestCounts.set(key, { count: 1, firstRequestTimestamp: currentTime });
      next();
      return;
    }

    // Increment the count
    requestData.count += 1;

    if (requestData.count > max) {
      res.status(429).json({ message });
      return;
    }

    next();
  };
};

export default rateLimiter;
