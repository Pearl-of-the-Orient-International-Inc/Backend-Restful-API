import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryCourseStatusBody } from './types';

export const updateSeminaryCourseStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryCourseStatusBody;

    const existingCourse = await prisma.seminaryCourse.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCourse) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary course not found',
      });
      return;
    }

    const course = await prisma.seminaryCourse.update({
      where: { id },
      data: { status: body.status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary course status updated successfully',
      data: course,
    });
  } catch (err) {
    logger.error('Error while updating seminary course status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
