import type { INestApplication } from "@nestjs/common";
import { createApp } from "../create-app";

export const INTERNAL_TOKEN = "test-internal-token";

export type ApiResult = {
  status: number;
  body: unknown;
};

export async function startAuthApp(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  process.env.INTERNAL_BFF_TOKEN = INTERNAL_TOKEN;
  process.env.EMAIL_PROVIDER = "capture";
  process.env.APP_PUBLIC_URL = "http://localhost:3000";
  const app: INestApplication = await createApp();
  await app.listen(0);
  const address = app.getHttpServer().address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return { baseUrl: `http://127.0.0.1:${port}`, close: () => app.close() };
}

export async function api(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<ApiResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-internal-token": INTERNAL_TOKEN,
      "x-client-ip": "203.0.113.10",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text.length === 0 ? null : JSON.parse(text) as unknown };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function tokenFromMailbox(body: unknown, purpose: string): string {
  if (!isRecord(body) || !Array.isArray(body.messages)) {
    return "";
  }
  const message = [...body.messages].reverse().find((item) => isRecord(item) && item.purpose === purpose);
  if (!isRecord(message) || typeof message.url !== "string") {
    return "";
  }
  return new URL(message.url).searchParams.get("token") ?? "";
}
