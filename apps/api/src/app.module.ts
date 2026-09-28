import { Module } from "@nestjs/common";
import { AdminModule } from "./modules/admin/admin.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { ArtifactsModule } from "./modules/artifacts/artifacts.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { EntitlementsModule } from "./modules/entitlements/entitlements.module";
import { IamModule } from "./modules/iam/iam.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SellerModule } from "./modules/seller/seller.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    HealthModule,
    IamModule,
    SellerModule,
    CatalogModule,
    ArtifactsModule,
    DiscoveryModule,
    PricingModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    EntitlementsModule,
    ReviewsModule,
    ModerationModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
