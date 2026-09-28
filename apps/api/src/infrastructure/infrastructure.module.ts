import { tmpdir } from "node:os";
import path from "node:path";
import { Global, Module } from "@nestjs/common";
import { createLogger } from "@noesis/kernel";
import { API_LOGGER } from "../health/health.controller";
import { PrismaService } from "./prisma.service";
import { RedisService } from "./redis.service";
import { LocalPublicStorage, PUBLIC_STORAGE } from "./storage/local-public-storage";
import { MediaController } from "./storage/media.controller";

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    PrismaService,
    RedisService,
    { provide: API_LOGGER, useFactory: () => createLogger("api") },
    {
      provide: PUBLIC_STORAGE,
      useFactory: () => new LocalPublicStorage(process.env.PREVIEW_STORAGE_DIR ?? path.join(tmpdir(), "noesis-previews")),
    },
  ],
  exports: [PrismaService, RedisService, API_LOGGER, PUBLIC_STORAGE],
})
export class InfrastructureModule {}
