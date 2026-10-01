export function rejectsCrossSite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (origin === null) {
    return false;
  }
  const host = request.headers.get("host");
  if (host === null) {
    return true;
  }
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
