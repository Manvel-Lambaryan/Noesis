export type ScanConfig = {
  redisUrl: string;
  logLevel: string;
  queueName: string;
};

export function loadScanConfig(env: Record<string, string | undefined>): ScanConfig {
  if (typeof env.DATABASE_URL === "string") {
    throw new Error("Scan process refuses DATABASE_URL");
  }
  const redisUrl = env.REDIS_URL;
  if (redisUrl === undefined || redisUrl.length === 0) {
    throw new Error("REDIS_URL is required");
  }
  return {
    redisUrl,
    logLevel: env.LOG_LEVEL ?? "info",
    queueName: env.SCAN_QUEUE_NAME ?? "scan",
  };
}
