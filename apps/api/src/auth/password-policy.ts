import { AuthFailure } from "./auth-failure";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw invalid("Enter a valid email address.");
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw invalid("Enter a valid email address.");
  }
  return email;
}

export function parsePassword(value: unknown, email: string): string {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    throw invalid("Use a password between 12 and 128 characters.");
  }
  if (value.toLowerCase() === email) {
    throw invalid("Use a password that is not your email address.");
  }
  return value;
}

export function parseDisplayName(value: unknown): string {
  if (typeof value !== "string") {
    throw invalid("Enter a display name.");
  }
  const name = value.trim();
  if (name.length < 2 || name.length > 80 || hasControlCharacter(name)) {
    throw invalid("Use a display name between 2 and 80 characters.");
  }
  return name;
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function invalid(message: string): AuthFailure {
  return new AuthFailure(400, "validation_failed", message);
}
