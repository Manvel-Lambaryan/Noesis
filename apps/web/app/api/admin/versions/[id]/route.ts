import { proxy } from "../../../../../lib/bff";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const { id } = await context.params;
  return proxy(request, `/v1/admin/versions/${id}`, "GET");
}
