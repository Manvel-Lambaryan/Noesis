import { cookies } from "next/headers";
import { apiFetch, isRecord } from "./api";
import { SESSION_COOKIE } from "./session-cookie";

export type AccountView = {
  email: string;
  roles: string[];
  emailVerified: boolean;
  purchase: string;
  publish: string;
};

export async function currentSession(): Promise<AccountView | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }
  const result = await apiFetch("/v1/auth/session", { method: "GET", sessionToken: token });
  if (result.status !== 200 || !isRecord(result.body)) {
    return null;
  }
  return {
    email: text(result.body.email),
    roles: stringList(result.body.roles),
    emailVerified: result.body.emailVerified === true,
    purchase: gateText(result.body.gates, "purchase"),
    publish: gateText(result.body.gates, "sellerPublish"),
  };
}

export async function ownSellerProfile(): Promise<{ displayName: string; verificationState: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) {
    return null;
  }
  const result = await apiFetch("/v1/seller/profile", { method: "GET", sessionToken: token });
  if (result.status !== 200 || !isRecord(result.body)) {
    return null;
  }
  return {
    displayName: text(result.body.displayName),
    verificationState: text(result.body.verificationState),
  };
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
