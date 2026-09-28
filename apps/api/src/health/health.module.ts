import { Module } from "@nestjs/common";
import { createLogger } from "@noesis/kernel";
import { PrismaService } from "../infrastructure/prisma.service";
import { RedisService } from "../infrastructure/redis.service";
import { API_LOGGER, HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    PrismaService,
    RedisService,
    { provide: API_LOGGER, useFactory: () => createLogger("api") },
  ],
})
export class HealthModule {}
