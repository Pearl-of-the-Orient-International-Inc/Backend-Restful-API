/**
 * Custom Modules
 */
import { logger } from '@/lib/winston';
import { prisma } from '@/lib/prisma';
import { HTTPSTATUS } from '@/common/http-codes';
import { VerificationEmailSchema } from '@/validators/auth';
import { VerificationType } from '@/generated/prisma/enums';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { code } = req.body as VerificationEmailSchema;

    // Input validation
    if (!code) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Code is required',
      });
      return;
    }

    const validCode = await prisma.verificationCode.findFirst({
      where: {
        code,
        type: VerificationType.EMAIL_VERIFICATION,
      },
    });

    if (!validCode) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Verification link is invalid. Please request a new verification email.',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: validCode.userId },
      data: { isEmailVerified: true },
    });

    await prisma.verificationCode.delete({
      where: { id: validCode.id },
    });

    // Add welcome email notification after successful email verification

    // const baseUrl =
    //   `${config.APP_URL}/dashboard` || 'http://localhost:3000/dashboard';
    // const emailResult = await sendMail({
    //   sendTo: updatedUser.email,
    //   ...adminWelcomeNotificationTemplate(
    //     updatedUser.name,
    //     updatedUser.admin?.position || '',
    //     formatLocalTimestamp(updatedUser.createdAt),
    //     baseUrl,
    //   ),
    // });

    // if (!emailResult.success) {
    //   logger.warn(
    //     'Welcome notification failed to send, but user was verified',
    //     {
    //       userId: updatedUser.id,
    //       email: updatedUser.email,
    //     },
    //   );
    // }

    const { password: _password, ...userWithoutPassword } = updatedUser;

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account verified successfully',
      user: userWithoutPassword,
    });
  } catch (err) {
    logger.error('Error during account verification', { error: err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
