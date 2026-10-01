import { ARTIFACT_PREPARE_QUEUE, ARTIFACT_PROMOTE_QUEUE, SCAN_QUEUE, SCAN_VERDICT_QUEUE, type ScanJob, type VerdictJob } from "@noesis/kernel";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class ArtifactQueue {
  async enqueuePrepare(versionId: string): Promise<void> {
    await add(ARTIFACT_PREPARE_QUEUE, `prepare-${versionId}`, { versionId });
  }

  async enqueuePromote(versionId: string): Promise<void> {
    await add(ARTIFACT_PROMOTE_QUEUE, `promote-${versionId}`, { versionId });
  }

  async enqueueScan(job: ScanJob): Promise<void> {
    await add(SCAN_QUEUE, `scan-${job.versionId}`, job);
  }

  async enqueueVerdict(job: VerdictJob): Promise<void> {
    await add(SCAN_VERDICT_QUEUE, `verdict-${job.versionId}`, job);
  }
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
