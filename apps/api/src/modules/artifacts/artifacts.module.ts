import { Global, Module } from "@nestjs/common";
import { ArtifactsRepository } from "./artifacts.repository";
import { NoSellableVersions, SELLABILITY } from "./artifacts.public-port";

@Global()
@Module({
  providers: [ArtifactsRepository, { provide: SELLABILITY, useFactory: () => new NoSellableVersions() }],
  exports: [SELLABILITY],
})
export class ArtifactsModule {}