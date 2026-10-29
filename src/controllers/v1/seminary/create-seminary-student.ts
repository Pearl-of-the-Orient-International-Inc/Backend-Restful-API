import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';
import {
  buildNextStudentId,
  buildSeminaryStudentData,
} from './student-shared';
import { createSeminaryStudentPortalAccount } from './student-portal-account';
import { ensureSeminaryFeeCollectionAccount } from './fee-collection-account';

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
      const studentData = buildSeminaryStudentData(body);
      const portalAccount = await createSeminaryStudentPortalAccount(tx, {
        studentId,
        givenName: studentData.givenName,
        middleName: studentData.middleName,
        surname: studentData.surname,
      });

      const createdStudent = await tx.seminaryApplication.create({
        data: {
          ...studentData,
          studentId,
          portalUserId: portalAccount.id,
        },
        include: seminaryApplicationInclude,
      });

      if (createdStudent.studentId && createdStudent.programLevel) {
        await ensureSeminaryFeeCollectionAccount(tx, {
          studentId: createdStudent.studentId,
          givenName: createdStudent.givenName,
          middleName: createdStudent.middleName,
          surname: createdStudent.surname,
          programCourse: createdStudent.programCourse,
          programLevel: createdStudent.programLevel,
        });
      }

      return createdStudent;
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary student created successfully. The student can sign in with their student number and the default password Student123@.',
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

