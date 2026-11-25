import { HTTPSTATUS } from '@/common/http-codes';
import { UserPosition, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { NextFunction, Request, Response } from 'express';

/** Attendance is academic staff data: only instructors and the Registrar may alter it. */
export const authorizeSeminaryAttendanceManager = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, position: true },
    });
    const canManage = user?.role === UserType.INSTRUCTOR || (
      user?.role === UserType.ADMIN && user.position === UserPosition.REGISTRAR
    );

    if (!canManage) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Only instructors and the Registrar can manage attendance',
      });
      return;
    }
    next();
  } catch (err) {
    logger.error('Error authorizing seminary attendance manager', { err, userId: req.userId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
