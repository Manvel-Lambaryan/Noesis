CREATE TABLE "catalog"."artifact_outbox" (
    "id" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "subject_id" UUID NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(3),
    CONSTRAINT "artifact_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "artifact_outbox_subject_id_type_idx" ON "catalog"."artifact_outbox"("subject_id", "type");

CREATE TABLE "catalog"."catalog_outbox" (
    "id" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "subject_id" UUID NOT NULL,
    "payload" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(3),
    CONSTRAINT "catalog_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_outbox_subject_id_type_idx" ON "catalog"."catalog_outbox"("subject_id", "type");

ALTER TABLE "catalog"."product_versions"
    ADD CONSTRAINT "product_versions_private_key_shape" CHECK (
        "private_key" IS NULL
        OR (
            "private_key" LIKE 'private/%'
            AND "private_key" NOT LIKE '%..%'
            AND "private_key" NOT LIKE '%quarantine%'
            AND "private_key" NOT LIKE '%previews%'
        )
    );

CREATE TABLE "ops"."moderation_decisions" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "subject_type" VARCHAR(40) NOT NULL,
    "subject_id" UUID NOT NULL,
    "note" VARCHAR(500) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moderation_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moderation_decisions_subject_idx" ON "ops"."moderation_decisions"("subject_type", "subject_id", "created_at");

CREATE TABLE "ops"."appeals" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "state" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(3),
    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appeals_one_open" ON "ops"."appeals"("product_id") WHERE "state" = 'open';
CREATE INDEX "appeals_product_id_state_idx" ON "ops"."appeals"("product_id", "state");

CREATE TABLE "ops"."audit_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "subject_type" VARCHAR(40) NOT NULL,
    "subject_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_subject_idx" ON "ops"."audit_events"("subject_type", "subject_id");
