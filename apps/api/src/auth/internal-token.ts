import { timingSafeEqual } from "node:crypto";

export function internalTokenAccepts(presented: string | undefined): boolean {
  const expected = process.env.INTERNAL_BFF_TOKEN;
  if (expected === undefined || expected.length < 16 || presented === undefined) {
    return false;
  }
  const left = Buffer.from(expected);
  const right = Buffer.from(presented);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function clientIp(header: string | undefined): string {
  if (header === undefined) {
    return "unknown";
  }
  const trimmed = header.trim();
  return /^[A-Za-z0-9.:]{1,64}$/.test(trimmed) ? trimmed : "unknown";
}
