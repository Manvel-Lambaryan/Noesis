import { Body, Controller, Get, HttpCode, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { bodyRecord } from "../../auth/body";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { missingProfile } from "./seller.service";
import { SellerService } from "./seller.service";

@ApiTags("seller")
@Controller("v1/seller")
@UseGuards(SessionGuard)
export class SellerController {
  constructor(private readonly sellers: SellerService) {}

  @Get("profile")
  async getProfile(@Req() request: Request & { actor?: Actor }) {
    const profile = await this.sellers.getOwnProfile(actorFrom(request).userId);
    if (profile === null) {
      throw missingProfile();
    }
    return publicProfile(profile);
  }

  @Put("profile")
  @HttpCode(200)
  async saveProfile(@Req() request: Request & { actor?: Actor }, @Body() body: unknown) {
    const payload = bodyRecord(body);
    const profile = await this.sellers.saveOwnDraft(actorFrom(request).userId, payload.displayName);
    return publicProfile(profile);
  }
}

function publicProfile(profile: { id: string; displayName: string; verificationState: string }) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    verificationState: profile.verificationState,
  };
}
