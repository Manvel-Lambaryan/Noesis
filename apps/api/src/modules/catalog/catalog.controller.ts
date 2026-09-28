import { Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { Actor } from "../../auth/actor";
import { bodyRecord } from "../../auth/body";
import { clientIp } from "../../auth/internal-token";
import { actorFrom, SessionGuard } from "../../auth/session.guard";
import { resolveCorrelationId } from "../../logging/correlation-id";
import { CatalogPreviewService } from "./catalog-preview.service";
import type { ProductRecord } from "./catalog.repository";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller("v1")
export class CategoryController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }
}

@ApiTags("seller")
@Controller("v1/seller/products")
@UseGuards(SessionGuard)
export class SellerProductController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly previews: CatalogPreviewService,
  ) {}

  @Get()
  async list(@Req() request: Request & { actor?: Actor }) {
    const products = await this.catalog.listOwn(actorFrom(request));
    return { products: products.map(present) };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Req() request: Request & { actor?: Actor },
    @Body() body: unknown,
    @Headers("x-client-ip") ip: string | undefined,
    @Headers("x-correlation-id") correlationId: string | undefined,
  ) {
    const product = await this.catalog.create(actorFrom(request), bodyRecord(body), clientIp(ip), resolveCorrelationId(correlationId));
    return present(product);
  }

  @Get(":id")
  async getOne(@Req() request: Request & { actor?: Actor }, @Param("id") id: string) {
    return present(await this.catalog.getOwn(actorFrom(request), id));
  }

  @Patch(":id")
  async update(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return present(await this.catalog.update(actorFrom(request), id, bodyRecord(body)));
  }

  @Post(":id/preview-intents")
  @HttpCode(201)
  intent(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.previews.createIntent(actorFrom(request), id, bodyRecord(body));
  }

  @Post(":id/previews")
  @HttpCode(201)
  storePreview(@Req() request: Request & { actor?: Actor }, @Param("id") id: string, @Body() body: unknown) {
    return this.previews.store(actorFrom(request), id, bodyRecord(body));
  }
}

function present(product: ProductRecord) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    summary: product.summary,
    kind: product.kind,
    categoryId: product.categoryId,
    listingState: product.listingState,
    stacks: product.stacks,
    tags: product.tags,
    previews: product.previews,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
