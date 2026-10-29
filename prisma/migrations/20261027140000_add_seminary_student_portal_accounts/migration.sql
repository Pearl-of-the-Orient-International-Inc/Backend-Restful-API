ALTER TABLE "SeminaryApplication" ADD COLUMN "portalUserId" TEXT;

CREATE UNIQUE INDEX "SeminaryApplication_portalUserId_key"
  ON "SeminaryApplication"("portalUserId");

CREATE INDEX "SeminaryApplication_portalUserId_idx"
  ON "SeminaryApplication"("portalUserId");

ALTER TABLE "SeminaryApplication"
  ADD CONSTRAINT "SeminaryApplication_portalUserId_fkey"
  FOREIGN KEY ("portalUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
