import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl === undefined || redisUrl.length === 0) {
      throw new Error("REDIS_URL is required");
    }
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
