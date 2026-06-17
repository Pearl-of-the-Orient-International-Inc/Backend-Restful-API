import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { hashValue } from '@/lib/password-hash';
import { logger } from '@/lib/winston';
import { ensureItAdmin } from './member-admin-guards';

import type { Request, Response } from 'express';
import type { changeMemberPasswordByAdminSchema } from '@/validators/member';
import type { z } from 'zod';

type ChangeMemberPasswordBody = z.infer<
  typeof changeMemberPasswordByAdminSchema
>['body'];

export const changeMemberPasswordByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    if (!(await ensureItAdmin(req.userId, res))) {
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const { password } = req.body as ChangeMemberPasswordBody;
    const hashedPassword = await hashValue(password);

    await prisma.user.update({
      where: { id: member.userId },
      data: { password: hashedPassword },
    });

    logger.info('Member password changed by IT admin', {
      memberId,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member password changed successfully',
    });
  } catch (err) {
    logger.error('Error while changing member password by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
