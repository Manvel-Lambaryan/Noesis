import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { bodyRecord } from "../../auth/body";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { ModerationService } from "./moderation.service";

@ApiTags("admin")
@Controller("v1/admin")
@UseGuards(SessionGuard)
export class AdminModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get("versions/:id")
  detail(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.moderation.detail(actorFrom(request), id);
  }

  @Post("versions/:id/decisions")
  decide(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.moderation.decide(actorFrom(request), id, bodyRecord(body));
  }

  @Post("listings/:id/takedown")
  takedown(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.moderation.takedown(actorFrom(request), id, bodyRecord(body));
  }

  @Post("listings/:id/restore")
  restore(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.moderation.restore(actorFrom(request), id, bodyRecord(body));
  }
}

@ApiTags("seller")
@Controller("v1/seller")
@UseGuards(SessionGuard)
export class SellerModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get("products/:id/review")
  review(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.moderation.sellerReview(actorFrom(request), id);
  }

  @Post("listings/:id/appeals")
  @HttpCode(201)
  appeal(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.moderation.appeal(actorFrom(request), id, bodyRecord(body));
  }
}
