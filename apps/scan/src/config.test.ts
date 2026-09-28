import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadScanConfig } from "./config";
import { startScan } from "./start-scan";

describe("scan config", () => {
  it("refuses a database url", () => {
    assert.throws(() =>
      loadScanConfig({
        DATABASE_URL: "postgresql://noesis:noesis@localhost:5432/noesis",
        REDIS_URL: "redis://127.0.0.1:6379",
      }),
    );
  });

  it("keeps database settings out of the config object", () => {
    const config = loadScanConfig({ REDIS_URL: "redis://127.0.0.1:6379" });
    assert.deepEqual(Object.keys(config).sort(), ["logLevel", "queueName", "redisUrl"]);
  });
});

describe("scan process", () => {
  it("starts and closes against Redis", async () => {
    const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    const handle = await startScan({ REDIS_URL: redisUrl, LOG_LEVEL: "info" });
    await handle.close();
  });
});
