import { createHash } from "node:crypto";
import type Redis from "ioredis";
import { AuthFailure } from "../../auth/auth-failure";

export class ArtifactRateLimit {
  constructor(private readonly redis: Redis) {}

  async assertIntentAllowed(sellerId: string): Promise<void> {
    const redisKey = `noesis:artifact:upload:${createHash("sha256").update(sellerId).digest("hex")}`;
    const limit = positive("ARTIFACT_UPLOAD_MAX", 30);
    const current = Number((await this.redis.get(redisKey)) ?? "0");
    if (current >= limit) {
      throw new AuthFailure(429, "rate_limited", "Too many upload attempts. Try again later.");
    }
    const count = await this.redis.incr(redisKey);
    if (count === 1 || (await this.redis.ttl(redisKey)) < 0) {
      await this.redis.expire(redisKey, 3600);
    }
  }
}

function positive(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
