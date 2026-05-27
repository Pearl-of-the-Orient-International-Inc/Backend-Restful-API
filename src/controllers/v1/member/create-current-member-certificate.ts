import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateNextMemberCertificateCredentialId } from '@/lib/member-certificate-credential-id';

import type { Request, Response } from 'express';

export const createCurrentMemberCertificate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const { title, certificateUrl, issuedAt } = req.body as {
      title: string;
      certificateUrl: string;
      issuedAt: string;
    };

    const credentialId =
      await generateNextMemberCertificateCredentialId({
        firstName: member.firstName,
        middleInitial: member.middleInitial,
        lastName: member.lastName,
      });

    const certificate = await prisma.memberCertificate.create({
      data: {
        memberId: member.id,
        credentialId,
        title,
        certificateUrl,
        dateReceived: new Date(issuedAt),
      },
      select: {
        id: true,
        credentialId: true,
        title: true,
        certificateUrl: true,
        dateReceived: true,
        createdAt: true,
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Certificate created successfully',
      data: certificate,
    });
  } catch (err) {
    logger.error('Error while creating current member certificate', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
