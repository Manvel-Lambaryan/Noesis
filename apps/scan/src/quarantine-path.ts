import path from "node:path";

const KEY = /^quarantine\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(zip|gz)$/;

export function quarantinePath(root: string, key: string): string {
  if (!KEY.test(key) || key.includes("..") || key.includes("previews")) {
    throw new Error("Quarantine key rejected");
  }
  const target = path.resolve(root, key);
  const base = path.resolve(root);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("Quarantine key rejected");
  }
  return target;
}
