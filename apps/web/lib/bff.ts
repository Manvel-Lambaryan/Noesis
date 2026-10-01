import { NextResponse } from "next/server";
import { apiFetch, clientAddress, isRecord, tokenFromCookieHeader, type ApiResult } from "./api";
import { rejectsCrossSite } from "./csrf";

export function blocked(request: Request): Response | null {
  if (!rejectsCrossSite(request)) {
    return null;
  }
  return NextResponse.json({ code: "forbidden", message: "Cross-site request blocked." }, { status: 403 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function proxy(
  request: Request,
  path: string,
  method: string,
): Promise<Response> {
  const denied = blocked(request);
  if (denied !== null) {
    return denied;
  }
  const result = await apiFetch(path, {
    method,
    body: method === "GET" ? undefined : await readJson(request),
    clientIp: clientAddress(request),
    sessionToken: tokenFromCookieHeader(request.headers.get("cookie")),
  });
  return toResponse(result);
}

export function toResponse(result: ApiResult): Response {
  if (result.body === null) {
    return new NextResponse(null, { status: result.status });
  }
  return NextResponse.json(result.body, { status: result.status });
}

export function actorBody(body: unknown): { actor: unknown } {
  return { actor: isRecord(body) && "actor" in body ? body.actor : null };
}
