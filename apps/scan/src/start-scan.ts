import { randomUUID } from "node:crypto";
import { createLogger } from "@noesis/kernel";
import Redis from "ioredis";
import { loadScanConfig } from "./config";

export type ScanHandle = {
  close: () => Promise<void>;
};

export async function startScan(env: Record<string, string | undefined>): Promise<ScanHandle> {
  const config = loadScanConfig(env);
  const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1 });
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error("Redis ping failed");
  }
  createLogger("scan").info({ message: "scan ready", correlationId: randomUUID() });
  return {
    async close(): Promise<void> {
      await redis.quit();
    },
  };
}
