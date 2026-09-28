import { AuthFailure } from "../../auth/auth-failure";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LABEL = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;
const TYPES = new Set(["application/zip", "application/gzip", "application/x-gzip"]);

export function parseProductId(value: string): string {
  if (!UUID.test(value)) {
    throw missingProduct();
  }
  return value.toLowerCase();
}

export function parseVersionId(value: string): string {
  if (!UUID.test(value)) {
    throw missingVersion();
  }
  return value.toLowerCase();
}

export function parseLabel(value: unknown): string {
  if (typeof value !== "string" || !LABEL.test(value)) {
    throw invalid("Version label must be 1-40 letters, numbers, dots, underscores, or hyphens.");
  }
  return value;
}

export function parseArchiveType(value: unknown): string {
  if (typeof value !== "string" || !TYPES.has(value)) {
    throw invalid("Archive type must be application/zip or application/gzip.");
  }
  return value;
}

export function parseByteSize(value: unknown, maxBytes: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > maxBytes) {
    throw invalid("Archive size is missing or above the development upload fixture.");
  }
  return value;
}

export function archiveMaxBytes(): number {
  return positive("ARCHIVE_MAX_BYTES", 2_147_483_648);
}

export function uploadTtlSeconds(): number {
  return positive("UPLOAD_TTL_SECONDS", 900);
}

export function missingVersion(): AuthFailure {
  return new AuthFailure(404, "not_found", "Artifact version not found.");
}

export function missingProduct(): AuthFailure {
  return new AuthFailure(404, "not_found", "Product not found.");
}

export function invalid(message: string): AuthFailure {
  return new AuthFailure(400, "validation_failed", message);
}

function positive(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
