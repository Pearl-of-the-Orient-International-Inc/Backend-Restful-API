import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';
import {
  buildNextStudentId,
  buildSeminaryStudentData,
} from './student-shared';

import type { Request, Response } from 'express';
import type { CreateSeminaryStudentBody } from './types';

export const createSeminaryStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryStudentBody;
    const student = await prisma.$transaction(async (tx) => {
      const studentId = await buildNextStudentId(tx);

      return tx.seminaryApplication.create({
        data: {
          ...buildSeminaryStudentData(body),
          studentId,
        },
        include: seminaryApplicationInclude,
      });
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary student created successfully',
      data: student,
    });
  } catch (err) {
    logger.error('Error while creating seminary student', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

