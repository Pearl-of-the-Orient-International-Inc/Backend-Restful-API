import { HTTPSTATUS } from '@/common/http-codes';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { createSeminaryStudentPortalAccount } from './student-portal-account';

import type { Request, Response } from 'express';
import type { ChangeSeminaryStudentPasswordBody } from './types';

export const changeSeminaryStudentPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.params.studentId);
    const { password } = req.body as ChangeSeminaryStudentPasswordBody;
    const student = await prisma.seminaryApplication.findUnique({
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

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: `No Seminary student record was found for student ID ${studentId}.`,
      });
      return;
    }

    const createdPortalAccount = !student.portalUserId;

    await prisma.$transaction(async (tx) => {
      const portalAccount = student.portalUserId
        ? { id: student.portalUserId }
        : await createSeminaryStudentPortalAccount(
            tx,
            {
              studentId: student.studentId ?? studentId,
              givenName: student.givenName,
              middleName: student.middleName,
              surname: student.surname,
            },
            password,
          );

      if (!student.portalUserId) {
        await tx.seminaryApplication.update({
          where: { id: student.id },
          data: { portalUserId: portalAccount.id },
        });
      } else {
        await tx.user.update({
          where: { id: portalAccount.id },
          data: { password: await hashValue(password) },
        });
      }
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: createdPortalAccount
        ? 'Student portal account created and password saved successfully.'
        : 'Student password changed successfully.',
    });
  } catch (err) {
    logger.error('Error while changing seminary student password', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to change student password',
    });
  }
};
