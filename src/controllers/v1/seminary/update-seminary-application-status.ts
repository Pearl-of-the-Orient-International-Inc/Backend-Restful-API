import { HTTPSTATUS } from '@/common/http-codes';
import {
  MemberType,
  SeminaryApplicationStatus,
  SeminaryPaymentStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { seminaryApplicationStatusTemplate } from '@/mailers/templates/seminary-application-status';
import { seminaryApplicationInclude } from './seminary-shared';
import { buildNextStudentId } from './student-shared';
import {
  createSeminaryStudentPortalAccount,
  getSeminaryStudentPortalEmail,
} from './student-portal-account';
import { ensureSeminaryFeeCollectionAccount } from './fee-collection-account';

import type { Request, Response } from 'express';
import type { UpdateSeminaryApplicationStatusBody } from './types';

const getApplicantName = ({
  givenName,
  middleName,
  surname,
}: {
  givenName: string | null;
  middleName: string | null;
  surname: string | null;
}) =>
  [givenName, middleName, surname]
    .filter(Boolean)
    .join(' ')
    .trim();

export const updateSeminaryApplicationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateSeminaryApplicationStatusBody;
    const applicationId = String(req.params.id);

    const existingApplication = await prisma.seminaryApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        memberId: true,
        studentId: true,
        portalUserId: true,
        givenName: true,
        middleName: true,
        surname: true,
        emailAddress: true,
        programCourse: true,
        programLevel: true,
      },
    });

    if (!existingApplication) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary application not found',
      });
      return;
    }

    const existingPayment = await prisma.seminaryPayment.findUnique({
      where: { applicationId: existingApplication.id },
      select: { id: true },
    });

    const application = await prisma.$transaction(async (tx) => {
      const studentId =
        (body.status === SeminaryApplicationStatus.APPROVED ||
          body.status === SeminaryApplicationStatus.ENROLLED) &&
        !existingApplication.studentId
          ? await buildNextStudentId(tx)
          : undefined;
      const effectiveStudentId = studentId ?? existingApplication.studentId;
      let portalUserId: string | undefined;

      if (
        (body.status === SeminaryApplicationStatus.APPROVED ||
          body.status === SeminaryApplicationStatus.ENROLLED) &&
        !existingApplication.portalUserId &&
        effectiveStudentId
      ) {
        const existingPortalAccount = await tx.user.findUnique({
          where: { email: getSeminaryStudentPortalEmail(effectiveStudentId) },
          select: { id: true },
        });
        portalUserId = existingPortalAccount?.id ?? (
          await createSeminaryStudentPortalAccount(tx, {
            studentId: effectiveStudentId,
            givenName: existingApplication.givenName,
            middleName: existingApplication.middleName,
            surname: existingApplication.surname,
          })
        ).id;
      }

      const reviewedApplication = await tx.seminaryApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: body.status,
          reviewRemarks: body.reviewRemarks ?? null,
          reviewedAt:
            body.status === SeminaryApplicationStatus.UNDER_REVIEW
              ? null
              : new Date(),
          studentId,
          ...(portalUserId ? { portalUserId } : {}),
        },
        select: {
          id: true,
        },
      });

      if (existingPayment?.id) {
        await tx.seminaryPayment.update({
          where: { id: existingPayment.id },
          data: {
            status:
              body.status === SeminaryApplicationStatus.APPROVED ||
              body.status === SeminaryApplicationStatus.ENROLLED
                ? SeminaryPaymentStatus.VERIFIED
                : body.status === SeminaryApplicationStatus.REJECTED
                  ? SeminaryPaymentStatus.REJECTED
                  : SeminaryPaymentStatus.PENDING,
            verifiedAt:
              body.status === SeminaryApplicationStatus.APPROVED ||
              body.status === SeminaryApplicationStatus.ENROLLED
                ? new Date()
                : null,
            reviewRemarks: body.reviewRemarks ?? null,
          },
        });
      }

      if (
        (body.status === SeminaryApplicationStatus.APPROVED ||
          body.status === SeminaryApplicationStatus.ENROLLED) &&
        existingApplication.memberId
      ) {
        await tx.member.update({
          where: { id: existingApplication.memberId },
          data: {
            memberType: MemberType.PROFESSIONAL_CHAPLAIN,
          },
        });
      }

      if (
        (body.status === SeminaryApplicationStatus.APPROVED ||
          body.status === SeminaryApplicationStatus.ENROLLED) &&
        effectiveStudentId &&
        existingApplication.programLevel
      ) {
        await ensureSeminaryFeeCollectionAccount(tx, {
          studentId: effectiveStudentId,
          givenName: existingApplication.givenName,
          middleName: existingApplication.middleName,
          surname: existingApplication.surname,
          programCourse: existingApplication.programCourse,
          programLevel: existingApplication.programLevel,
        });
      }

      return tx.seminaryApplication.findUnique({
        where: { id: reviewedApplication.id },
        include: seminaryApplicationInclude,
      });
    });

    if (existingApplication.emailAddress) {
      const emailResult = await sendMail({
        sendTo: existingApplication.emailAddress,
        ...seminaryApplicationStatusTemplate({
          name:
            getApplicantName(existingApplication) ||
            existingApplication.emailAddress,
          programCourse: existingApplication.programCourse ?? 'Selected program',
          reason: body.reviewRemarks,
          status: body.status,
          studentId: application?.studentId,
        }),
      });

      if (!emailResult.success) {
        logger.warn('Seminary application status email failed to send', {
          applicationId: existingApplication.id,
          email: existingApplication.emailAddress,
          status: body.status,
        });
      }
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: `Seminary application marked as ${body.status.toLowerCase().replace(/_/g, ' ')} successfully`,
      data: application,
    });
  } catch (err) {
    logger.error('Error while updating seminary application status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
