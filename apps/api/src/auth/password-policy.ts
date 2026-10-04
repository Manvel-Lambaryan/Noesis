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
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw invalid("Use a password between 8 and 128 characters.");
  }
  if (value.toLowerCase() === email) {
    throw invalid("Use a password that is not your email address.");
  }
  return value;
}

const PERSON_NAME = /^[\p{L}][\p{L}'’ -]{1,39}$/u;

export function assertConfirmed(password: string, confirmation: unknown): void {
  if (typeof confirmation !== "string" || confirmation !== password) {
    throw invalid("Passwords do not match.");
  }
}

export function parsePersonName(value: unknown, kind: "first" | "last"): string {
  const label = kind === "first" ? "first name" : "last name";
  if (typeof value !== "string") {
    throw invalid(`Enter your ${label}.`);
  }
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40 || hasControlCharacter(name) || !PERSON_NAME.test(name)) {
    throw invalid(`Use a ${label} of 2 to 40 letters.`);
  }
  return name;
}

export function parsePhone(value: unknown, dial: unknown): string {
  if (typeof dial !== "string" || !/^\d{1,4}$/.test(dial)) {
    throw invalid("Choose a country for your phone number.");
  }
  if (typeof value !== "string") {
    throw invalid("Enter a phone number.");
  }
  const national = value.trim().replace(/[\s().-]/g, "").replace(/^0/, "");
  if (!/^\d{4,14}$/.test(national)) {
    throw invalid("Enter the phone number without the country code.");
  }
  if (dial.length + national.length < 8 || dial.length + national.length > 15) {
    throw invalid("Enter a phone number with 8 to 15 digits.");
  }
  return `+${dial}${national}`;
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
