import { Global, Module } from "@nestjs/common";
import { PrismaDiscoveryRepository } from "../../infrastructure/discovery/prisma-discovery.repository";
import { PrismaService } from "../../infrastructure/prisma.service";
import { DiscoveryController } from "./discovery.controller";
import { DISCOVERY_ACCESS } from "./discovery.public-port";
import { DISCOVERY_REPOSITORY } from "./discovery.repository";
import { DiscoveryService } from "./discovery.service";

@Global()
@Module({
  controllers: [DiscoveryController],
  providers: [
    DiscoveryService,
    { provide: DISCOVERY_ACCESS, useExisting: DiscoveryService },
    {
      provide: DISCOVERY_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaDiscoveryRepository(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [DISCOVERY_ACCESS],
})
export class DiscoveryModule {}
