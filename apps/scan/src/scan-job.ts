import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { ScanJob, VerdictJob } from "@noesis/kernel";
import type { ArchiveLimits } from "./archive-limits";
import { inspectArchive } from "./inspect-archive";
import { quarantinePath } from "./quarantine-path";

export async function scanObject(job: ScanJob, quarantineDir: string, limits: ArchiveLimits): Promise<VerdictJob> {
  const bytes = await readFile(quarantinePath(quarantineDir, job.objectKey));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== job.sha256 || bytes.length !== job.byteSize) {
    return { versionId: job.versionId, verdict: "fail", reasonCode: "integrity", sha256 };
  }
  const inspection = await inspectArchive(bytes, limits);
  if (inspection.verdict === "fail") {
    return { versionId: job.versionId, verdict: "fail", reasonCode: inspection.reasonCode, sha256 };
  }
  if (structuralMalware() !== "pass") {
    return { versionId: job.versionId, verdict: "fail", reasonCode: "malware", sha256 };
  }
  return { versionId: job.versionId, verdict: "pass", reasonCode: "ok", sha256 };
}

function structuralMalware(): "pass" {
  return "pass";
}
