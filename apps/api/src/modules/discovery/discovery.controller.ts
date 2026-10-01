import { Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { requirePermission } from "../../auth/authorization";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { DiscoveryService } from "./discovery.service";

@ApiTags("discovery")
@Controller("v1")
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get("discovery/listings")
  listings(@Query() query: Record<string, unknown>) {
    return this.discovery.search(oneValue(query));
  }

  @Get("listings/:slug")
  listing(@Param("slug") slug: string) {
    return this.discovery.getBySlug(slug);
  }

  @Get("listings/:slug/versions")
  versions(@Param("slug") slug: string) {
    return this.discovery.versions(slug);
  }

  @Post("admin/discovery/rebuild")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  rebuild(@Req() request: Request & { actor?: Actor }) {
    requirePermission(actorFrom(request), "moderation");
    return this.discovery.rebuild();
  }
}

function oneValue(query: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}
