import { SCAN_QUEUE, SCAN_VERDICT_QUEUE, type ScanJob, type VerdictJob } from "@noesis/kernel";
import { Queue } from "bullmq";

export async function enqueueScan(job: ScanJob): Promise<void> {
  await add(SCAN_QUEUE, `scan-${job.versionId}`, job);
}

export async function enqueueVerdict(job: VerdictJob): Promise<void> {
  await add(SCAN_VERDICT_QUEUE, `verdict-${job.versionId}`, job);
}

async function add(name: string, jobId: string, data: object): Promise<void> {
  const url = process.env.REDIS_URL;
  if (url === undefined || url.length === 0) {
    throw new Error("REDIS_URL is required");
  }
  const queue = new Queue(name, { connection: { url, maxRetriesPerRequest: null } });
  try {
    await queue.add(name, data, {
      jobId,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 50,
    });
  } catch (error) {
    if (!duplicateJob(error)) {
      throw error;
    }
  } finally {
    await queue.close();
  }
}

function duplicateJob(error: unknown): boolean {
  return error instanceof Error && /jobid|already exists/i.test(error.message);
}
