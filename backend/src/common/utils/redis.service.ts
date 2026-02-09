import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Rate limiting
  async incrementWithTTL(key: string, ttlSeconds: number): Promise<number> {
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  // Session management
  async setSession(sessionId: string, data: object, ttlSeconds: number): Promise<void> {
    await this.set(`session:${sessionId}`, JSON.stringify(data), ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Credit management
  async deductCredit(userId: string, amount: number): Promise<number> {
    const key = `credits:${userId}`;
    const current = await this.getCredits(userId);
    const newValue = current - amount;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async getCredits(userId: string): Promise<number> {
    const credits = await this.get(`credits:${userId}`);
    return credits ? parseInt(credits, 10) : 0;
  }

  async setCredits(userId: string, credits: number, ttlSeconds?: number): Promise<void> {
    await this.set(`credits:${userId}`, credits.toString(), ttlSeconds);
  }

  // Temp file tracking
  async trackTempFile(sessionId: string, filePath: string): Promise<void> {
    await this.client.sadd(`tempfiles:${sessionId}`, filePath);
  }

  async getTempFiles(sessionId: string): Promise<string[]> {
    return this.client.smembers(`tempfiles:${sessionId}`);
  }

  async clearTempFiles(sessionId: string): Promise<void> {
    await this.client.del(`tempfiles:${sessionId}`);
  }
}
