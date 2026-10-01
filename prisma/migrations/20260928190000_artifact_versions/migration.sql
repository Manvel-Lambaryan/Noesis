CREATE TYPE "catalog"."VersionState" AS ENUM (
    'draft',
    'upload_pending',
    'quarantined',
    'scanning',
    'scan_rejected',
    'pending_moderation',
    'approved',
    'rejected',
    'withdrawn'
);

-- product_id has no foreign key. catalog and artifacts are different modules.
CREATE TABLE "catalog"."product_versions" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "version_label" VARCHAR(40) NOT NULL,
    "state" "catalog"."VersionState" NOT NULL DEFAULT 'draft',
    "byte_size" BIGINT,
    "sha256" VARCHAR(64),
    "quarantine_key" VARCHAR(240),
    "private_key" VARCHAR(240),
    "reason_code" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_versions_product_id_version_label_key" ON "catalog"."product_versions"("product_id", "version_label");
CREATE INDEX "product_versions_seller_id_state_idx" ON "catalog"."product_versions"("seller_id", "state");

CREATE TABLE "catalog"."upload_intents" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "content_type" VARCHAR(40) NOT NULL,
    "byte_size" BIGINT NOT NULL,
    "object_key" VARCHAR(240) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upload_intents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "upload_intents_key_prefix" CHECK (
        "object_key" LIKE 'quarantine/%'
        AND "object_key" NOT LIKE '%..%'
        AND "object_key" NOT LIKE '%previews/%'
    )
);

CREATE UNIQUE INDEX "upload_intents_token_hash_key" ON "catalog"."upload_intents"("token_hash");
CREATE INDEX "upload_intents_version_id_idx" ON "catalog"."upload_intents"("version_id");
ALTER TABLE "catalog"."upload_intents"
    ADD CONSTRAINT "upload_intents_version_id_fkey"
    FOREIGN KEY ("version_id") REFERENCES "catalog"."product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog"."scan_reports" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "verdict" VARCHAR(16) NOT NULL,
    "reason_code" VARCHAR(80) NOT NULL,
    "engine" VARCHAR(40) NOT NULL,
    "scanned_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "scan_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scan_reports_version_id_key" ON "catalog"."scan_reports"("version_id");
