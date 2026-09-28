import { proxy } from "../../../../lib/bff";

export function GET(request: Request): Promise<Response> {
  return proxy(request, "/v1/seller/profile", "GET");
}

export function PUT(request: Request): Promise<Response> {
  return proxy(request, "/v1/seller/profile", "PUT");
}
