ALTER TABLE "SeminaryInstructor"
  ADD COLUMN "teachingPrograms" "SeminaryProgramLevel"[] NOT NULL DEFAULT ARRAY[]::"SeminaryProgramLevel"[];

UPDATE "SeminaryInstructor"
SET "teachingPrograms" = ARRAY["teachingProgram"]::"SeminaryProgramLevel"[]
WHERE "teachingProgram" IS NOT NULL;

DROP INDEX IF EXISTS "SeminaryInstructor_teachingProgram_idx";

ALTER TABLE "SeminaryInstructor"
  DROP COLUMN IF EXISTS "teachingProgram";

CREATE INDEX "SeminaryInstructor_teachingPrograms_idx"
  ON "SeminaryInstructor"
  USING GIN ("teachingPrograms");
