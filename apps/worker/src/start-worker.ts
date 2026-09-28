import { randomUUID } from "node:crypto";
import { createLogger } from "@noesis/kernel";
import { Worker } from "bullmq";
import Redis from "ioredis";

export type WorkerHandle = {
  close: () => Promise<void>;
};

export async function startWorker(redisUrl: string): Promise<WorkerHandle> {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker("slice1-idle", async () => undefined, { connection });
  await worker.waitUntilReady();
  createLogger("worker").info({ message: "worker ready", correlationId: randomUUID() });
  return {
    async close(): Promise<void> {
      await worker.close();
      await connection.quit();
    },
  };
}
