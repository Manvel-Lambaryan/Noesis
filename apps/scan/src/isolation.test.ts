import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { claimScan } from "./lease";
import Redis from "ioredis";
import { randomUUID } from "node:crypto";

describe("scanner isolation", () => {
  it("does not ship a database client", () => {
    const packageJson = readFileSync(path.join(__dirname, "../package.json"), "utf8");
    assert.equal(packageJson.includes("@prisma/client"), false);
    const sources = readdirSync(__dirname).filter((name) => name.endsWith(".js") && !name.endsWith(".test.js"));
    for (const name of sources) {
      const source = readFileSync(path.join(__dirname, name), "utf8");
      assert.equal(source.includes("@prisma/client"), false, name);
      if (name !== "config.js") {
        assert.equal(source.includes("DATABASE_URL"), false, name);
      }
    }
  });

  it("lets only one scanner claim a version", async () => {
    const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    const versionId = randomUUID();
    try {
      assert.equal(await claimScan(redis, versionId), true);
      assert.equal(await claimScan(redis, versionId), false);
    } finally {
      await redis.del(`noesis:scan:lease:${versionId}`);
      await redis.quit();
    }
  });
});