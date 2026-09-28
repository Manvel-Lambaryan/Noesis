import { Global, Module } from "@nestjs/common";
import { ModerationStore } from "../../infrastructure/moderation/moderation-store";
import { ArtifactQueue } from "../../infrastructure/queue/artifact-queue";
import { PrismaService } from "../../infrastructure/prisma.service";
import { AdminModerationController, SellerModerationController } from "./moderation.controller";
import { MODERATION_ACCESS } from "./moderation.public-port";
import { ModerationService } from "./moderation.service";

@Global()
@Module({
  controllers: [AdminModerationController, SellerModerationController],
  providers: [
    ModerationService,
    ArtifactQueue,
    { provide: MODERATION_ACCESS, useExisting: ModerationService },
    { provide: ModerationStore, useFactory: (prisma: PrismaService) => new ModerationStore(prisma), inject: [PrismaService] },
  ],
  exports: [MODERATION_ACCESS],
})
export class ModerationModule {}
