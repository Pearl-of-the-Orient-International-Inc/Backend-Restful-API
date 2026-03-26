import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { hashValue } from '@/lib/password-hash';
import { sendMail } from '@/mailers';
import { welcomeUserTemplate } from '@/mailers/templates/welcome-user';

import type { Request, Response } from 'express';
import type { CreateUserAccountSchema } from '@/validators/user';

export const createUserAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      position,
      accountStatus,
      avatar,
      isTwoFactorEnabled,
    } = req.body as CreateUserAccountSchema;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
      });
      return;
    }

    const hashedPassword = await hashValue(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role ?? UserType.ADMIN,
        position,
        accountStatus,
        avatar: avatar || null,
        isTwoFactorEnabled,
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

    const emailResult = await sendMail({
      sendTo: user.email,
      ...welcomeUserTemplate(user.name, user.email, password),
    });

    if (!emailResult.success) {
      logger.warn('Account created but welcome email failed to send', {
        userId: user.id,
        email: user.email,
      });
    }

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Account created successfully',
      user,
    });
  } catch (err) {
    logger.error('Error while creating user account', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
