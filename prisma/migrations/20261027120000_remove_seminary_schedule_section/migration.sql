DROP INDEX IF EXISTS "SeminaryCourseSchedule_period_className_section_idx";
DROP INDEX IF EXISTS "SeminaryCourseSchedule_academicYear_className_section_idx";

ALTER TABLE "SeminaryCourseSchedule" DROP COLUMN IF EXISTS "section";

CREATE INDEX IF NOT EXISTS "SeminaryCourseSchedule_period_className_idx"
  ON "SeminaryCourseSchedule"("period", "className");
CREATE INDEX IF NOT EXISTS "SeminaryCourseSchedule_academicYear_className_idx"
  ON "SeminaryCourseSchedule"("academicYear", "className");
