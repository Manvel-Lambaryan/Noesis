import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { INestApplication } from "@nestjs/common";
import { createApp } from "../create-app";

describe("health", () => {
  let app: INestApplication;
  let baseUrl = "";
  const lines: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  before(async () => {
    process.stdout.write = ((
      chunk: string | Uint8Array,
      encoding?: BufferEncoding,
      callback?: (error?: Error | null) => void,
    ): boolean => {
      lines.push(String(chunk));
      return originalWrite(chunk, encoding, callback);
    }) as typeof process.stdout.write;
    app = await createApp();
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === "object" && address !== null ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    process.stdout.write = originalWrite;
    await app.close();
  });

  it("returns ok when PostgreSQL schemas and Redis are up", async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { "x-correlation-id": "slice1-health" },
    });
    const body: unknown = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-correlation-id"), "slice1-health");
    assert.equal(isRecord(body) && body.status, "ok");
    assert.deepEqual(isRecord(body) ? body.schemas : [], ["catalog", "commerce", "identity", "ops"]);
    const logged = lines.map(parseLine).find((line) => line?.correlationId === "slice1-health");
    assert.equal(logged?.message, "health");
  });

  it("publishes an OpenAPI document", async () => {
    const response = await fetch(`${baseUrl}/docs-json`);
    const body: unknown = await response.json();
    assert.equal(response.status, 200);
    assert.equal(isRecord(body) && isRecord(body.paths) && "/health" in body.paths, true);
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLine(line: string): { correlationId?: string; message?: string } | undefined {
  try {
    const parsed: unknown = JSON.parse(line);
    if (!isRecord(parsed)) {
      return undefined;
    }
    return {
      correlationId: typeof parsed.correlationId === "string" ? parsed.correlationId : undefined,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
    };
  } catch {
    return undefined;
  }
}
