import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryAssignmentStatus,
  SeminaryExaminationStatus,
  SeminaryStudyMaterialStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentStudentPortal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });
    const student = member
      ? await prisma.seminaryApplication.findFirst({
          where: { memberId: member.id, studentId: { not: null } },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'No active student record is linked to this account',
      });
      return;
    }

    const [grades, materials, assignments, examinations] = await Promise.all([
      prisma.seminaryGradeRecord.findMany({
        where: { studentApplicationId: student.id },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.seminaryStudyMaterial.findMany({
        where: { status: SeminaryStudyMaterialStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.seminaryAssignment.findMany({
        where: { status: SeminaryAssignmentStatus.PUBLISHED },
        orderBy: { dueAt: 'asc' },
      }),
      prisma.seminaryExamination.findMany({
        where: {
          status: {
            in: [
              SeminaryExaminationStatus.SCHEDULED,
              SeminaryExaminationStatus.ONGOING,
              SeminaryExaminationStatus.COMPLETED,
            ],
          },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Student portal retrieved successfully',
      data: { student, grades, materials, assignments, examinations },
    });
  } catch (err) {
    logger.error('Error while retrieving current student portal', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve student portal',
    });
  }
};
