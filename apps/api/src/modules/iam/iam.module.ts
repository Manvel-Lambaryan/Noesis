import { Global, Module } from "@nestjs/common";
import { AuthRateLimit } from "../../infrastructure/identity/auth-rate-limit";
import { PrismaIamRepository } from "../../infrastructure/identity/prisma-iam.repository";
import { PrismaService } from "../../infrastructure/prisma.service";
import { RedisService } from "../../infrastructure/redis.service";
import { SessionGuard } from "../../auth/session.guard";
import { IamController } from "./iam.controller";
import { IAM_ACCESS } from "./iam.public-port";
import { IAM_REPOSITORY } from "./iam.repository";
import { IamService } from "./iam.service";

@Global()
@Module({
  controllers: [IamController],
  providers: [
    IamService,
    SessionGuard,
    { provide: IAM_ACCESS, useExisting: IamService },
    {
      provide: IAM_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaIamRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AuthRateLimit,
      useFactory: (redis: RedisService) => new AuthRateLimit(redis.client),
      inject: [RedisService],
    },
  ],
  exports: [IAM_ACCESS, SessionGuard],
})
export class IamModule {}
