/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { calculateExpirationDate, generateUniqueCode } from '@/lib/helpers';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { ResetPasswordSchema, ResetPasswordQuerySchema } from '@/validators/auth';
import { VerificationType } from '@/generated/prisma/enums';
import { sendMail } from '@/mailers';
import { forgotPasswordTemplate } from '@/mailers/templates/forgot-password';
import { hashValue } from '@/lib/password-hash';
import { resetPasswordSuccessTemplate } from '@/mailers/templates/reset-password';



export const resetPassword = async (
  req: Request<{}, any, ResetPasswordSchema, ResetPasswordQuerySchema>,
  res: Response,
): Promise<void> => {
  const { token } = req.query;
  const { password } = req.body;

  try {
    const now = new Date();

    const validCode = await prisma.verificationCode.findFirst({
      where: {
        code: token,
        type: VerificationType.PASSWORD_RESET,
        expiresAt: { gt: now },
      },
    });

    if (!validCode) {
      logger.warn('Invalid or expired verification code');
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired verification code',
      });
      return;
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await prisma.user.update({
      where: { id: validCode.userId },
      data: { password: hashedPassword },
    });

    await prisma.verificationCode.delete({
      where: { id: validCode.id },
    });

    await prisma.session.deleteMany({
      where: { userId: updatedUser.id },
    });

    await sendMail({
      sendTo: updatedUser.email,
      ...resetPasswordSuccessTemplate(updatedUser.name),
    });

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user reset password', err);
  }
};
