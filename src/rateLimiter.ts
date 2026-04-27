import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Connect to Redis using the internal docker-compose network service name 'redis'
// Process.env override allows flexibility for local dev vs dockerized environment
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  // We don't want the server to crash entirely if redis is briefly unavailable
  // but rate limiting will fail open/close based on logic.
  retryStrategy: (times) => Math.min(times * 50, 2000), 
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// Configure constants for rate limiting
const MAX_REQUESTS = 10;
const WINDOW_SECONDS = 60; // 1 minute

/**
 * Express Middleware enforcing a strict Rate Limit per IP.
 * Uses Redis to atomically increment counters efficiently.
 */
export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  // Extract client IP address from request (falling back to generic metric if missing)
  // In production behind proxies, you may need to check 'x-forwarded-for' headers
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Define a unique bucket key based on the IP address
  const redisKey = `ratelimit:${clientIp}`;

  try {
    // Atomically increment the request count for this IP
    // If the key doesn't exist, Redis initializes it to 0 before incrementing
    const currentCount = await redisClient.incr(redisKey);

    // If this is the very first request (count is 1), we set the expiration
    // This starts the time-window countdown
    if (currentCount === 1) {
      await redisClient.expire(redisKey, WINDOW_SECONDS);
    }

    // Check if the user has exceeded their allotment
    if (currentCount > MAX_REQUESTS) {
      return res.status(429).json({
        status: 'error',
        message: `Too many requests. Maximum ${MAX_REQUESTS} requests per minute allowed.`
      });
    }

    // Inform the client of their remaining limit purely for convenience
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - currentCount));

    // Limit not reached, proceed to the actual execution handler
    next();
  } catch (err) {
    console.error('[RateLimiter] Error validating limit:', err);
    // If Redis fails, we "fail closed" to protect the system by standardizing on 500
    // Alternatively one could fail open by calling next(), but security prefers closed
    res.status(500).json({
      status: 'error',
      message: 'Service temporarily unavailable due to internal state error.'
    });
  }
};
