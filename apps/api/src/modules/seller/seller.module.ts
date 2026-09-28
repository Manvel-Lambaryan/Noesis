import { Global, Module } from "@nestjs/common";
import { PrismaSellerRepository } from "../../infrastructure/identity/prisma-seller.repository";
import { PrismaService } from "../../infrastructure/prisma.service";
import { SellerController } from "./seller.controller";
import { SELLER_ACCESS } from "./seller.public-port";
import { SELLER_REPOSITORY } from "./seller.repository";
import { SellerService } from "./seller.service";

@Global()
@Module({
  controllers: [SellerController],
  providers: [
    SellerService,
    { provide: SELLER_ACCESS, useExisting: SellerService },
    {
      provide: SELLER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSellerRepository(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [SELLER_ACCESS],
})
export class SellerModule {}
