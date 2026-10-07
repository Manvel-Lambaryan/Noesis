import type { VerificationState } from "../../auth/actor";

export type SellerRecord = {
  id: string;
  userId: string;
  displayName: string;
  verificationState: VerificationState;
  createdAt: Date;
};

export interface SellerRepository {
  findByUserId(userId: string): Promise<SellerRecord | null>;
  upsertDraft(userId: string, displayName: string): Promise<SellerRecord>;
}

export const SELLER_REPOSITORY = Symbol("SELLER_REPOSITORY");
