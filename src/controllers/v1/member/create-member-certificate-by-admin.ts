import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateNextMemberCertificateCredentialId } from '@/lib/member-certificate-credential-id';

import type { Request, Response } from 'express';

export const createMemberCertificateByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
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
        message: 'Member not found',
      });
      return;
    }

    const {
      type,
      title,
      issuer,
      referenceNumber,
      certificateUrl,
      issuedAt,
      expiresAt,
    } = req.body as {
      type: 'CERTIFICATE' | 'RECOGNITION';
      title: string;
      issuer: string;
      referenceNumber: string;
      certificateUrl: string;
      issuedAt: string;
      expiresAt?: string | null;
    };

    const credentialId = await generateNextMemberCertificateCredentialId({
      firstName: member.firstName,
      middleInitial: member.middleInitial,
      lastName: member.lastName,
    });

    const certificate = await prisma.memberCertificate.create({
      data: {
        memberId: member.id,
        credentialId,
        type,
        title,
        issuer,
        referenceNumber,
        certificateUrl,
        dateReceived: new Date(issuedAt),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        credentialId: true,
        type: true,
        title: true,
        issuer: true,
        referenceNumber: true,
        certificateUrl: true,
        dateReceived: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Certificate published to the member profile',
      data: certificate,
    });
  } catch (err) {
    logger.error('Error while publishing member certificate by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to publish the certificate to the member profile',
    });
  }
};
