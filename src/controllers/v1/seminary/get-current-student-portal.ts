import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryAssignmentStatus,
  SeminaryExaminationStatus,
  SeminaryStudyMaterialStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getSeminaryStudentLmsScope } from './lms-student-scope';

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

    const student = await prisma.seminaryApplication.findFirst({
      where: {
        studentId: { not: null },
        OR: [
          { portalUserId: req.userId },
          { member: { userId: req.userId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'No active student record is linked to this account',
      });
      return;
    }

    const lmsScope = await getSeminaryStudentLmsScope(req.userId);
    const [grades, materials, assignments, examinations] = await Promise.all([
      prisma.seminaryGradeRecord.findMany({
        where: { studentApplicationId: student.id },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.seminaryStudyMaterial.findMany({
        where: {
          status: SeminaryStudyMaterialStatus.PUBLISHED,
          subject: { in: lmsScope.subjectNames },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.seminaryAssignment.findMany({
        where: {
          status: SeminaryAssignmentStatus.PUBLISHED,
          courseId: { in: lmsScope.courseIds },
        },
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
          courseId: { in: lmsScope.courseIds },
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
