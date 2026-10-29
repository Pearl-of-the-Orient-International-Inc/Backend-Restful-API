import { SeminaryExaminationStatus, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { HTTPSTATUS } from '@/common/http-codes';
import { getSeminaryStudentLmsScope } from './lms-student-scope';

import type { Prisma } from '@/generated/prisma/client';
import type { Response } from 'express';

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

  if (user?.role === UserType.MEMBER) {
    const scope = await getSeminaryStudentLmsScope(userId);
    return {
      status: {
        in: [
          SeminaryExaminationStatus.SCHEDULED,
          SeminaryExaminationStatus.ONGOING,
          SeminaryExaminationStatus.COMPLETED,
        ],
      },
      courseId: { in: scope.courseIds },
    };
  }

  if (user?.role !== UserType.INSTRUCTOR) return {};

  return { instructorUserId: userId };
};

export const canManageExamination = async ({
  examinationId,
  userId,
  res,
}: {
  examinationId: string;
  userId: string | undefined;
  res: Response;
}) => {
  if (!userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return false;
  }

  const [user, examination] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.seminaryExamination.findUnique({
      where: { id: examinationId },
      select: { instructorUserId: true },
    }),
  ]);

  if (!examination) {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      code: 'NOT_FOUND',
      message: 'Examination not found',
    });
    return false;
  }

  if (!user || (user.role === UserType.INSTRUCTOR && examination.instructorUserId !== userId)) {
    res.status(HTTPSTATUS.FORBIDDEN).json({
      code: 'FORBIDDEN',
      message: 'You can manage only examinations assigned to you',
    });
    return false;
  }

  return true;
};
