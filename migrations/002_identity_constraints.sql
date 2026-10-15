-- One external identity must never belong to multiple local accounts.
CREATE UNIQUE INDEX account_provider_identity_unique ON "account" ("providerId", "accountId");
ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'member';
