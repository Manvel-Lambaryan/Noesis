import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blocked = [
  /BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/,
  /AKIA[0-9A-Z]{16}/,
  /sk_live_[0-9a-zA-Z]+/,
];
const skip = new Set(["node_modules", "dist", ".next", ".git"]);

const hits = walk(root).flatMap((filePath) => findings(filePath));

if (hits.length > 0) {
  console.error(hits.join("\n"));
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    if (skip.has(entry)) {
      return [];
    }
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return walk(fullPath);
    }
    return isText(fullPath) ? [fullPath] : [];
  });
}

function isText(filePath) {
  return /\.(ts|tsx|js|mjs|json|yml|yaml|md|sql|example)$/.test(filePath);
}

function findings(filePath) {
  const source = readFileSync(filePath, "utf8");
  return blocked
    .filter((pattern) => pattern.test(source))
    .map((pattern) => `${filePath}: matched ${pattern}`);
}
