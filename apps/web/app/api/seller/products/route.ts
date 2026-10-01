import { proxy } from "../../../../lib/bff";

export async function GET(request: Request): Promise<Response> {
  return proxy(request, "/v1/seller/products", "GET");
}

export async function POST(request: Request): Promise<Response> {
  return proxy(request, "/v1/seller/products", "POST");
}
