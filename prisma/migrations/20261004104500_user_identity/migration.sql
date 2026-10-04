ALTER TABLE "identity"."users" ADD COLUMN "given_name" VARCHAR(40);
ALTER TABLE "identity"."users" ADD COLUMN "family_name" VARCHAR(40);
ALTER TABLE "identity"."users" ADD COLUMN "phone" VARCHAR(20);

CREATE UNIQUE INDEX "users_phone_key" ON "identity"."users"("phone");
