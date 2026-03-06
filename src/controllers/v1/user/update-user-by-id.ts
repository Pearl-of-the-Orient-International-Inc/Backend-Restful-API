import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateUserByIdSchema } from '@/validators/user';

export const updateUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const payload = req.body as UpdateUserByIdSchema;

    if (!userId || Array.isArray(userId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    if (payload.email && payload.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: payload.email.trim().toLowerCase() },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: 'Email address is already in use',
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
        email: payload.email?.trim().toLowerCase(),
        role: payload.role,
        position: payload.position,
        accountStatus: payload.accountStatus,
        avatar: payload.avatar === '' ? null : payload.avatar,
        isTwoFactorEnabled: payload.isTwoFactorEnabled,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        position: true,
        accountStatus: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    logger.error('Error while updating user account', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

