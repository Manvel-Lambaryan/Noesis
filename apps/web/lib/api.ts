const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:3001";

export type ApiResult = { status: number; body: unknown };

export async function apiFetch(
  path: string,
  init: { method: string; body?: unknown; sessionToken?: string; clientIp?: string },
): Promise<ApiResult> {
  const headers = new Headers({ "content-type": "application/json" });
  const internal = process.env.INTERNAL_BFF_TOKEN;
  if (internal !== undefined && internal.length > 0) {
    headers.set("x-internal-token", internal);
  }
  if (init.sessionToken !== undefined && init.sessionToken.length > 0) {
    headers.set("x-session-id", init.sessionToken);
  }
  if (init.clientIp !== undefined) {
    headers.set("x-client-ip", init.clientIp);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  return { status: response.status, body: text.length === 0 ? null : (JSON.parse(text) as unknown) };
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return /^[A-Za-z0-9.:]{1,64}$/.test(forwarded) ? forwarded : "local";
}

export function tokenFromCookieHeader(header: string | null): string | undefined {
  if (header === null) {
    return undefined;
  }
  const pair = header.split(";").map((part) => part.trim()).find((part) => part.startsWith("__Host-noesis_session="));
  if (pair === undefined) {
    return undefined;
  }
  const value = decodeURIComponent(pair.slice("__Host-noesis_session=".length));
  return value.length === 0 ? undefined : value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
