import { proxy } from "../../../../../../lib/bff";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return proxy(request, `/v1/seller/products/${id}/previews`, "POST");
}
