import { HTTPSTATUS } from '@/common/http-codes';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

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
      select: { member: { select: { userId: true } } },
    });

    if (!student?.member?.userId) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'This student does not have a linked portal account',
      });
      return;
    }

    await prisma.user.update({
      where: { id: student.member.userId },
      data: { password: await hashValue(password) },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Student password changed successfully',
    });
  } catch (err) {
    logger.error('Error while changing seminary student password', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to change student password',
    });
  }
};
