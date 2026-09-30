import { Redis } from 'ioredis';
import { ENV } from './env.config.js';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: ENV.REDIS_HOST,
      port: ENV.REDIS_PORT,
      password: ENV.REDIS_PASSWORD,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 5) {
          console.warn('Redis retry threshold reached. Continuing in memory-only fallback.');
          return null;
        }
        return Math.min(times * 100, 2000);
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis warning/error:', err.message);
    });
  }

  return redisClient;
};
