ALTER TYPE "VerificationType" ADD VALUE 'INSTRUCTOR_INVITATION';

ALTER TABLE "SeminaryInstructor"
ADD COLUMN "inviteTokenSentAt" TIMESTAMP(3),
ADD COLUMN "inviteAcceptedAt" TIMESTAMP(3);
