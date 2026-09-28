import { Module } from "@nestjs/common";
import { ArtifactsRepository } from "./artifacts.repository";

@Module({
  providers: [ArtifactsRepository],
})
export class ArtifactsModule {}
