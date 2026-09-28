import { promisify } from "node:util";
import { gunzip, inflateRaw } from "node:zlib";
import type { ArchiveLimits } from "./archive-limits";

const inflate = promisify(inflateRaw);
const unpackGzip = promisify(gunzip);

export type Inspection = { verdict: "pass"; reasonCode: "ok" } | { verdict: "fail"; reasonCode: string };

type Entry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
  symlink: boolean;
  encrypted: boolean;
};

export async function inspectArchive(bytes: Buffer, limits: ArchiveLimits): Promise<Inspection> {
  if (bytes.length > limits.maxBytes) {
    return fail("size");
  }
  if (isGzip(bytes)) {
    return inspectGzip(bytes, limits);
  }
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) {
    return fail("format");
  }
  const entries = readCentralDirectory(bytes);
  if (entries === null) {
    return fail("format");
  }
  if (entries.length === 0) {
    return fail("suspicious");
  }
  if (entries.length > limits.maxEntries) {
    return fail("entry_count");
  }
  let uncompressed = 0;
  for (const entry of entries) {
    const problem = entryProblem(entry, limits);
    if (problem !== null) {
      return fail(problem);
    }
    uncompressed += entry.uncompressedSize;
    if (uncompressed > limits.maxUncompressed) {
      return fail("compression_bomb");
    }
    const inflated = await inflateEntry(bytes, entry, limits.maxUncompressed);
    if (inflated !== null) {
      return fail(inflated);
    }
  }
  return { verdict: "pass", reasonCode: "ok" };
}

function entryProblem(entry: Entry, limits: ArchiveLimits): string | null {
  if (entry.encrypted) {
    return "encrypted";
  }
  if (entry.symlink) {
    return "symlink";
  }
  if (unsafeName(entry.name)) {
    return "traversal";
  }
  if (entry.uncompressedSize > limits.maxUncompressed) {
    return "compression_bomb";
  }
  if (entry.compressedSize === 0 && entry.uncompressedSize > 0) {
    return "compression_bomb";
  }
  if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > limits.maxRatio) {
    return "ratio";
  }
  return null;
}

async function inflateEntry(bytes: Buffer, entry: Entry, cap: number): Promise<string | null> {
  const data = localData(bytes, entry);
  if (data === null) {
    return "format";
  }
  if (entry.method === 0) {
    return data.length > cap ? "compression_bomb" : null;
  }
  if (entry.method !== 8) {
    return "format";
  }
  try {
    const output = await inflate(data);
    return output.length > cap ? "compression_bomb" : null;
  } catch {
    return "format";
  }
}

async function inspectGzip(bytes: Buffer, limits: ArchiveLimits): Promise<Inspection> {
  try {
    const output = await unpackGzip(bytes);
    if (output.length > limits.maxUncompressed) {
      return fail("compression_bomb");
    }
    if (bytes.length > 0 && output.length / bytes.length > limits.maxRatio) {
      return fail("ratio");
    }
    return { verdict: "pass", reasonCode: "ok" };
  } catch {
    return fail("format");
  }
}

function readCentralDirectory(bytes: Buffer): Entry[] | null {
  const eocd = findEocd(bytes);
  if (eocd < 0) {
    return null;
  }
  const count = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  const entries: Entry[] = [];
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) {
      return null;
    }
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const external = bytes.readUInt32LE(offset + 38);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    entries.push({
      name,
      method,
      compressedSize,
      uncompressedSize,
      localOffset,
      symlink: (external >>> 16) & 0o170000 ? ((external >>> 16) & 0o170000) === 0o120000 : false,
      encrypted: (flags & 0x1) === 0x1,
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function localData(bytes: Buffer, entry: Entry): Buffer | null {
  const offset = entry.localOffset;
  if (offset + 30 > bytes.length || bytes.readUInt32LE(offset) !== 0x04034b50) {
    return null;
  }
  const nameLength = bytes.readUInt16LE(offset + 26);
  const extraLength = bytes.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;
  if (end > bytes.length) {
    return null;
  }
  return bytes.subarray(start, end);
}

function findEocd(bytes: Buffer): number {
  const start = Math.max(0, bytes.length - 22 - 65_535);
  for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  return -1;
}

function unsafeName(name: string): boolean {
  if (name.length === 0 || name.includes("\u0000")) {
    return true;
  }
  const normalized = name.replaceAll("\\", "/");
  if (normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) {
    return true;
  }
  return normalized.split("/").some((part) => part === "..");
}

function isGzip(bytes: Buffer): boolean {
  return bytes.length > 10 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function fail(reasonCode: string): Inspection {
  return { verdict: "fail", reasonCode };
}
