import { createHash } from "node:crypto";
import type Redis from "ioredis";
import { AuthFailure } from "../../auth/auth-failure";

export class ProductRateLimit {
  constructor(private readonly redis: Redis) {}

  async assertCreateAllowed(sellerId: string, ip: string): Promise<void> {
    const windowSeconds = positive("CATALOG_CREATE_WINDOW_SECONDS", 3600);
    await this.hit(key("user", sellerId), positive("CATALOG_CREATE_MAX", 20), windowSeconds);
    await this.hit(key("ip", ip), positive("CATALOG_CREATE_IP_MAX", 60), windowSeconds);
  }

  private async hit(redisKey: string, limit: number, windowSeconds: number): Promise<void> {
    const current = Number((await this.redis.get(redisKey)) ?? "0");
    if (current >= limit) {
      throw new AuthFailure(429, "rate_limited", "Too many products were created. Try again later.");
    }
    const count = await this.redis.incr(redisKey);
    if (count === 1 || (await this.redis.ttl(redisKey)) < 0) {
      await this.redis.expire(redisKey, windowSeconds);
    }
  }
}

function key(kind: string, value: string): string {
  return `noesis:catalog:create:${kind}:${createHash("sha256").update(value).digest("hex")}`;
}

function positive(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
