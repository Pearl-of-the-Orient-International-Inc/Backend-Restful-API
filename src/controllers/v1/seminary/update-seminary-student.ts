import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';
import { buildSeminaryStudentData } from './student-shared';

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
      select: { id: true },
    });

    if (!existingStudent) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary student not found',
      });
      return;
    }

    const student = await prisma.seminaryApplication.update({
      where: { studentId },
      data: buildSeminaryStudentData(body),
      include: seminaryApplicationInclude,
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

