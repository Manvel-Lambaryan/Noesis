import { Body, Controller, Get, Headers, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { bodyRecord } from "../../auth/body";
import { clientIp } from "../../auth/internal-token";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { PricingService } from "./pricing.service";

@ApiTags("seller")
@Controller("v1/seller")
@UseGuards(SessionGuard)
export class SellerOfferController {
  constructor(private readonly pricing: PricingService) {}

  @Get("products/:id/offers")
  list(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.pricing.list(actorFrom(request), id);
  }

  @Post("products/:id/offers")
  @HttpCode(201)
  create(
    @Req() request: Request & { actor?: Actor },
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-client-ip") ip: string | undefined,
  ) {
    return this.pricing.create(actorFrom(request), id, bodyRecord(body), clientIp(ip));
  }

  @Post("offers/:id/archive")
  @HttpCode(200)
  archive(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.pricing.archive(actorFrom(request), id);
  }
}
