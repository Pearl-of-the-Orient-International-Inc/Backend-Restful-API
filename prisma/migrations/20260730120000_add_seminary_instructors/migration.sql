CREATE TYPE "SeminaryInstructorStatus" AS ENUM (
  'ACTIVE',
  'PART_TIME',
  'ON_LEAVE',
  'INACTIVE'
);

CREATE TYPE "SeminaryInstructorRank" AS ENUM (
  'ADJUNCT_INSTRUCTOR',
  'LECTURER',
  'ASSISTANT_PROFESSOR',
  'ASSOCIATE_PROFESSOR',
  'PROFESSOR'
);

CREATE TABLE "SeminaryInstructor" (
  "id" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "professionalTitle" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "contactNumber" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "specialization" TEXT NOT NULL,
  "teachingProgram" "SeminaryProgramLevel" NOT NULL,
  "rank" "SeminaryInstructorRank" NOT NULL,
  "status" "SeminaryInstructorStatus" NOT NULL DEFAULT 'ACTIVE',
  "loadUnits" INTEGER NOT NULL DEFAULT 0,
  "biography" TEXT NOT NULL,
  "educationalBackground" TEXT NOT NULL,
  "areasOfExpertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "credentials" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "formalPhotoUrl" TEXT NOT NULL,
  "isFilipinoCitizen" BOOLEAN NOT NULL DEFAULT true,
  "highSchoolGraduateOrEquivalent" BOOLEAN NOT NULL DEFAULT true,
  "ministerialExperienceYears" INTEGER NOT NULL,
  "submissionDeadline" TIMESTAMP(3) NOT NULL,
  "attendanceParticipation" DOUBLE PRECISION NOT NULL,
  "leadershipCharacter" DOUBLE PRECISION NOT NULL,
  "ministryCommunityEngagement" DOUBLE PRECISION NOT NULL,
  "knowledgeSkillsAssessment" DOUBLE PRECISION NOT NULL,
  "professionalConductEthics" DOUBLE PRECISION NOT NULL,
  "totalScore" DOUBLE PRECISION NOT NULL,
  "rating" TEXT NOT NULL,
  "rankingClassification" TEXT NOT NULL,
  "award" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryInstructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeminaryInstructor_facultyId_key" ON "SeminaryInstructor"("facultyId");
CREATE UNIQUE INDEX "SeminaryInstructor_email_key" ON "SeminaryInstructor"("email");
CREATE INDEX "SeminaryInstructor_facultyId_idx" ON "SeminaryInstructor"("facultyId");
CREATE INDEX "SeminaryInstructor_name_idx" ON "SeminaryInstructor"("name");
CREATE INDEX "SeminaryInstructor_email_idx" ON "SeminaryInstructor"("email");
CREATE INDEX "SeminaryInstructor_department_idx" ON "SeminaryInstructor"("department");
CREATE INDEX "SeminaryInstructor_teachingProgram_idx" ON "SeminaryInstructor"("teachingProgram");
CREATE INDEX "SeminaryInstructor_status_idx" ON "SeminaryInstructor"("status");
CREATE INDEX "SeminaryInstructor_createdAt_idx" ON "SeminaryInstructor"("createdAt");
