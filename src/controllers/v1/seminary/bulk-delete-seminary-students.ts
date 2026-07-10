import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { BulkDeleteSeminaryStudentsBody } from './types';

export const bulkDeleteSeminaryStudents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { studentIds } = req.body as BulkDeleteSeminaryStudentsBody;
    const uniqueStudentIds = Array.from(new Set(studentIds));

    const result = await prisma.seminaryApplication.deleteMany({
      where: {
        studentId: {
          in: uniqueStudentIds,
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: `${result.count} seminary students deleted successfully`,
      data: { count: result.count },
    });
  } catch (err) {
    logger.error('Error while bulk deleting seminary students', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
