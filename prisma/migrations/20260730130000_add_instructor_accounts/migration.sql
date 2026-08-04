ALTER TYPE "UserType" ADD VALUE IF NOT EXISTS 'INSTRUCTOR';

ALTER TABLE "SeminaryInstructor"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "SeminaryInstructor_userId_key"
  ON "SeminaryInstructor"("userId");

CREATE INDEX IF NOT EXISTS "SeminaryInstructor_userId_idx"
  ON "SeminaryInstructor"("userId");

ALTER TABLE "SeminaryInstructor"
  ADD CONSTRAINT "SeminaryInstructor_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
