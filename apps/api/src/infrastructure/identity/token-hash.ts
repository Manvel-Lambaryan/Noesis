import { createHash, randomBytes } from "node:crypto";

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(now: Date): Date {
  const seconds = positiveInt(process.env.SESSION_TTL_SECONDS, 1_209_600);
  return new Date(now.getTime() + seconds * 1000);
}

export function appPublicUrl(): string {
  const configured = process.env.APP_PUBLIC_URL;
  const base = configured === undefined || configured.length === 0 ? "http://localhost:3000" : configured;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.length === 0) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
