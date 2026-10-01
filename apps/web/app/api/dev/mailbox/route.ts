import { apiFetch } from "../../../../lib/api";
import { toResponse } from "../../../../lib/bff";

export async function GET(): Promise<Response> {
  return toResponse(await apiFetch("/v1/auth/mailbox", { method: "GET" }));
}
