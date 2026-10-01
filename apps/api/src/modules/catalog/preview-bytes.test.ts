import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodePreview, isPreviewKey, parsePreviewDeclaration, previewObjectKey } from "./preview-bytes";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("preview bytes", () => {
  it("accepts a png declaration and rejects archives", () => {
    assert.equal(parsePreviewDeclaration("image/png", PNG.length).contentType, "image/png");
    assert.throws(() => parsePreviewDeclaration("application/zip", 12));
    assert.throws(() => parsePreviewDeclaration("image/png", 9_000_000));
  });

  it("checks magic bytes and refuses a quarantine key", () => {
    const decoded = decodePreview(PNG.toString("base64"), PNG.length, "image/png");
    assert.equal(decoded.length, PNG.length);
    assert.throws(() => decodePreview(Buffer.from("GIF89a").toString("base64"), 6, "image/png"));
    const key = previewObjectKey(
      "a1000000-0000-4000-8000-000000000001",
      "a1000000-0000-4000-8000-000000000002",
      "a1000000-0000-4000-8000-000000000003",
      "png",
    );
    assert.equal(key.startsWith("previews/"), true);
    assert.equal(key.includes("quarantine"), false);
    assert.equal(isPreviewKey(`quarantine/${key}`), false);
    assert.equal(isPreviewKey(key), true);
  });
});
