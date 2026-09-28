import { proxy } from "../../../../lib/bff";

export function GET(request: Request): Promise<Response> {
  return proxy(request, "/v1/auth/session", "GET");
}
