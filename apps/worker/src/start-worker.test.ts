import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startWorker } from "./start-worker";

describe("worker", () => {
  it("starts and closes against Redis", async () => {
    const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    const handle = await startWorker(redisUrl);
    await handle.close();
    assert.equal(typeof handle.close, "function");
  });
});
