import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';
import { buildSeminaryStudentData } from './student-shared';
import { getSeminaryStudentName } from './student-portal-account';

import type { Request, Response } from 'express';
import type { UpdateSeminaryStudentBody } from './types';

export const updateSeminaryStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateSeminaryStudentBody;
    const studentId = String(req.params.studentId);
    const existingStudent = await prisma.seminaryApplication.findUnique({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        portalUserId: true,
        givenName: true,
        middleName: true,
        surname: true,
      },
    });

    if (!existingStudent) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary student not found',
      });
      return;
    }

    const studentData = buildSeminaryStudentData(body);
    const student = await prisma.$transaction(async (tx) => {
      const updated = await tx.seminaryApplication.update({
        where: { studentId },
        data: studentData,
        include: seminaryApplicationInclude,
      });

      if (existingStudent.portalUserId && existingStudent.studentId) {
        await tx.user.update({
          where: { id: existingStudent.portalUserId },
          data: {
            name: getSeminaryStudentName({
              studentId: existingStudent.studentId,
              givenName: studentData.givenName ?? existingStudent.givenName,
              middleName: studentData.middleName ?? existingStudent.middleName,
              surname: studentData.surname ?? existingStudent.surname,
            }),
          },
        });
      }

      return updated;
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary student updated successfully',
      data: student,
    });
  } catch (err) {
    logger.error('Error while updating seminary student', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

