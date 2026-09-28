import { proxy } from "../../../../../lib/bff";

export async function GET(request: Request): Promise<Response> {
  return proxy(request, "/v1/admin/moderation/queue", "GET");
}
