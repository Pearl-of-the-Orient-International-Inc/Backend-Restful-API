import { HTTPSTATUS } from '@/common/http-codes';
import { UserAccountStatus, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';

/** Public-safe staff directory. Deliberately excludes email and all account details. */
export const getPublicAdministrationStaff = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: UserType.ADMIN,
        accountStatus: UserAccountStatus.ACTIVE,
        position: { not: null },
      },
      select: { id: true, name: true, avatar: true, position: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public administration staff retrieved successfully',
      data: staff,
    });
  } catch (err) {
    logger.error('Error while getting public administration staff', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve administration staff',
    });
  }
};
