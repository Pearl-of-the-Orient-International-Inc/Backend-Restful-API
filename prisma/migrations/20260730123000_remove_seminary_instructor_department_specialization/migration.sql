DROP INDEX IF EXISTS "SeminaryInstructor_department_idx";

ALTER TABLE "SeminaryInstructor"
  DROP COLUMN IF EXISTS "department",
  DROP COLUMN IF EXISTS "specialization";
