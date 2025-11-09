import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    info: jest.fn(),
    dbsize: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    status: 'ready',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);

    // Mock Redis client
    (service as any).client = mockRedisClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const testData = { name: 'test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with TTL', async () => {
      const testData = { name: 'test' };
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.set('test-key', testData, 300);

      expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
    });

    it('should use default TTL if not provided', async () => {
      const testData = { name: 'test' };
      mockRedisClient.setex.mockResolvedValue('OK');

      await service.set('test-key', testData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testData));
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('error-key', { data: 'test' })).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.delete('error-key')).resolves.not.toThrow();
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      await service.deletePattern('test:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should handle no matching keys', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await service.deletePattern('test:*');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      mockRedisClient.incr.mockResolvedValue(5);

      const result = await service.increment('counter');

      expect(result).toBe(5);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { name: 'cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const callback = jest.fn();
      const result = await service.getOrSet('test-key', callback);

      expect(result).toEqual(cachedData);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback and cache result if not exists', async () => {
      const newData = { name: 'new' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setex.mockResolvedValue('OK');

      const callback = jest.fn().mockResolvedValue(newData);
      const result = await service.getOrSet('test-key', callback, 600);

      expect(result).toEqual(newData);
      expect(callback).toHaveBeenCalled();
      expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 600, JSON.stringify(newData));
    });
  });

  describe('generateSearchCacheKey', () => {
    it('should generate consistent cache key for same params', () => {
      const params1 = { q: 'laptop', type: 'PHYSICAL', limit: 20 };
      const params2 = { limit: 20, type: 'PHYSICAL', q: 'laptop' };

      const key1 = service.generateSearchCacheKey(params1);
      const key2 = service.generateSearchCacheKey(params2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const params1 = { q: 'laptop', limit: 20 };
      const params2 = { q: 'phone', limit: 20 };

      const key1 = service.generateSearchCacheKey(params1);
      const key2 = service.generateSearchCacheKey(params2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('invalidateSearchCache', () => {
    it('should delete all search cache keys', async () => {
      mockRedisClient.keys.mockResolvedValue(['search:products:1', 'search:products:2']);
      mockRedisClient.del.mockResolvedValue(2);

      await service.invalidateSearchCache();

      expect(mockRedisClient.keys).toHaveBeenCalledWith('search:products:*');
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory_human:1.5M');
      mockRedisClient.dbsize.mockResolvedValue(100);

      const stats = await service.getStats();

      expect(stats.connected).toBe(true);
      expect(stats.keyCount).toBe(100);
      expect(stats.memoryUsage).toBe('1.5M');
    });

    it('should handle errors in getStats', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Redis error'));

      const stats = await service.getStats();

      expect(stats.connected).toBe(false);
      expect(stats.keyCount).toBe(0);
      expect(stats.memoryUsage).toBeNull();
    });
  });

  describe('flush', () => {
    it('should flush all cache', async () => {
      mockRedisClient.flushdb.mockResolvedValue('OK');

      await service.flush();

      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });
});
