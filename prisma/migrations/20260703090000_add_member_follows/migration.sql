CREATE TABLE "MemberFollow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemberFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberFollow_userId_memberId_key" ON "MemberFollow"("userId", "memberId");
CREATE INDEX "MemberFollow_userId_idx" ON "MemberFollow"("userId");
CREATE INDEX "MemberFollow_memberId_idx" ON "MemberFollow"("memberId");

ALTER TABLE "MemberFollow"
ADD CONSTRAINT "MemberFollow_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberFollow"
ADD CONSTRAINT "MemberFollow_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
