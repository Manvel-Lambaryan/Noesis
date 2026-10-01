import { Module } from "@nestjs/common";
import { PaymentsRepository } from "./payments.repository";

@Module({
  providers: [PaymentsRepository],
})
export class PaymentsModule {}
