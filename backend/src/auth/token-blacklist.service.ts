import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redis!: Redis;
  private fallback = new Map<string, number>(); // used when Redis is unavailable
  private useRedis = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<number>('REDIS_PORT', 6379);

    this.redis = new Redis({ host, port, lazyConnect: true });

    this.redis.connect()
      .then(() => {
        this.useRedis = true;
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      })
      .catch((err) => {
        this.logger.warn(`Redis unavailable (${err.message}), using in-memory fallback`);
      });

    this.redis.on('error', (err) => {
      if (this.useRedis) {
        this.logger.warn(`Redis error: ${err.message}, switched to in-memory fallback`);
        this.useRedis = false;
      }
    });

    this.redis.on('connect', () => {
      this.useRedis = true;
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async revoke(jti: string, expiresAt: number) {
    const ttlSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    if (ttlSeconds <= 0) return;

    if (this.useRedis) {
      await this.redis.set(`bl:${jti}`, '1', 'EX', ttlSeconds);
    } else {
      this.fallback.set(jti, expiresAt);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    if (this.useRedis) {
      const val = await this.redis.get(`bl:${jti}`);
      return val !== null;
    }

    const exp = this.fallback.get(jti);
    if (exp === undefined) return false;
    if (Date.now() > exp) {
      this.fallback.delete(jti);
      return false;
    }
    return true;
  }
}
