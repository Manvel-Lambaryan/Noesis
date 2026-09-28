import { Module } from "@nestjs/common";
import { EntitlementsRepository } from "./entitlements.repository";

@Module({
  providers: [EntitlementsRepository],
})
export class EntitlementsModule {}
