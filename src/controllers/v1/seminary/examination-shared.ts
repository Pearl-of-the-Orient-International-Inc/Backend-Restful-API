import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

import type { Prisma } from '@/generated/prisma/client';

export const toExaminationResponse = <
  T extends {
    durationMinutes: number;
    passingScore: number;
    questions: Prisma.JsonValue;
    totalPoints: number;
  },
>(
  examination: T,
) => ({
  ...examination,
  durationMinutes: String(examination.durationMinutes),
  passingScore: String(examination.passingScore),
  questions: Array.isArray(examination.questions) ? examination.questions : [],
  totalPoints: String(examination.totalPoints),
});

export const getExaminationWhereForUser = async (
  userId: string | undefined,
): Promise<Prisma.SeminaryExaminationWhereInput> => {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== UserType.INSTRUCTOR) return {};

  return { instructorUserId: userId };
};
