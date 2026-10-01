import { AuthFailure } from "../../auth/auth-failure";

export const PREVIEW_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type PreviewType = (typeof PREVIEW_TYPES)[number];

const KEY = /^previews\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;

export function previewMaxBytes(): number {
  const raw = process.env.PREVIEW_MAX_BYTES;
  const parsed = raw === undefined || raw.length === 0 ? 2_097_152 : Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5_242_880) {
    return 2_097_152;
  }
  return parsed;
}

export function parsePreviewDeclaration(contentType: unknown, byteSize: unknown): { contentType: PreviewType; byteSize: number } {
  if (!isPreviewType(contentType)) {
    throw invalid("Preview images must be PNG, JPEG, or WebP.");
  }
  if (typeof byteSize !== "number" || !Number.isInteger(byteSize) || byteSize < 1 || byteSize > previewMaxBytes()) {
    throw invalid("Preview image is empty or too large.");
  }
  return { contentType, byteSize };
}

export function decodePreview(dataBase64: unknown, expectedSize: number, contentType: PreviewType): Buffer {
  if (typeof dataBase64 !== "string" || dataBase64.length === 0 || dataBase64.length > previewMaxBytes() * 2) {
    throw invalid("Preview image is empty or too large.");
  }
  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.length !== expectedSize || !magicMatches(bytes, contentType)) {
    throw invalid("Preview image content does not match the upload intent.");
  }
  return bytes;
}

export function extensionFor(contentType: PreviewType): "png" | "jpg" | "webp" {
  if (contentType === "image/png") {
    return "png";
  }
  return contentType === "image/jpeg" ? "jpg" : "webp";
}

export function previewObjectKey(sellerId: string, productId: string, imageId: string, extension: string): string {
  const key = `previews/${sellerId}/${productId}/${imageId}.${extension}`;
  if (!isPreviewKey(key)) {
    throw invalid("Preview storage path is not allowed.");
  }
  return key;
}

export function isPreviewKey(key: string): boolean {
  return KEY.test(key) && !key.includes("quarantine") && !key.includes("..");
}

function isPreviewType(value: unknown): value is PreviewType {
  return typeof value === "string" && PREVIEW_TYPES.some((item) => item === value);
}

function magicMatches(bytes: Buffer, contentType: PreviewType): boolean {
  if (contentType === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

function invalid(message: string): AuthFailure {
  return new AuthFailure(400, "validation_failed", message);
}
