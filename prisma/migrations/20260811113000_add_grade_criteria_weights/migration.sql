ALTER TABLE "SeminaryGradeConfiguration"
ADD COLUMN "criteriaWeights" JSONB NOT NULL DEFAULT '{"attendance":20,"coursework":40,"exam":40}';
