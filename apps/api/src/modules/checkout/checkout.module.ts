import { Module } from "@nestjs/common";
import { CheckoutRepository } from "./checkout.repository";

@Module({
  providers: [CheckoutRepository],
})
export class CheckoutModule {}
