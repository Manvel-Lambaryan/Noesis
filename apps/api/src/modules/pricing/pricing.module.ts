import { Global, Module } from "@nestjs/common";
import { OfferRateLimit } from "../../infrastructure/pricing/offer-rate-limit";
import { OfferStore } from "../../infrastructure/pricing/offer-store";
import { PrismaService } from "../../infrastructure/prisma.service";
import { RedisService } from "../../infrastructure/redis.service";
import { PRICING_ACCESS } from "./pricing.public-port";
import { SellerOfferController } from "./pricing.controller";
import { PricingService } from "./pricing.service";

@Global()
@Module({
  controllers: [SellerOfferController],
  providers: [
    PricingService,
    { provide: PRICING_ACCESS, useExisting: PricingService },
    { provide: OfferStore, useFactory: (prisma: PrismaService) => new OfferStore(prisma), inject: [PrismaService] },
    { provide: OfferRateLimit, useFactory: (redis: RedisService) => new OfferRateLimit(redis.client), inject: [RedisService] },
  ],
  exports: [PRICING_ACCESS],
})
export class PricingModule {}
