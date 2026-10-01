import { AuthFailure } from "./auth-failure";

export function bodyRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AuthFailure(400, "validation_failed", "Request body must be an object.");
  }
  return value as Record<string, unknown>;
}
