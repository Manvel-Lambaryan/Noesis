import { randomUUID } from "node:crypto";
import { createLogger, type ScanJob } from "@noesis/kernel";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { archiveLimits } from "./archive-limits";
import { loadScanConfig } from "./config";
import { claimScan } from "./lease";
import { publishVerdict } from "./publish-verdict";
import { scanObject } from "./scan-job";

export type ScanHandle = {
  close: () => Promise<void>;
};

export async function startScan(env: Record<string, string | undefined>): Promise<ScanHandle> {
  const config = loadScanConfig(env);
  const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error("Redis ping failed");
  }
  const worker = new Worker(config.queueName, async (job: Job<ScanJob>) => {
    await runScan(redis, config.redisUrl, config.quarantineDir, env, job.data);
  }, { connection: { url: config.redisUrl, maxRetriesPerRequest: null } });
  await worker.waitUntilReady();
  createLogger("scan").info({ message: "scan ready", correlationId: randomUUID() });
  return {
    async close(): Promise<void> {
      await worker.close();
      await redis.quit();
    },
  };
}

async function runScan(
  redis: Redis,
  redisUrl: string,
  quarantineDir: string,
  env: Record<string, string | undefined>,
  job: ScanJob,
): Promise<void> {
  const claimed = await claimScan(redis, job.versionId);
  if (!claimed) {
    return;
  }
  await publishVerdict(redisUrl, await scanObject(job, quarantineDir, archiveLimits(env)));
}
