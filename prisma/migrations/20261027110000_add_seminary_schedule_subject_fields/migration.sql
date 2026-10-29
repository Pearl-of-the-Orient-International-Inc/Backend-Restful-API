ALTER TABLE "SeminaryCourseSchedule"
  ADD COLUMN "subjectName" TEXT NOT NULL DEFAULT 'Unspecified subject',
  ADD COLUMN "units" INTEGER NOT NULL DEFAULT 0;
