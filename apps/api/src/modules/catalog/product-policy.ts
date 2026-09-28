import { AuthFailure } from "../../auth/auth-failure";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[a-z0-9](?:[a-z0-9-]{0,31})$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductKindName = "code_asset" | "business_application";

export function parseProductId(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw missingProduct();
  }
  return value.toLowerCase();
}

export function parseTitle(value: unknown): string {
  const title = requiredText(value, 2, 120, "Enter a product name between 2 and 120 characters.");
  return title;
}

export function parseSummary(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return requiredText(value, 0, 4000, "Description must be 4000 characters or fewer.");
}

export function parseKind(value: unknown): ProductKindName {
  if (value === "code_asset" || value === "business_application") {
    return value;
  }
  throw invalid("Product type must be code_asset or business_application.");
}

export function parseCategoryId(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw invalid("Choose a category.");
  }
  return value.toLowerCase();
}

export function parseStacks(value: unknown): string[] | undefined {
  return parseCodes(value, 12, "Choose up to 12 technologies.");
}

export function parseTags(value: unknown): string[] | undefined {
  return parseCodes(value, 20, "Choose up to 20 tags.");
}

export function parseSlug(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string" || value.length > 120 || !SLUG.test(value)) {
    throw invalid("Slug uses lowercase letters, numbers, and hyphens.");
  }
  return value;
}

export function slugFromTitle(title: string, id: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${base.length > 0 ? base : "product"}-${id.replace(/-/g, "").slice(0, 8)}`;
}

export function missingProduct(): AuthFailure {
  return new AuthFailure(404, "not_found", "Product not found.");
}

function parseCodes(value: unknown, max: number, message: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > max) {
    throw invalid(message);
  }
  const codes = value.map((item) => {
    if (typeof item !== "string" || !CODE.test(item)) {
      throw invalid("Codes use lowercase letters, numbers, and hyphens.");
    }
    return item;
  });
  if (new Set(codes).size !== codes.length) {
    throw invalid("Codes must be unique.");
  }
  return codes;
}

function requiredText(value: unknown, min: number, max: number, message: string): string {
  if (typeof value !== "string") {
    throw invalid(message);
  }
  const text = value.trim();
  if (text.length < min || text.length > max || hasControl(text)) {
    throw invalid(message);
  }
  return text;
}

function hasControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}

function invalid(message: string): AuthFailure {
  return new AuthFailure(400, "validation_failed", message);
}
