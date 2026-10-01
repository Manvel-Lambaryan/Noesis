import { randomUUID } from "node:crypto";
import type { VerdictJob } from "@noesis/kernel";
import { createLogger } from "@noesis/kernel";
import { database } from "./database";

export async function applyVerdict(job: VerdictJob): Promise<"applied" | "duplicate"> {
  const state = job.verdict === "pass" ? "pending_moderation" : "scan_rejected";
  const updated = await database().productVersion.updateMany({
    where: { id: job.versionId, state: "scanning" },
    data: { state, reasonCode: job.reasonCode },
  });
  if (updated.count !== 1) {
    return "duplicate";
  }
  await database().scanReport.create({
    data: {
      id: randomUUID(),
      versionId: job.versionId,
      verdict: job.verdict,
      reasonCode: job.reasonCode,
      engine: "structural-fixture",
      scannedAt: new Date(),
    },
  });
  createLogger("worker").info({ message: "artifacts.scan_completed", correlationId: randomUUID(), status: job.verdict });
  return "applied";
}
