export const SESSION_COOKIE = "__Host-noesis_session";

export type SessionCookie = {
  name: string;
  value: string;
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export function sessionCookie(token: string, maxAgeSeconds: number): SessionCookie {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function maxAgeSeconds(expiresAt: string, now = Date.now()): number {
  const seconds = Math.floor((Date.parse(expiresAt) - now) / 1000);
  return seconds > 0 ? seconds : 0;
}
