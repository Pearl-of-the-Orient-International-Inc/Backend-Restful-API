/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';

export const updateCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, email, avatar } = req.body; // All are optionals

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Check if email is being updated and if it already exists
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: 'Email address is already in use',
        });
        return;
      }
    }

    const updateUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        email,
        avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      user: updateUser,
    });
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while getting current user', err);
  }
};
