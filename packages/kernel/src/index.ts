export { createLogger } from "./logger";
export type { LogFields, Logger } from "./logger";

export const ARTIFACT_PREPARE_QUEUE = "artifact-prepare";
export const SCAN_QUEUE = "scan";
export const SCAN_VERDICT_QUEUE = "scan-verdicts";

export type PrepareJob = { versionId: string };

export type ScanJob = {
  versionId: string;
  objectKey: string;
  byteSize: number;
  sha256: string;
};

export type VerdictJob = {
  versionId: string;
  verdict: "pass" | "fail";
  reasonCode: string;
  sha256: string;
};
