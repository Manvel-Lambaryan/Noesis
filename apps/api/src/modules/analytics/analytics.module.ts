import { Module } from "@nestjs/common";
import { AnalyticsRepository } from "./analytics.repository";

@Module({
  providers: [AnalyticsRepository],
})
export class AnalyticsModule {}
