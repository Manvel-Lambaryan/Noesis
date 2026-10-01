import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { once } from "node:events";
import type { Request } from "express";
import { finished } from "node:stream/promises";

const KEY = /^quarantine\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(zip|gz)$/;

export function isQuarantineKey(key: string): boolean {
  return KEY.test(key) && !key.includes("..") && !key.includes("previews");
}

export const QUARANTINE_STORAGE = Symbol("QUARANTINE_STORAGE");

export class QuarantineStorage {
  constructor(private readonly root: string) {}

  async writeStream(key: string, request: Request, maxBytes: number): Promise<number> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    const file = createWriteStream(target);
    let total = 0;
    try {
      for await (const chunk of request) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += bytes.length;
        if (total > maxBytes) {
          throw new Error("too_large");
        }
        if (!file.write(bytes)) {
          await once(file, "drain");
        }
      }
      file.end();
      await finished(file);
      return total;
    } catch (error) {
      file.destroy();
      await rm(target, { force: true });
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async size(key: string): Promise<number | null> {
    try {
      return (await stat(this.resolve(key))).size;
    } catch {
      return null;
    }
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch {
      return null;
    }
  }

  private resolve(key: string): string {
    if (!isQuarantineKey(key)) {
      throw new Error("Quarantine storage path is not allowed.");
    }
    const target = path.resolve(this.root, key);
    const root = path.resolve(this.root);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error("Quarantine storage path is not allowed.");
    }
    return target;
  }
}

export function quarantineDir(): string {
  return process.env.QUARANTINE_DIR ?? path.join(process.env.TEMP ?? "/tmp", "noesis-quarantine");
}
