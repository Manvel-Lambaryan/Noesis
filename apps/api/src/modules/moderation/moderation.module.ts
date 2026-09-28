import { Module } from "@nestjs/common";
import { ModerationRepository } from "./moderation.repository";

@Module({
  providers: [ModerationRepository],
})
export class ModerationModule {}
