CREATE TYPE "catalog"."OfferState" AS ENUM ('active', 'archived');

CREATE TABLE "catalog"."offers" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "license_code" VARCHAR(32),
    "license_text_id" UUID,
    "update_policy" VARCHAR(32),
    "demo_url" VARCHAR(500),
    "state" "catalog"."OfferState" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "offers_amount_positive" CHECK ("amount_minor" > 0),
    CONSTRAINT "offers_currency_shape" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "offers_update_policy" CHECK (
        "update_policy" IS NULL OR "update_policy" IN ('exact_version', 'major_line', 'all_future')
    ),
    CONSTRAINT "offers_license_code" CHECK (
        "license_code" IS NULL OR "license_code" ~ '^[a-z0-9](?:[a-z0-9-]{0,31})$'
    ),
    CONSTRAINT "offers_demo_url" CHECK (
        "demo_url" IS NULL OR "demo_url" ~ '^https?://[^[:space:]]+$'
    )
);

CREATE UNIQUE INDEX "offers_one_active" ON "catalog"."offers"("product_id") WHERE "state" = 'active';
CREATE INDEX "offers_product_id_created_at_idx" ON "catalog"."offers"("product_id", "created_at");
CREATE INDEX "offers_seller_id_state_idx" ON "catalog"."offers"("seller_id", "state");

CREATE TABLE "catalog"."pricing_outbox" (
    "id" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "subject_id" UUID NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(3),
    CONSTRAINT "pricing_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_outbox_subject_id_type_idx" ON "catalog"."pricing_outbox"("subject_id", "type");
