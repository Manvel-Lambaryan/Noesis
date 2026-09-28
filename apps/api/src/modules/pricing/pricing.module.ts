import { Module } from "@nestjs/common";
import { PricingRepository } from "./pricing.repository";

@Module({
  providers: [PricingRepository],
})
export class PricingModule {}
