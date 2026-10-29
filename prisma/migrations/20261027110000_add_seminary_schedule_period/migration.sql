ALTER TABLE "SeminaryCourseSchedule"
  ADD COLUMN "period" TEXT NOT NULL DEFAULT 'Unspecified period';

CREATE INDEX "SeminaryCourseSchedule_period_className_section_idx"
  ON "SeminaryCourseSchedule"("period", "className", "section");
