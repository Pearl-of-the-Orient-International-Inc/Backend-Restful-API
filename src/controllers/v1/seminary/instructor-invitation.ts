import { HTTPSTATUS } from '@/common/http-codes';
import { VerificationType } from '@/generated/prisma/enums';
import { calculateExpirationDate, generateUniqueCode } from '@/lib/helpers';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { buildInstructorInvitationUrl } from '@/lib/verification-redirect';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { seminaryInstructorAccountTemplate } from '@/mailers/templates/seminary-instructor-account';

import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { AcceptSeminaryInstructorInviteBody } from './types';
import { toInstructorResponse } from './instructor-shared';

const INVITE_EXPIRES_IN = '30d';

type InstructorInviteRecord = {
  email: string;
  facultyId: string;
  id: string;
  inviteAcceptedAt?: Date | null;
  name: string;
  userId: string | null;
};

export const sendInstructorInvitation = async (
  instructor: InstructorInviteRecord,
): Promise<boolean> => {
  if (!instructor.userId) {
    throw new Error('Instructor has no portal user account.');
  }

  const existingInviteCode = await prisma.verificationCode.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      type: VerificationType.INSTRUCTOR_INVITATION,
      userId: instructor.userId,
    },
  });

  const verificationCode =
    existingInviteCode ??
    (await prisma.verificationCode.upsert({
      where: { userId: instructor.userId },
      update: {
        code: generateUniqueCode(),
        expiresAt: calculateExpirationDate(INVITE_EXPIRES_IN),
        type: VerificationType.INSTRUCTOR_INVITATION,
      },
      create: {
        code: generateUniqueCode(),
        expiresAt: calculateExpirationDate(INVITE_EXPIRES_IN),
        type: VerificationType.INSTRUCTOR_INVITATION,
        userId: instructor.userId,
      },
    }));

  await prisma.seminaryInstructor.update({
    where: { id: instructor.id },
    data: { inviteAcceptedAt: null, inviteTokenSentAt: new Date() },
  });

  const emailResult = await sendMail({
    sendTo: instructor.email,
    ...seminaryInstructorAccountTemplate({
      instructorId: instructor.facultyId,
      invitationUrl: buildInstructorInvitationUrl(verificationCode.code),
      name: instructor.name,
    }),
  });

  if (!emailResult.success) {
    logger.warn('Instructor invitation email failed to send', {
      email: instructor.email,
      instructorId: instructor.facultyId,
    });
  }

  return emailResult.success;
};

export const inviteSeminaryInstructor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const instructor = await prisma.seminaryInstructor.findUnique({
      where: { id },
      select: {
        email: true,
        facultyId: true,
        id: true,
        inviteAcceptedAt: true,
        name: true,
        userId: true,
      },
    });

    if (!instructor) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary instructor not found',
      });
      return;
    }

    if (instructor.inviteAcceptedAt) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Instructor invitation has already been accepted',
      });
      return;
    }

    const success = await sendInstructorInvitation(instructor);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: success
        ? 'Instructor invitation sent successfully'
        : 'Instructor invitation saved, but email failed to send',
    });
  } catch (err) {
    logger.error('Error while inviting seminary instructor', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const acceptSeminaryInstructorInvite = async (
  req: Request<{}, any, AcceptSeminaryInstructorInviteBody, { token?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid or missing invitation token',
      });
      return;
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        code: token,
        expiresAt: { gt: new Date() },
        type: VerificationType.INSTRUCTOR_INVITATION,
      },
      include: {
        user: {
          include: {
            seminaryInstructor: true,
          },
        },
      },
    });

    const instructor = verificationCode?.user.seminaryInstructor;

    if (!verificationCode || !instructor) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired invitation token',
      });
      return;
    }

    const body = req.body as AcceptSeminaryInstructorInviteBody;
    const hashedPassword = await hashValue(body.password);

    const updatedInstructor = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.user.update({
          where: { id: verificationCode.userId },
          data: {
            accountStatus: 'ACTIVE',
            isEmailVerified: true,
            password: hashedPassword,
          },
        });

        await tx.verificationCode.delete({
          where: { id: verificationCode.id },
        });

        return tx.seminaryInstructor.update({
          where: { id: instructor.id },
          data: { inviteAcceptedAt: new Date() },
        });
      },
    );

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Instructor invitation accepted successfully',
      data: toInstructorResponse(updatedInstructor),
    });
  } catch (err) {
    logger.error('Error while accepting seminary instructor invitation', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
