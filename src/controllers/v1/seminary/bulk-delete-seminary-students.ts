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

    const students = await prisma.seminaryApplication.findMany({
      where: { studentId: { in: uniqueStudentIds } },
      select: { id: true, portalUserId: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.seminaryApplication.deleteMany({
        where: { id: { in: students.map((student) => student.id) } },
      });
      const portalUserIds = students.flatMap((student) =>
        student.portalUserId ? [student.portalUserId] : [],
      );
      if (portalUserIds.length) {
        await tx.user.deleteMany({ where: { id: { in: portalUserIds } } });
      }
      return deleted;
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
