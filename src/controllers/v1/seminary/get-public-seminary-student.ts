import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryApplicationStatus,
  SeminaryStudentStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

/**
 * Public, privacy-safe record used by a student-ID QR code. Keep this select
 * intentionally small: it must never expose the student's contact details,
 * address, application documents, or payment information.
 */
export const getPublicSeminaryStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.params.studentId);
    const student = await prisma.seminaryApplication.findFirst({
      where: {
        studentId,
        status: {
          in: [
            SeminaryApplicationStatus.APPROVED,
            SeminaryApplicationStatus.ENROLLED,
          ],
        },
        studentStatus: {
          in: [
            SeminaryStudentStatus.ACTIVE,
            SeminaryStudentStatus.GRADUATING,
          ],
        },
      },
      select: {
        studentId: true,
        surname: true,
        givenName: true,
        middleName: true,
        programLevel: true,
        programCourse: true,
        academicYear: true,
        yearLevel: true,
        studentStatus: true,
        enrollmentType: true,
        schoolAffiliation: true,
      },
    });

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Active seminary student not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public seminary student profile retrieved successfully',
      data: student,
    });
  } catch (err) {
    logger.error('Error while getting public seminary student', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
