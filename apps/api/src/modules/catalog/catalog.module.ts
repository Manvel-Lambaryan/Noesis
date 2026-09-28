import { Global, Module } from "@nestjs/common";
import { ProductRateLimit } from "../../infrastructure/catalog/product-rate-limit";
import { PrismaCatalogRepository } from "../../infrastructure/catalog/prisma-catalog.repository";
import { PrismaService } from "../../infrastructure/prisma.service";
import { RedisService } from "../../infrastructure/redis.service";
import { CatalogPreviewService } from "./catalog-preview.service";
import { CategoryController, SellerProductController } from "./catalog.controller";
import { CATALOG_ACCESS } from "./catalog.public-port";
import { CATALOG_REPOSITORY } from "./catalog.repository";
import { CatalogService } from "./catalog.service";

@Global()
@Module({
  controllers: [CategoryController, SellerProductController],
  providers: [
    CatalogService,
    CatalogPreviewService,
    { provide: CATALOG_ACCESS, useExisting: CatalogService },
    {
      provide: CATALOG_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaCatalogRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ProductRateLimit,
      useFactory: (redis: RedisService) => new ProductRateLimit(redis.client),
      inject: [RedisService],
    },
  ],
  exports: [CATALOG_ACCESS],
})
export class CatalogModule {}
