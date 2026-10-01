import type { SellerRecord } from "./seller.repository";

export type SellerProfileView = SellerRecord;

export interface SellerAccess {
  saveOwnDraft(userId: string, displayName: unknown): Promise<SellerProfileView>;
  getOwnProfile(userId: string): Promise<SellerProfileView | null>;
}

export const SELLER_ACCESS = Symbol("SELLER_ACCESS");
