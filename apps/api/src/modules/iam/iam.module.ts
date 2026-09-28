import { Module } from "@nestjs/common";
import { IamRepository } from "./iam.repository";

@Module({
  providers: [IamRepository],
})
export class IamModule {}
