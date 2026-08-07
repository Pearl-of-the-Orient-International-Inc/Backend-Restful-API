import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { resetPasswordSuccessTemplate } from '@/mailers/templates/reset-password';
import { ensureItAdmin } from './user-admin-guards';

import type { Request, Response } from 'express';
import type { ChangeUserPasswordByAdminSchema } from '@/validators/user';

export const changeUserPasswordByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const canAccess = await ensureItAdmin(req.userId, res);
    if (!canAccess) return;

    const userId = req.params.userId;
    const { password } = req.body as ChangeUserPasswordByAdminSchema;

    if (!userId || Array.isArray(userId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: UserType.ADMIN },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Admin account not found',
      });
      return;
    }

    const hashedPassword = await hashValue(password);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    const emailResult = await sendMail({
      sendTo: user.email,
      ...resetPasswordSuccessTemplate(user.name),
    });

    if (!emailResult.success) {
      logger.warn('Account password changed but notification email failed', {
        userId: user.id,
        email: user.email,
      });
    }

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    logger.error('Error while changing account password by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
