import { Controller, Get, HttpCode, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { AuthFailure } from "../../auth/auth-failure";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { IAM_ACCESS, type IamAccess } from "../iam/iam.public-port";

@ApiTags("admin")
@Controller("v1/admin")
@UseGuards(SessionGuard)
export class AdminController {
  constructor(@Inject(IAM_ACCESS) private readonly iam: IamAccess) {}

  @Get("moderation/queue")
  queue(@Req() request: Request & { actor?: Actor }): { items: [] } {
    this.iam.requireModeration(actorFrom(request));
    return { items: [] };
  }

  @Post("payouts/:id/hold")
  @HttpCode(501)
  hold(@Req() request: Request & { actor?: Actor }, @Param("id") _id: string): never {
    this.iam.requireFinance(actorFrom(request));
    throw new AuthFailure(501, "not_available", "Payout controls are not implemented in this slice.");
  }
}
