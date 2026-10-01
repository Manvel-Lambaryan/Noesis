import { AuthFailure } from "../../auth/auth-failure";

const CODE = /^[a-z0-9](?:[a-z0-9-]{0,31})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MINOR = 9223372036854775807n;

export const UPDATE_POLICIES = ["exact_version", "major_line", "all_future"] as const;
export type UpdatePolicy = (typeof UPDATE_POLICIES)[number];

export type OfferDraft = {
  versionId: string;
  amountMinor: bigint;
  currency: string;
  licenseCode: string | null;
  licenseTextId: string | null;
  updatePolicy: UpdatePolicy | null;
  demoUrl: string | null;
};

export function parseOfferDraft(body: Record<string, unknown>): OfferDraft {
  return {
    versionId: parseUuid(body.versionId, "Choose a promoted version."),
    amountMinor: parseAmountMinor(body.amountMinor),
    currency: parseCurrency(body.currency),
    licenseCode: parseLicenseCode(body.licenseCode),
    licenseTextId: optionalUuid(body.licenseTextId),
    updatePolicy: parseUpdatePolicy(body.updatePolicy),
    demoUrl: parseDemoUrl(body.demoUrl),
  };
}

export function parseAmountMinor(value: unknown): bigint {
  const digits = amountDigits(value);
  if (digits === null || digits === "0" || digits.startsWith("0")) {
    throw invalid("Price must be a positive whole number of minor units.");
  }
  const amount = BigInt(digits);
  if (amount <= 0n || amount > MAX_MINOR) {
    throw invalid("Price must be a positive whole number of minor units.");
  }
  return amount;
}

export function parseCurrency(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z]{3}$/.test(value)) {
    throw invalid("Currency must be a 3-letter code. An approved currency list is not set.");
  }
  return value.toUpperCase();
}

export function parseUpdatePolicy(value: unknown): UpdatePolicy | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (value === "exact_version" || value === "major_line" || value === "all_future") {
    return value;
  }
  throw invalid("Update policy must be exact_version, major_line, all_future, or empty.");
}

export function parseDemoUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || value.length > 500 || /\s/.test(value)) {
    throw invalid("Demo link must be an http or https URL.");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw invalid("Demo link must be an http or https URL.");
  }
  if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.username !== "" || parsed.password !== "") {
    throw invalid("Demo link must be an http or https URL without embedded credentials.");
  }
  return parsed.toString();
}

function parseLicenseCode(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !CODE.test(value)) {
    throw invalid("License code uses lowercase letters, numbers, and hyphens.");
  }
  return value;
}

function optionalUuid(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return parseUuid(value, "License text id must be a UUID. No license document catalog is configured.");
}

function parseUuid(value: unknown, message: string): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw invalid(message);
  }
  return value.toLowerCase();
}

function amountDigits(value: unknown): string | null {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? String(value) : null;
  }
  if (typeof value === "string" && /^[0-9]+$/.test(value)) {
    return value;
  }
  return null;
}

function invalid(message: string): AuthFailure {
  return new AuthFailure(400, "validation_failed", message);
}
