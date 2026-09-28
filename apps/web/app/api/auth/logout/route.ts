import { NextResponse } from "next/server";
import { apiFetch, clientAddress, tokenFromCookieHeader } from "../../../../lib/api";
import { blocked } from "../../../../lib/bff";
import { sessionCookie } from "../../../../lib/session-cookie";

export async function POST(request: Request): Promise<Response> {
  const denied = blocked(request);
  if (denied !== null) {
    return denied;
  }
  await apiFetch("/v1/auth/logout", {
    method: "POST",
    clientIp: clientAddress(request),
    sessionToken: tokenFromCookieHeader(request.headers.get("cookie")),
  });
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(sessionCookie("", 0));
  return response;
}
