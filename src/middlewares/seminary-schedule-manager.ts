import { HTTPSTATUS } from '@/common/http-codes';
import { UserPosition, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { NextFunction, Request, Response } from 'express';

/**
 * Timetables are maintained only by the seminary Registrar or the system's
 * super administrator (the existing ADMIN/IT account). Instructors and
 * students deliberately never receive write access to this resource.
 */
export const authorizeSeminaryScheduleManager = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, position: true },
    });

    const canManage =
      user?.role === UserType.ADMIN &&
      (user.position === UserPosition.REGISTRAR || user.position === UserPosition.IT);

    if (!canManage) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Only the Super Administrator or Registrar can manage course schedules',
      });
      return;
    }

    next();
  } catch (err) {
    logger.error('Error authorizing seminary schedule manager', { err, userId: req.userId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
