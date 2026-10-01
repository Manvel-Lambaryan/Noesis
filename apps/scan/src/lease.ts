import type Redis from "ioredis";

export async function claimScan(redis: Redis, versionId: string): Promise<boolean> {
  const result = await redis.set(`noesis:scan:lease:${versionId}`, "1", "EX", 120, "NX");
  return result === "OK";
}
