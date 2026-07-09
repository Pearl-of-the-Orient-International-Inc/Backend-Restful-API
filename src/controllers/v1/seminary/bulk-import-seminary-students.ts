import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildNextStudentId,
  buildSeminaryStudentData,
} from './student-shared';

import type { Request, Response } from 'express';
import type { BulkImportSeminaryStudentsBody } from './types';

export const bulkImportSeminaryStudents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as BulkImportSeminaryStudentsBody;

    const students = await prisma.$transaction(async (tx) => {
      const imported = [];

      for (const row of body.students) {
        const studentId = row.studentId?.trim() || (await buildNextStudentId(tx));
        const data = buildSeminaryStudentData(row);
        const student = row.studentId?.trim()
          ? await tx.seminaryApplication.upsert({
              where: {
                studentId,
              },
              create: {
                ...data,
                studentId,
              },
              update: data,
            })
          : await tx.seminaryApplication.create({
              data: {
                ...data,
                studentId,
              },
            });

        imported.push(student);
      }

      return imported;
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: `${students.length} seminary students imported successfully`,
      data: students,
    });
  } catch (err) {
    logger.error('Error while bulk importing seminary students', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
