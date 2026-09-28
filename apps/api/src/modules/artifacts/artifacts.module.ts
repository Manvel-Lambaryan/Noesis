import { Global, Module } from "@nestjs/common";
import { ArtifactRateLimit } from "../../infrastructure/artifacts/artifact-rate-limit";
import { PrismaArtifactsRepository } from "../../infrastructure/artifacts/prisma-artifacts.repository";
import { ArtifactQueue } from "../../infrastructure/queue/artifact-queue";
import { PrismaService } from "../../infrastructure/prisma.service";
import { RedisService } from "../../infrastructure/redis.service";
import { NoSellableVersions, SELLABILITY } from "./artifacts.public-port";
import { ARTIFACTS_REPOSITORY } from "./artifacts.repository";
import { ArtifactsService } from "./artifacts.service";
import { SellerArtifactController } from "./artifacts.controller";
import { QuarantineUploadController } from "./upload.controller";

@Global()
@Module({
  controllers: [SellerArtifactController, QuarantineUploadController],
  providers: [
    ArtifactsService,
    ArtifactQueue,
    { provide: SELLABILITY, useFactory: () => new NoSellableVersions() },
    {
      provide: ARTIFACTS_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaArtifactsRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ArtifactRateLimit,
      useFactory: (redis: RedisService) => new ArtifactRateLimit(redis.client),
      inject: [RedisService],
    },
  ],
  exports: [SELLABILITY],
})
export class ArtifactsModule {}
