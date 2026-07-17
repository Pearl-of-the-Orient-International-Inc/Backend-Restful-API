CREATE TYPE "SeminarySchoolAffiliation" AS ENUM ('IN_HOUSE', 'PARTNER_SCHOOL');

ALTER TABLE "SeminaryApplication"
ADD COLUMN "schoolAffiliation" "SeminarySchoolAffiliation" NOT NULL DEFAULT 'IN_HOUSE';
