import { Module } from "@nestjs/common";
import { DiscoveryRepository } from "./discovery.repository";

@Module({
  providers: [DiscoveryRepository],
})
export class DiscoveryModule {}
