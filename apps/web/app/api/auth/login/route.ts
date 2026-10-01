import { NextResponse } from "next/server";
import { apiFetch, clientAddress, isRecord } from "../../../../lib/api";
import { actorBody, blocked, readJson, toResponse } from "../../../../lib/bff";
import { maxAgeSeconds, sessionCookie } from "../../../../lib/session-cookie";

export async function POST(request: Request): Promise<Response> {
  const denied = blocked(request);
  if (denied !== null) {
    return denied;
  }
  const result = await apiFetch("/v1/auth/login", {
    method: "POST",
    body: await readJson(request),
    clientIp: clientAddress(request),
  });
  if (result.status !== 200 || !isRecord(result.body) || typeof result.body.sessionToken !== "string") {
    return toResponse(result);
  }
  const expiresAt = typeof result.body.expiresAt === "string" ? result.body.expiresAt : "";
  const response = NextResponse.json(actorBody(result.body));
  response.cookies.set(sessionCookie(result.body.sessionToken, maxAgeSeconds(expiresAt)));
  return response;
}
