CREATE TYPE "SeminaryStudentStatus" AS ENUM ('ACTIVE', 'GRADUATING', 'LEAVE_OF_ABSENCE', 'INACTIVE');

CREATE TYPE "SeminaryEnrollmentType" AS ENUM ('REGULAR', 'TRANSFEREE', 'CROSS_ENROLLEE');

ALTER TABLE "SeminaryApplication"
ADD COLUMN "studentStatus" "SeminaryStudentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "enrollmentType" "SeminaryEnrollmentType" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN "yearLevel" TEXT;

