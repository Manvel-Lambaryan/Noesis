-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "commerce";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ops";

-- CreateTable
CREATE TABLE "identity"."schema_anchor" (
    "id" TEXT NOT NULL DEFAULT 'identity',

    CONSTRAINT "schema_anchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."schema_anchor" (
    "id" TEXT NOT NULL DEFAULT 'catalog',

    CONSTRAINT "schema_anchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce"."schema_anchor" (
    "id" TEXT NOT NULL DEFAULT 'commerce',

    CONSTRAINT "schema_anchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops"."schema_anchor" (
    "id" TEXT NOT NULL DEFAULT 'ops',

    CONSTRAINT "schema_anchor_pkey" PRIMARY KEY ("id")
);
