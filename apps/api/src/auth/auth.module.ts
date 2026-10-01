import { Module } from "@nestjs/common";
import { IamModule } from "../modules/iam/iam.module";
import { SellerModule } from "../modules/seller/seller.module";
import { SessionController } from "./session.controller";

@Module({
  imports: [IamModule, SellerModule],
  controllers: [SessionController],
})
export class AuthModule {}
