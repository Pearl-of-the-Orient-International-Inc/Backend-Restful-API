import { HTTPSTATUS } from '@/common/http-codes';
import { UserPosition, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

import type { Response } from 'express';

export const ensureItAdmin = async (
  userId: string | undefined,
  res: Response,
): Promise<boolean> => {
  if (!userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      position: true,
    },
  });

  if (!user) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'User not found',
    });
    return false;
  }

  if (user.role !== UserType.ADMIN || user.position !== UserPosition.IT) {
    res.status(HTTPSTATUS.FORBIDDEN).json({
      code: 'FORBIDDEN',
      message: 'Only IT admins can perform this account action',
    });
    return false;
  }

  return true;
};
