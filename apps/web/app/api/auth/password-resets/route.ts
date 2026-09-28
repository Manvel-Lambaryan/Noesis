import { proxy } from "../../../../lib/bff";

export function POST(request: Request): Promise<Response> {
  return proxy(request, "/v1/auth/password-resets", "POST");
}
