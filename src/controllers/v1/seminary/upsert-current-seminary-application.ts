import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { MemberType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { seminaryAdmissionSubmittedTemplate } from '@/mailers/templates/seminary-admission-submitted';
import {
  buildSeminaryApplicationData,
  buildSeminaryPaymentData,
  buildSeminaryRequirementsData,
  seminaryApplicationInclude,
} from './seminary-shared';

import type { Request, Response } from 'express';
import type { UpsertCurrentSeminaryApplicationBody } from './types';

export const upsertCurrentSeminaryApplication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    const member = userId
      ? await prisma.member.findUnique({
          where: { userId },
          select: {
            id: true,
            memberType: true,
            status: true,
          },
        })
      : null;

    if (member && member.memberType !== MemberType.ASSOCIATE_CHAPLAIN) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message:
          'Only associate chaplains can submit a seminary application for professional chaplain status',
      });
      return;
    }

    const body = req.body as UpsertCurrentSeminaryApplicationBody;
    const applicationData = buildSeminaryApplicationData(body);
    const requirementsData = buildSeminaryRequirementsData(body);
    const paymentData = buildSeminaryPaymentData(body);

    const application = await prisma.$transaction(async (tx) => {
      const publicIdentifiers: Prisma.SeminaryApplicationWhereInput[] = [];

      if (applicationData.emailAddress) {
        publicIdentifiers.push({ emailAddress: applicationData.emailAddress });
      }

      if (applicationData.mobilePhone) {
        publicIdentifiers.push({ mobilePhone: applicationData.mobilePhone });
      }

      const existingApplication = member
        ? await tx.seminaryApplication.findFirst({
            where: {
              memberId: member.id,
              status: {
                in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'],
              },
            },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
          })
        : publicIdentifiers.length
          ? await tx.seminaryApplication.findFirst({
              where: {
                OR: publicIdentifiers,
                status: {
                  in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'],
                },
              },
              select: { id: true },
              orderBy: { createdAt: 'desc' },
            })
          : null;

      const applicationDataWithMember = {
        ...applicationData,
        memberId: member?.id ?? null,
      };

      const savedApplication = existingApplication
        ? await tx.seminaryApplication.update({
            where: { id: existingApplication.id },
            data: applicationDataWithMember,
            select: { id: true },
          })
        : await tx.seminaryApplication.create({
            data: applicationDataWithMember,
            select: { id: true },
          });

      await tx.seminaryRequirements.upsert({
        where: { applicationId: savedApplication.id },
        create: {
          ...requirementsData,
          application: { connect: { id: savedApplication.id } },
        },
        update: requirementsData,
      });

      await tx.seminaryPayment.upsert({
        where: { applicationId: savedApplication.id },
        create: {
          ...paymentData,
          application: { connect: { id: savedApplication.id } },
        },
        update: paymentData,
      });

      return tx.seminaryApplication.findUnique({
        where: { id: savedApplication.id },
        include: seminaryApplicationInclude,
      });
    });

    if (applicationData.emailAddress) {
      const applicantName = [
        applicationData.givenName,
        applicationData.middleName,
        applicationData.surname,
      ]
        .filter(Boolean)
        .join(' ');

      const emailResult = await sendMail({
        sendTo: applicationData.emailAddress,
        ...seminaryAdmissionSubmittedTemplate({
          name: applicantName,
          programLevel: applicationData.programLevel,
          programCourse: applicationData.programCourse,
        }),
      });

      if (!emailResult.success) {
        logger.warn('Seminary admission confirmation email failed to send', {
          applicationId: application?.id,
          email: applicationData.emailAddress,
        });
      }
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message:
        'Application submitted successfully. Please check your email for confirmation and wait for the Admissions Office approval update.',
      data: application,
    });
  } catch (err) {
    logger.error('Error while saving current seminary application', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
