CREATE TYPE "identity"."UserState" AS ENUM ('active');
CREATE TYPE "identity"."RoleName" AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE "identity"."AdminPermissionName" AS ENUM ('moderation', 'finance');
CREATE TYPE "identity"."AuthTokenPurpose" AS ENUM ('email_verification', 'password_reset');
CREATE TYPE "identity"."SellerVerificationState" AS ENUM ('draft', 'verification_submitted', 'verification_approved', 'verification_rejected', 'suspended');

CREATE TABLE "identity"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "state" "identity"."UserState" NOT NULL DEFAULT 'active',
    "email_verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

CREATE TABLE "identity"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_hash_key" ON "identity"."sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "identity"."sessions"("user_id");
ALTER TABLE "identity"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "identity"."role_assignments" (
    "user_id" UUID NOT NULL,
    "role" "identity"."RoleName" NOT NULL,
    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("user_id", "role")
);

ALTER TABLE "identity"."role_assignments"
    ADD CONSTRAINT "role_assignments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "identity"."admin_permissions" (
    "user_id" UUID NOT NULL,
    "permission" "identity"."AdminPermissionName" NOT NULL,
    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("user_id", "permission")
);

ALTER TABLE "identity"."admin_permissions"
    ADD CONSTRAINT "admin_permissions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "identity"."auth_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "identity"."AuthTokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "identity"."auth_tokens"("token_hash");
CREATE INDEX "auth_tokens_user_id_purpose_idx" ON "identity"."auth_tokens"("user_id", "purpose");
ALTER TABLE "identity"."auth_tokens"
    ADD CONSTRAINT "auth_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "identity"."seller_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "verification_state" "identity"."SellerVerificationState" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "identity"."seller_profiles"("user_id");
