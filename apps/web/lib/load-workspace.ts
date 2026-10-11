import { cache } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "./api";
import { SESSION_COOKIE } from "./session-cookie";
import { parseWorkspace, type WorkspaceView } from "./workspace-view";

export type WorkspaceLoad = { ok: true; view: WorkspaceView } | { ok: false; reason: "denied" | "unavailable" };

export const loadWorkspace = cache(readWorkspace);

async function readWorkspace(): Promise<WorkspaceLoad> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token.length === 0) return { ok: false, reason: "denied" };
  try {
    const result = await apiFetch("/v1/seller/workspace", { method: "GET", sessionToken: token });
    if (result.status === 403 || result.status === 401) return { ok: false, reason: "denied" };
    if (result.status !== 200) return { ok: false, reason: "unavailable" };
    const view = parseWorkspace(result.body);
    return view === null ? { ok: false, reason: "unavailable" } : { ok: true, view };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
