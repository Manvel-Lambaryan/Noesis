import { Inject, Injectable } from "@nestjs/common";
import { AuthFailure } from "../../auth/auth-failure";
import { IAM_ACCESS, type IamAccess } from "../iam/iam.public-port";
import { parseDisplayName } from "../../auth/password-policy";
import type { SellerAccess, SellerProfileView } from "./seller.public-port";
import { SELLER_REPOSITORY, type SellerRepository } from "./seller.repository";

@Injectable()
export class SellerService implements SellerAccess {
  constructor(
    @Inject(SELLER_REPOSITORY) private readonly profiles: SellerRepository,
    @Inject(IAM_ACCESS) private readonly iam: IamAccess,
  ) {}

  async saveOwnDraft(userId: string, displayName: unknown): Promise<SellerProfileView> {
    const name = parseDisplayName(displayName);
    const profile = await this.profiles.upsertDraft(userId, name);
    await this.iam.assignSellerRole(userId);
    return profile;
  }

  async getOwnProfile(userId: string): Promise<SellerProfileView | null> {
    return this.profiles.findByUserId(userId);
  }
}

export function missingProfile(): AuthFailure {
  return new AuthFailure(404, "not_found", "Seller profile not found.");
}
