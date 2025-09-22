/**
 * Redis Service for Caching and Real-time Data
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import Redis from 'ioredis';
import { config } from '../config';

class RedisService {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  constructor() {
    // Main Redis client for general operations
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Subscriber client for pub/sub
    this.subscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Publisher client for pub/sub
    this.publisher = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected');
    });

    this.subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
    });

    this.publisher.on('connect', () => {
      console.log('Redis publisher connected');
    });

    this.publisher.on('error', (err) => {
      console.error('Redis publisher error:', err);
    });
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      await this.client.hdel(key, field);
      return true;
    } catch (error) {
      console.error('Redis HDEL error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      console.error('Redis RPUSH error:', error);
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      return [];
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      console.error('Redis LLEN error:', error);
      return 0;
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      console.error('Redis SADD error:', error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.error('Redis SISMEMBER error:', error);
      return false;
    }
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zadd(key, score, member);
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return 0;
    }
  }

  async zrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    try {
      if (withScores) {
        return await this.client.zrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      console.error('Redis ZRANGE error:', error);
      return [];
    }
  }

  async zrevrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    try {
      if (withScores) {
        return await this.client.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client.zrevrange(key, start, stop);
    } catch (error) {
      console.error('Redis ZREVRANGE error:', error);
      return [];
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message);
    } catch (error) {
      console.error('Redis PUBLISH error:', error);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      console.error('Redis SUBSCRIBE error:', error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      console.error('Redis UNSUBSCRIBE error:', error);
    }
  }

  // Analytics specific methods
  async trackEvent(eventType: string, data: any, tenantId?: string): Promise<void> {
    try {
      const event = {
        type: eventType,
        data,
        tenantId,
        timestamp: Date.now(),
      };

      // Store in Redis with TTL of 30 days
      const key = `analytics:events:${tenantId || 'global'}:${Date.now()}`;
      await this.set(key, JSON.stringify(event), 30 * 24 * 60 * 60);

      // Publish to real-time analytics channel
      await this.publish('analytics:realtime', JSON.stringify(event));
    } catch (error) {
      console.error('Redis trackEvent error:', error);
    }
  }

  async getAnalyticsData(tenantId?: string, timeRange?: { start: number; end: number }): Promise<any[]> {
    try {
      const pattern = `analytics:events:${tenantId || 'global'}:*`;
      const keys = await this.client.keys(pattern);
      
      if (timeRange) {
        // Filter keys by timestamp if timeRange is provided
        const filteredKeys = keys.filter(key => {
          const timestamp = parseInt(key.split(':').pop() || '0');
          return timestamp >= timeRange.start && timestamp <= timeRange.end;
        });
        return await this.getMultipleKeys(filteredKeys);
      }
      
      return await this.getMultipleKeys(keys);
    } catch (error) {
      console.error('Redis getAnalyticsData error:', error);
      return [];
    }
  }

  private async getMultipleKeys(keys: string[]): Promise<any[]> {
    try {
      if (keys.length === 0) return [];
      
      const values = await this.client.mget(...keys);
      return values
        .filter(value => value !== null)
        .map(value => JSON.parse(value as string));
    } catch (error) {
      console.error('Redis getMultipleKeys error:', error);
      return [];
    }
  }

  // Cache management
  async cacheFormData(formId: string, data: any, ttl = 3600): Promise<boolean> {
    try {
      const key = `form:${formId}`;
      return await this.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      console.error('Redis cacheFormData error:', error);
      return false;
    }
  }

  async getCachedFormData(formId: string): Promise<any | null> {
    try {
      const key = `form:${formId}`;
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getCachedFormData error:', error);
      return null;
    }
  }

  async invalidateFormCache(formId: string): Promise<boolean> {
    try {
      const key = `form:${formId}`;
      return await this.del(key);
    } catch (error) {
      console.error('Redis invalidateFormCache error:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl = 24 * 60 * 60): Promise<boolean> {
    try {
      const key = `session:${sessionId}`;
      return await this.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      console.error('Redis setSession error:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getSession error:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const key = `session:${sessionId}`;
      return await this.del(key);
    } catch (error) {
      console.error('Redis deleteSession error:', error);
      return false;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  // Close connections
  async close(): Promise<void> {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      await this.publisher.quit();
    } catch (error) {
      console.error('Redis close error:', error);
    }
  }
}

export const redisService = new RedisService();
export default redisService;
