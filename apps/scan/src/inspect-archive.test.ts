import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { describe, it } from "node:test";
import { inspectArchive } from "./inspect-archive";
import { declaredBomb, storedZip } from "./zip-fixture";

const limits = { maxBytes: 100_000, maxUncompressed: 1_000, maxEntries: 3, maxRatio: 100 };

describe("archive inspection", () => {
  it("accepts a stored zip and a small gzip", async () => {
    const zip = storedZip([{ name: "src/app.txt", data: Buffer.from("hello") }]);
    assert.equal((await inspectArchive(zip, limits)).verdict, "pass");
    assert.equal((await inspectArchive(gzipSync(Buffer.from("hello")), limits)).verdict, "pass");
  });

  it("rejects traversal, symlinks, bombs, and too many entries", async () => {
    const traversal = storedZip([{ name: "../secret.txt", data: Buffer.from("x") }]);
    const absolute = storedZip([{ name: "/etc/passwd", data: Buffer.from("x") }]);
    const link = storedZip([{ name: "link", data: Buffer.from("x"), mode: 0o120777 }]);
    const many = storedZip([
      { name: "a.txt", data: Buffer.from("a") },
      { name: "b.txt", data: Buffer.from("b") },
      { name: "c.txt", data: Buffer.from("c") },
      { name: "d.txt", data: Buffer.from("d") },
    ]);
    assert.equal((await inspectArchive(traversal, limits)).reasonCode, "traversal");
    assert.equal((await inspectArchive(absolute, limits)).reasonCode, "traversal");
    assert.equal((await inspectArchive(link, limits)).reasonCode, "symlink");
    assert.equal((await inspectArchive(declaredBomb(50_000), limits)).reasonCode, "compression_bomb");
    assert.equal((await inspectArchive(many, limits)).reasonCode, "entry_count");
    assert.equal((await inspectArchive(Buffer.from("not-a-zip"), limits)).reasonCode, "format");
  });
});
