import { Controller, Get, Headers, Inject, Res, ServiceUnavailableException } from "@nestjs/common";
import { ApiHeader, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type { Logger } from "@noesis/kernel";
import { resolveCorrelationId } from "../logging/correlation-id";
import { HealthService, type HealthReport } from "./health.service";

export const API_LOGGER = Symbol("API_LOGGER");

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthService,
    @Inject(API_LOGGER) private readonly logger: Logger,
  ) {}

  @Get()
  @ApiHeader({ name: "x-correlation-id", required: false })
  @ApiOkResponse({ description: "API, PostgreSQL, and Redis are reachable" })
  async getHealth(
    @Headers("x-correlation-id") incoming: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthReport> {
    const correlationId = resolveCorrelationId(incoming);
    response.setHeader("x-correlation-id", correlationId);
    const report = await this.health.check();
    this.logger.info({ message: "health", correlationId, status: report.status });
    if (report.status !== "ok") {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
