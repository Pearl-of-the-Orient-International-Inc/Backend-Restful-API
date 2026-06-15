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

import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { UpdateSeminaryApplicationStatusBody } from './types';

const buildNextStudentId = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `POTSC-${yearSuffix}-`;
  const latestApplication = await tx.seminaryApplication.findFirst({
    where: {
      studentId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentId: 'desc',
    },
    select: {
      studentId: true,
    },
  });
  const latestSeries = latestApplication?.studentId
    ? Number.parseInt(latestApplication.studentId.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;

  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};

const getApplicantName = ({
  givenName,
  middleName,
  surname,
}: {
  givenName: string;
  middleName: string | null;
  surname: string;
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
        givenName: true,
        middleName: true,
        surname: true,
        emailAddress: true,
        programCourse: true,
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
        body.status === SeminaryApplicationStatus.APPROVED &&
        !existingApplication.studentId
          ? await buildNextStudentId(tx)
          : undefined;

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
              body.status === SeminaryApplicationStatus.APPROVED
                ? SeminaryPaymentStatus.VERIFIED
                : body.status === SeminaryApplicationStatus.REJECTED
                  ? SeminaryPaymentStatus.REJECTED
                  : SeminaryPaymentStatus.PENDING,
            verifiedAt:
              body.status === SeminaryApplicationStatus.APPROVED
                ? new Date()
                : null,
            reviewRemarks: body.reviewRemarks ?? null,
          },
        });
      }

      if (
        body.status === SeminaryApplicationStatus.APPROVED &&
        existingApplication.memberId
      ) {
        await tx.member.update({
          where: { id: existingApplication.memberId },
          data: {
            memberType: MemberType.PROFESSIONAL_CHAPLAIN,
          },
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
          programCourse: existingApplication.programCourse,
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
