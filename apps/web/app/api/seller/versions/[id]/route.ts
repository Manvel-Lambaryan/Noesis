import { proxy } from "../../../../../lib/bff";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return proxy(request, `/v1/seller/versions/${id}`, "GET");
}
