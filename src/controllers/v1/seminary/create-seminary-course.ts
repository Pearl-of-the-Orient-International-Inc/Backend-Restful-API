import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { SeminaryCourseStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { CreateSeminaryCourseBody } from './types';

const getCourseSummary = (subjects: CreateSeminaryCourseBody['subjects']) => ({
  units: subjects.reduce((total, subject) => total + subject.units, 0),
  modality: subjects[0].modality,
});

export const createSeminaryCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryCourseBody;
    const sortOrder =
      body.sortOrder ??
      ((await prisma.seminaryCourse.aggregate({
        _max: { sortOrder: true },
      }))._max.sortOrder ?? 0) + 1;
    const summary = getCourseSummary(body.subjects);

    const course = await prisma.seminaryCourse.create({
      data: {
        courseName: body.courseName,
        courseCode: body.courseCode,
        program: body.program,
        units: summary.units,
        modality: summary.modality,
        subjects: body.subjects,
        status: body.status ?? SeminaryCourseStatus.ACTIVE,
        sortOrder,
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary course created successfully',
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

    logger.error('Error while creating seminary course', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
