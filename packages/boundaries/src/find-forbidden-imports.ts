import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type SourceFile = {
  path: string;
  source: string;
};

export type ForbiddenImport = {
  file: string;
  specifier: string;
  reason: string;
};

const IMPORT_PATTERN = /from\s+["']([^"']+)["']/g;

export function findForbiddenImports(files: readonly SourceFile[]): ForbiddenImport[] {
  return files.flatMap((file) => violationsInFile(file));
}

export function readTypeScriptFiles(directory: string): SourceFile[] {
  return walk(directory).map((filePath) => ({
    path: filePath.replace(/\\/g, "/"),
    source: readFileSync(filePath, "utf8"),
  }));
}

function violationsInFile(file: SourceFile): ForbiddenImport[] {
  const importer = moduleName(file.path);
  return importSpecifiers(file.source).flatMap((specifier) => {
    const reason = classifyImport(importer, resolveSpecifier(file.path, specifier), specifier);
    return reason === null ? [] : [{ file: file.path, specifier, reason }];
  });
}

function classifyImport(
  importer: string | null,
  resolved: string,
  specifier: string,
): string | null {
  if (specifier === "@prisma/client" || specifier.startsWith("@prisma/client/")) {
    return importer === null ? null : "Domain modules must not import the Prisma client";
  }
  const target = moduleName(resolved);
  if (target === null || importer === target) {
    return null;
  }
  const base = resolved.split("/").pop() ?? "";
  if (base === "public-port.ts" || base === "public-port.js") {
    return null;
  }
  if (importer === null && (base.endsWith(".module.ts") || base.endsWith(".module.js"))) {
    return null;
  }
  return `Cross-module import of ${target}/${base} is forbidden`;
}

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1] ?? "");
}

function moduleName(filePath: string): string | null {
  const match = filePath.replace(/\\/g, "/").match(/\/modules\/([^/]+)\//);
  return match?.[1] ?? null;
}

function resolveSpecifier(fromFile: string, specifier: string): string {
  if (!specifier.startsWith(".")) {
    return specifier;
  }
  return path.resolve(path.dirname(fromFile), specifier).replace(/\\/g, "/");
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return walk(fullPath);
    }
    return fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}
