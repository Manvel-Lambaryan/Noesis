import { Body, Controller, Get, Headers, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { bodyRecord } from "../../auth/body";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { resolveCorrelationId } from "../../logging/correlation-id";
import { ArtifactsService } from "./artifacts.service";

@ApiTags("seller")
@Controller("v1/seller")
@UseGuards(SessionGuard)
export class SellerArtifactController {
  constructor(private readonly artifacts: ArtifactsService) {}

  @Post("products/:id/versions")
  @HttpCode(201)
  create(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.artifacts.createVersion(actorFrom(request), id, bodyRecord(body));
  }

  @Get("products/:id/versions")
  list(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.artifacts.listVersions(actorFrom(request), id);
  }

  @Get("versions/:id")
  getOne(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return this.artifacts.getVersion(actorFrom(request), id);
  }

  @Post("versions/:id/upload-intents")
  @HttpCode(201)
  intent(
    @Req() request: Request & { actor?: Actor },
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId: string | undefined,
  ) {
    return this.artifacts.createIntent(actorFrom(request), id, bodyRecord(body), resolveCorrelationId(correlationId));
  }

  @Post("versions/:id/complete-upload")
  @HttpCode(202)
  complete(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.artifacts.completeUpload(actorFrom(request), id, bodyRecord(body));
  }
}
