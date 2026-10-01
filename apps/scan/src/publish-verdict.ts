import { SCAN_VERDICT_QUEUE, type VerdictJob } from "@noesis/kernel";
import { Queue } from "bullmq";

export async function publishVerdict(redisUrl: string, job: VerdictJob): Promise<void> {
  const queue = new Queue(SCAN_VERDICT_QUEUE, { connection: { url: redisUrl, maxRetriesPerRequest: null } });
  try {
    await queue.add(SCAN_VERDICT_QUEUE, job, {
      jobId: `verdict-${job.versionId}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 50,
    });
  } catch (error) {
    if (!(error instanceof Error) || !/jobid|already exists/i.test(error.message)) {
      throw error;
    }
  } finally {
    await queue.close();
  }
}
