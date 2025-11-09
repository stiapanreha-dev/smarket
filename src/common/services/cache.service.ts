import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private readonly defaultTTL: number = 300; // 5 minutes in seconds

  /**
   * Get raw Redis client for advanced operations
   */
  get redis(): Redis {
    return this.client;
  }

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error', err);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from cache`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
    } catch (error) {
      this.logger.error(`Error setting key ${key} in cache`, error);
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from cache`, error);
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.log(`Deleted ${keys.length} keys matching pattern ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting keys with pattern ${pattern}`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking if key ${key} exists`, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}`, error);
      return 0;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Generate cache key for search queries
   */
  generateSearchCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, any>,
      );

    const paramsString = JSON.stringify(sortedParams);
    return `search:products:${Buffer.from(paramsString).toString('base64')}`;
  }

  /**
   * Invalidate all search caches
   */
  async invalidateSearchCache(): Promise<void> {
    await this.deletePattern('search:products:*');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string | null;
  }> {
    try {
      const info = await this.client.info('memory');
      const dbSize = await this.client.dbsize();
      const memoryMatch = info.match(/used_memory_human:(.+)/);

      return {
        connected: this.client.status === 'ready',
        keyCount: dbSize,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : null,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats', error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: null,
      };
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.warn('Cache flushed');
    } catch (error) {
      this.logger.error('Error flushing cache', error);
    }
  }

  /**
   * Close Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis client disconnected');
  }
}
