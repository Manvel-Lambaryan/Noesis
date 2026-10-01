import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createLogger } from "@noesis/kernel";
import { database } from "./database";
import { enqueueScan } from "./enqueue";
import { quarantinePath, quarantineRoot } from "./quarantine-path";

export async function prepareVersion(versionId: string): Promise<void> {
  const version = await database().productVersion.findUnique({ where: { id: versionId } });
  if (version === null || version.quarantineKey === null) {
    return;
  }
  if (version.state === "upload_pending" && version.sha256 === null) {
    const claimed = await storeChecksum(versionId, version.quarantineKey);
    if (!claimed) {
      return;
    }
  }
  const current = await database().productVersion.findUnique({ where: { id: versionId } });
  if (current === null || current.sha256 === null || current.quarantineKey === null) {
    return;
  }
  if (current.state !== "quarantined" && current.state !== "scanning") {
    return;
  }
  if (current.state === "quarantined") {
    const moved = await database().productVersion.updateMany({
      where: { id: versionId, state: "quarantined" },
      data: { state: "scanning" },
    });
    if (moved.count !== 1) {
      return;
    }
  }
  await enqueueScan({
    versionId,
    objectKey: current.quarantineKey,
    byteSize: Number(current.byteSize ?? 0),
    sha256: current.sha256,
  });
}

async function storeChecksum(versionId: string, objectKey: string): Promise<boolean> {
  const bytes = await readFile(quarantinePath(quarantineRoot(), objectKey));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const claimed = await database().productVersion.updateMany({
    where: { id: versionId, state: "upload_pending", sha256: null },
    data: { sha256, byteSize: BigInt(bytes.length), state: "quarantined" },
  });
  if (claimed.count === 1) {
    createLogger("worker").info({ message: "artifacts.version_quarantined", correlationId: randomUUID() });
  }
  return claimed.count === 1;
}
