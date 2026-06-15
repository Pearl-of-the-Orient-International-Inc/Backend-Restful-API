ALTER TABLE "SeminaryApplication"
ADD COLUMN "studentId" TEXT;

CREATE UNIQUE INDEX "SeminaryApplication_studentId_key"
ON "SeminaryApplication"("studentId");
