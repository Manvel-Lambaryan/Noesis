import { createHash } from "node:crypto";
import { AuthFailure } from "../../auth/auth-failure";
import type Redis from "ioredis";

export class AuthRateLimit {
  constructor(private readonly redis: Redis) {}

  async assertLoginAllowed(email: string, ip: string): Promise<void> {
    await this.assertUnder(emailKey("login", email), max("AUTH_LOGIN_MAX", 5));
    await this.assertUnder(ipKey("login", ip), max("AUTH_LOGIN_IP_MAX", 50));
  }

  async recordLoginFailure(email: string, ip: string): Promise<void> {
    const windowSeconds = max("AUTH_LOGIN_WINDOW_SECONDS", 900);
    await this.record(emailKey("login", email), windowSeconds);
    await this.record(ipKey("login", ip), windowSeconds);
  }

  async assertResetAllowed(email: string, ip: string): Promise<void> {
    await this.hit(emailKey("reset", email), max("AUTH_RESET_MAX", 5), max("AUTH_RESET_WINDOW_SECONDS", 3600));
    await this.hit(ipKey("reset", ip), max("AUTH_RESET_IP_MAX", 20), max("AUTH_RESET_WINDOW_SECONDS", 3600));
  }

  async assertVerificationAllowed(email: string, ip: string): Promise<void> {
    await this.hit(emailKey("verify", email), max("AUTH_VERIFY_MAX", 5), max("AUTH_VERIFY_WINDOW_SECONDS", 3600));
    await this.hit(ipKey("verify", ip), max("AUTH_VERIFY_IP_MAX", 20), max("AUTH_VERIFY_WINDOW_SECONDS", 3600));
  }

  private async assertUnder(key: string, limit: number): Promise<void> {
    const current = await this.count(key);
    if (current !== null && current >= limit) {
      throw new AuthFailure(429, "rate_limited", "Too many attempts. Try again later.");
    }
  }

  private async count(key: string): Promise<number | null> {
    try {
      return Number((await this.redis.get(key)) ?? "0");
    } catch (error) {
      if (limiterUnavailable(error)) {
        return null;
      }
      throw error;
    }
  }

  private async record(key: string, windowSeconds: number): Promise<void> {
    try {
      const count = await this.redis.incr(key);
      if (count === 1 || (await this.redis.ttl(key)) < 0) {
        await this.redis.expire(key, windowSeconds);
      }
    } catch (error) {
      if (!limiterUnavailable(error)) {
        throw error;
      }
    }
  }

  private async hit(key: string, limit: number, windowSeconds: number): Promise<void> {
    await this.assertUnder(key, limit);
    await this.record(key, windowSeconds);
  }
}

function emailKey(kind: string, email: string): string {
  return `noesis:auth:${kind}:email:${sha(email)}`;
}

function ipKey(kind: string, ip: string): string {
  return `noesis:auth:${kind}:ip:${sha(ip)}`;
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function limiterUnavailable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = "code" in error ? error.code : undefined;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return message.includes("max retries") || message.includes("Connection is closed") || message.includes("ECONNREFUSED");
}

function max(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.length === 0) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
