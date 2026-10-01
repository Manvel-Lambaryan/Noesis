import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLogger } from "./logger";

describe("logger", () => {
  it("writes a JSON line that includes the correlation id", () => {
    const lines: string[] = [];
    const logger = createLogger("api", (line) => {
      lines.push(line);
    });
    logger.info({ message: "health", correlationId: "corr-1", status: "ok" });
    const parsed: unknown = JSON.parse(lines[0] ?? "{}");
    assert.equal(isRecord(parsed) && parsed.correlationId, "corr-1");
    assert.equal(isRecord(parsed) && parsed.message, "health");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
