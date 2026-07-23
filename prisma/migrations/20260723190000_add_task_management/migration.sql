CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "TaskBoard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "progress" TEXT NOT NULL DEFAULT '0/1',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "boardId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskItem_code_key" ON "TaskItem"("code");
CREATE INDEX "TaskBoard_sortOrder_idx" ON "TaskBoard"("sortOrder");
CREATE INDEX "TaskBoard_createdAt_idx" ON "TaskBoard"("createdAt");
CREATE INDEX "TaskItem_boardId_idx" ON "TaskItem"("boardId");
CREATE INDEX "TaskItem_assigneeId_idx" ON "TaskItem"("assigneeId");
CREATE INDEX "TaskItem_priority_idx" ON "TaskItem"("priority");
CREATE INDEX "TaskItem_sortOrder_idx" ON "TaskItem"("sortOrder");
CREATE INDEX "TaskItem_createdAt_idx" ON "TaskItem"("createdAt");

ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
