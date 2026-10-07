import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { WorkspaceService } from "./workspace.service";

@ApiTags("seller")
@Controller("v1/seller")
@UseGuards(SessionGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get("workspace")
  view(@Req() request: Request & { actor?: Actor }) {
    return this.workspace.view(actorFrom(request));
  }
}
