import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PublicObjectStorage = {
  putPreview(key: string, body: Buffer): Promise<void>;
  readPreview(key: string): Promise<Buffer | null>;
};

export const PUBLIC_STORAGE = Symbol("PUBLIC_STORAGE");

const PREVIEW_KEY = /^previews\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;

export class LocalPublicStorage implements PublicObjectStorage {
  constructor(private readonly root: string) {}

  async putPreview(key: string, body: Buffer): Promise<void> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async readPreview(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch {
      return null;
    }
  }

  private resolve(key: string): string {
    if (!PREVIEW_KEY.test(key) || key.includes("quarantine") || key.includes("..")) {
      throw new Error("Preview storage path is not allowed.");
    }
    const target = path.resolve(this.root, key);
    const root = path.resolve(this.root);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error("Preview storage path is not allowed.");
    }
    return target;
  }
}
