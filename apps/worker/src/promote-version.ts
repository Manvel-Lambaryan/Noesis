import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { createLogger } from "@noesis/kernel";
import { database } from "./database";
import { quarantinePath, quarantineRoot } from "./quarantine-path";

const PRIVATE_KEY = /^private\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f]{64}$/;

export async function promoteVersion(versionId: string): Promise<"promoted" | "duplicate" | "failed" | "missing"> {
  const version = await database().productVersion.findUnique({ where: { id: versionId } });
  if (version === null) {
    return "missing";
  }
  if (version.privateKey !== null) {
    return "duplicate";
  }
  if (version.state !== "approved" || version.quarantineKey === null || version.sha256 === null) {
    return "failed";
  }
  const privateKey = `private/${version.productId}/${version.id}/${version.sha256}`;
  const copied = await copyVerified(version.quarantineKey, privateKey, version.sha256);
  if (!copied) {
    return "failed";
  }
  const claimed = await database().productVersion.updateMany({
    where: { id: versionId, state: "approved", privateKey: null, sha256: version.sha256 },
    data: { privateKey },
  });
  if (claimed.count !== 1) {
    return "duplicate";
  }
  await database().artifactOutbox.create({
    data: {
      id: randomUUID(),
      type: "artifacts.object_promoted",
      subjectId: versionId,
      payload: JSON.stringify({ versionId, productId: version.productId, sha256: version.sha256 }),
    },
  });
  await database().artifactOutbox.updateMany({
    where: { subjectId: versionId, type: "artifacts.version_approved", publishedAt: null },
    data: { publishedAt: new Date() },
  });
  createLogger("worker").info({ message: "artifacts.object_promoted", correlationId: randomUUID(), status: "promoted" });
  return "promoted";
}

export async function retryApprovedPromotions(): Promise<number> {
  const rows = await database().productVersion.findMany({
    where: { state: "approved", privateKey: null, quarantineKey: { not: null }, sha256: { not: null } },
    select: { id: true },
    take: 20,
  });
  let promoted = 0;
  for (const row of rows) {
    if (await promoteVersion(row.id) === "promoted") {
      promoted += 1;
    }
  }
  return promoted;
}

async function copyVerified(quarantineKey: string, privateKey: string, sha256: string): Promise<boolean> {
  if (!PRIVATE_KEY.test(privateKey)) {
    return false;
  }
  const source = quarantinePath(quarantineRoot(), quarantineKey);
  const target = privatePath(privateKey);
  try {
    const bytes = await readFile(source);
    if (createHash("sha256").update(bytes).digest("hex") !== sha256) {
      return false;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    const copied = await readFile(target);
    if (createHash("sha256").update(copied).digest("hex") !== sha256) {
      await rm(target, { force: true });
      return false;
    }
    return true;
  } catch {
    await rm(target, { force: true });
    return false;
  }
}

function privatePath(key: string): string {
  const root = path.resolve(process.env.PRIVATE_DIR ?? path.join(process.env.TEMP ?? "/tmp", "noesis-private"));
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Private storage path is not allowed.");
  }
  return target;
}
