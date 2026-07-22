import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { SeminaryCourseStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryCourseBody } from './types';

export const updateSeminaryCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryCourseBody;

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
      data: {
        courseName: body.courseName,
        courseCode: body.courseCode,
        program: body.program,
        units: body.units,
        modality: body.modality,
        status: body.status ?? SeminaryCourseStatus.ACTIVE,
        ...(body.sortOrder === undefined ? {} : { sortOrder: body.sortOrder }),
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary course updated successfully',
      data: course,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Course code already exists',
      });
      return;
    }

    logger.error('Error while updating seminary course', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
