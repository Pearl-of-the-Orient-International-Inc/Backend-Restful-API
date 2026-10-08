ALTER TABLE "SeminaryGradeRecord"
  ADD COLUMN IF NOT EXISTS "characterEarned" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "characterTotal" DOUBLE PRECISION;

ALTER TABLE "SeminaryGradeConfiguration"
  ALTER COLUMN "criteriaWeights" SET DEFAULT '{"attendance":20,"coursework":25,"character":30,"exam":25}'::jsonb;

UPDATE "SeminaryGradeConfiguration"
SET "criteriaWeights" = '{"attendance":20,"coursework":25,"character":30,"exam":25}'::jsonb
WHERE "id" = 'default';
