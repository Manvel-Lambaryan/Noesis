import { randomUUID } from "node:crypto";
import { ARTIFACT_PREPARE_QUEUE, ARTIFACT_PROMOTE_QUEUE, SCAN_VERDICT_QUEUE, createLogger, type PrepareJob, type VerdictJob } from "@noesis/kernel";
import { Worker, type Job } from "bullmq";
import { applyVerdict } from "./apply-verdict";
import { prepareVersion } from "./prepare-version";
import { promoteVersion } from "./promote-version";

export type WorkerHandle = {
  close: () => Promise<void>;
};

export async function startWorker(redisUrl: string): Promise<WorkerHandle> {
  const connection = { url: redisUrl, maxRetriesPerRequest: null };
  const idle = new Worker("slice1-idle", async () => undefined, { connection });
  const prepare = new Worker(ARTIFACT_PREPARE_QUEUE, async (job: Job<PrepareJob>) => {
    await prepareVersion(job.data.versionId);
  }, { connection });
  const verdicts = new Worker(SCAN_VERDICT_QUEUE, async (job: Job<VerdictJob>) => {
    await applyVerdict(job.data);
  }, { connection });
  const promote = new Worker(ARTIFACT_PROMOTE_QUEUE, async (job: Job<PrepareJob>) => {
    await promoteVersion(job.data.versionId);
  }, { connection });
  await Promise.all([idle.waitUntilReady(), prepare.waitUntilReady(), verdicts.waitUntilReady(), promote.waitUntilReady()]);
  createLogger("worker").info({ message: "worker ready", correlationId: randomUUID() });
  return {
    async close(): Promise<void> {
      await idle.close();
      await prepare.close();
      await verdicts.close();
      await promote.close();
    },
  };
}
