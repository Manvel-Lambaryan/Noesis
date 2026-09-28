import { Global, Module } from "@nestjs/common";
import { createLogger } from "@noesis/kernel";
import { API_LOGGER } from "../health/health.controller";
import { PrismaService } from "./prisma.service";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    PrismaService,
    RedisService,
    { provide: API_LOGGER, useFactory: () => createLogger("api") },
  ],
  exports: [PrismaService, RedisService, API_LOGGER],
})
export class InfrastructureModule {}
