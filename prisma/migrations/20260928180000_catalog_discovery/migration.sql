CREATE TYPE "catalog"."ProductKind" AS ENUM ('code_asset', 'business_application');
CREATE TYPE "catalog"."ListingState" AS ENUM ('draft', 'published', 'unpublished', 'taken_down', 'appeal_pending');

CREATE TABLE "catalog"."categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "catalog"."categories"("slug");
CREATE INDEX "categories_active_sort_order_idx" ON "catalog"."categories"("active", "sort_order");
ALTER TABLE "catalog"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stable identifiers. Later admin edits update these rows. They do not require a new migration.
INSERT INTO "catalog"."categories" ("id", "slug", "name", "sort_order", "active") VALUES
    ('a1000000-0000-4000-8000-000000000001', 'ui-components', 'UI Components', 10, true),
    ('a1000000-0000-4000-8000-000000000002', 'authentication', 'Authentication', 20, true),
    ('a1000000-0000-4000-8000-000000000003', 'dashboards', 'Dashboards', 30, true),
    ('a1000000-0000-4000-8000-000000000004', 'backend-modules', 'Backend Modules', 40, true),
    ('a1000000-0000-4000-8000-000000000005', 'api-integrations', 'API & Integrations', 50, true),
    ('a1000000-0000-4000-8000-000000000006', 'website-templates', 'Website Templates', 60, true),
    ('a1000000-0000-4000-8000-000000000007', 'e-commerce', 'E-commerce', 70, true),
    ('a1000000-0000-4000-8000-000000000008', 'business-applications', 'Business Applications', 80, true),
    ('a1000000-0000-4000-8000-000000000009', 'mobile-applications', 'Mobile Applications', 90, true),
    ('a1000000-0000-4000-8000-00000000000a', 'developer-tools', 'Developer Tools', 100, true);

-- seller_id has no foreign key. iam and catalog are different modules.
CREATE TABLE "catalog"."products" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(4000) NOT NULL DEFAULT '',
    "kind" "catalog"."ProductKind" NOT NULL,
    "category_id" UUID NOT NULL,
    "listing_state" "catalog"."ListingState" NOT NULL DEFAULT 'draft',
    "curated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_slug_key" ON "catalog"."products"("slug");
CREATE INDEX "products_seller_id_updated_at_idx" ON "catalog"."products"("seller_id", "updated_at");
ALTER TABLE "catalog"."products"
    ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "catalog"."product_stacks" (
    "product_id" UUID NOT NULL,
    "stack_code" VARCHAR(32) NOT NULL,
    CONSTRAINT "product_stacks_pkey" PRIMARY KEY ("product_id", "stack_code")
);

ALTER TABLE "catalog"."product_stacks"
    ADD CONSTRAINT "product_stacks_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog"."product_tags" (
    "product_id" UUID NOT NULL,
    "tag" VARCHAR(32) NOT NULL,
    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id", "tag")
);

ALTER TABLE "catalog"."product_tags"
    ADD CONSTRAINT "product_tags_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog"."preview_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "object_key" VARCHAR(200) NOT NULL,
    "content_type" VARCHAR(32) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preview_images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "preview_images_key_prefix" CHECK (
        "object_key" LIKE 'previews/%'
        AND "object_key" NOT LIKE '%quarantine%'
        AND "object_key" NOT LIKE '%..%'
    )
);

CREATE UNIQUE INDEX "preview_images_object_key_key" ON "catalog"."preview_images"("object_key");
CREATE INDEX "preview_images_product_id_idx" ON "catalog"."preview_images"("product_id");
ALTER TABLE "catalog"."preview_images"
    ADD CONSTRAINT "preview_images_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog"."preview_intents" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "content_type" VARCHAR(32) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preview_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "preview_intents_product_id_idx" ON "catalog"."preview_intents"("product_id");
ALTER TABLE "catalog"."preview_intents"
    ADD CONSTRAINT "preview_intents_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- mode "stack" on javascript is a technical default, not an owner decision.
CREATE TABLE "catalog"."discovery_views" (
    "view_id" VARCHAR(40) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mode" VARCHAR(40) NOT NULL,
    CONSTRAINT "discovery_views_pkey" PRIMARY KEY ("view_id")
);

INSERT INTO "catalog"."discovery_views" ("view_id", "label", "enabled", "mode") VALUES
    ('general', 'General marketplace', true, 'all'),
    ('javascript', 'JavaScript and TypeScript', true, 'stack'),
    ('business_apps', 'Business applications', true, 'kind');

-- No foreign key to products. discovery and catalog are different modules.
CREATE TABLE "catalog"."discovery_documents" (
    "product_id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" VARCHAR(4000) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "category_id" UUID NOT NULL,
    "category_slug" VARCHAR(80) NOT NULL,
    "category_name" VARCHAR(80) NOT NULL,
    "stacks" TEXT[] NOT NULL,
    "tags" TEXT[] NOT NULL,
    "preview_urls" TEXT[] NOT NULL,
    "listing_state" VARCHAR(40) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "discovery_documents_pkey" PRIMARY KEY ("product_id")
);

CREATE UNIQUE INDEX "discovery_documents_slug_key" ON "catalog"."discovery_documents"("slug");
CREATE INDEX "discovery_documents_listing_state_updated_at_idx" ON "catalog"."discovery_documents"("listing_state", "updated_at");
CREATE INDEX "discovery_documents_stacks_idx" ON "catalog"."discovery_documents" USING GIN ("stacks");

ALTER TABLE "catalog"."discovery_documents" ADD COLUMN "search_vector" tsvector;

CREATE FUNCTION "catalog"."discovery_documents_search_vector"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_vector := to_tsvector(
        'english',
        coalesce(NEW.title, '') || ' ' || coalesce(NEW.summary, '') || ' ' || coalesce(NEW.category_name, '') || ' ' ||
        coalesce(array_to_string(NEW.tags, ' '), '') || ' ' || coalesce(array_to_string(NEW.stacks, ' '), '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER "discovery_documents_search"
BEFORE INSERT OR UPDATE ON "catalog"."discovery_documents"
FOR EACH ROW EXECUTE FUNCTION "catalog"."discovery_documents_search_vector"();

CREATE INDEX "discovery_documents_search_idx" ON "catalog"."discovery_documents" USING GIN ("search_vector");
