import type { Actor } from "../../auth/actor";

export type ModerationPort = {
  readonly module: "moderation";
};

export const moderationPort: ModerationPort = { module: "moderation" };

export type ModerationAccess = {
  queue(actor: Actor): Promise<{ items: unknown[] }>;
};

export const MODERATION_ACCESS = Symbol("MODERATION_ACCESS");
