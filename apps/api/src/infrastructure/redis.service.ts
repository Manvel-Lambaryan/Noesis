import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:63929";
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
