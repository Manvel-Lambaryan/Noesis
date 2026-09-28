import { Module } from "@nestjs/common";
import { SellerRepository } from "./seller.repository";

@Module({
  providers: [SellerRepository],
})
export class SellerModule {}
