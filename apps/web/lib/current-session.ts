import { cache } from "react";
import { cookies } from "next/headers";
import { apiFetch, isRecord } from "./api";
import { SESSION_COOKIE } from "./session-cookie";

export type AccountView = {
  email: string;
  givenName: string;
  familyName: string;
  roles: string[];
  permissions: string[];
  emailVerified: boolean;
  purchase: string;
  publish: string;
};

export function personName(givenName: string, familyName: string): string {
  return [givenName.trim(), familyName.trim()].filter((part) => part.length > 0).join(" ");
}

export const currentSession = cache(loadSession);

async function loadSession(): Promise<AccountView | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }
  try {
    const result = await apiFetch("/v1/auth/session", { method: "GET", sessionToken: token });
    if (result.status !== 200 || !isRecord(result.body)) {
      return null;
    }
    return {
      email: text(result.body.email),
      givenName: text(result.body.givenName),
      familyName: text(result.body.familyName),
      roles: stringList(result.body.roles),
      permissions: stringList(result.body.permissions),
      emailVerified: result.body.emailVerified === true,
      purchase: gateText(result.body.gates, "purchase"),
      publish: gateText(result.body.gates, "sellerPublish"),
    };
  } catch {
    return null;
  }
}

export const ownSellerProfile = cache(loadSellerProfile);

async function loadSellerProfile(): Promise<{ displayName: string; verificationState: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }
  try {
    const result = await apiFetch("/v1/seller/profile", { method: "GET", sessionToken: token });
    if (result.status !== 200 || !isRecord(result.body)) {
      return null;
    }
    return {
      displayName: text(result.body.displayName),
      verificationState: text(result.body.verificationState),
    };
  } catch {
    return null;
  }
}

function gateText(gates: unknown, name: string): string {
  if (!isRecord(gates) || !isRecord(gates[name])) {
    return "Unavailable";
  }
  const gate = gates[name];
  if (gate.allowed === true) {
    return "Allowed";
  }
  return typeof gate.reason === "string" ? gate.reason : "Not allowed";
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
