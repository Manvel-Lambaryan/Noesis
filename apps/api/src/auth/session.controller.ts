import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "./actor";
import { sessionView } from "./authorization";
import { actorFrom, SessionGuard } from "./session.guard";
import { SELLER_ACCESS, type SellerAccess } from "../modules/seller/seller.public-port";

@ApiTags("auth")
@Controller("v1/auth")
@UseGuards(SessionGuard)
export class SessionController {
  constructor(@Inject(SELLER_ACCESS) private readonly sellers: SellerAccess) {}

  @Get("session")
  async session(@Req() request: Request & { actor?: Actor }) {
    const actor = actorFrom(request);
    const profile = await this.sellers.getOwnProfile(actor.userId);
    return sessionView(actor, profile?.verificationState ?? null);
  }
}
