import { NextResponse } from "next/server";
import { apiFetch, clientAddress } from "../../../../lib/api";
import { blocked, readJson, toResponse } from "../../../../lib/bff";
import { JOINED_COOKIE, onboardingCookieOptions } from "../../../../lib/onboarding";

const JOINED_MAX_AGE = 60 * 60;

export async function POST(request: Request): Promise<Response> {
  const denied = blocked(request);
  if (denied !== null) {
    return denied;
  }
  const result = await apiFetch("/v1/auth/register", {
    method: "POST",
    body: await readJson(request),
    clientIp: clientAddress(request),
  });
  if (result.status !== 201) {
    return toResponse(result);
  }
  const response = NextResponse.json(result.body, { status: 201 });
  response.cookies.set(JOINED_COOKIE, "1", { ...onboardingCookieOptions(), maxAge: JOINED_MAX_AGE });
  return response;
}
