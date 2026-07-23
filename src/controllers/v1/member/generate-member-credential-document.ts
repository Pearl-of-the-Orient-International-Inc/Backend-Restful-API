import { HTTPSTATUS } from '@/common/http-codes';
import { MemberCredentialDocumentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildMemberCredentialVerificationToken,
  buildNextMemberCredentialBarcodeNumber,
  buildNextMemberCredentialDocumentNumber,
  memberCredentialDocumentInclude,
} from './credential-document-shared';

import type { Request, Response } from 'express';
import type { GenerateMemberCredentialDocumentBody } from './types';

export const generateMemberCredentialDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = String(req.params.id);
    const body = req.body as GenerateMemberCredentialDocumentBody;

    const document = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!member) return null;

      const existing = await tx.memberCredentialDocument.findUnique({
        where: {
          memberId_type: {
            memberId,
            type: body.type,
          },
        },
        include: memberCredentialDocumentInclude,
      });

      if (existing) {
        if (existing.barcodeNumber) return existing;

        return tx.memberCredentialDocument.update({
          where: { id: existing.id },
          data: {
            barcodeNumber: await buildNextMemberCredentialBarcodeNumber(
              tx,
              body.type,
            ),
          },
          include: memberCredentialDocumentInclude,
        });
      }

      const title =
        body.type === 'CERTIFICATE'
          ? 'Certificate'
          : 'Recognition';

      return tx.memberCredentialDocument.create({
        data: {
          barcodeNumber: await buildNextMemberCredentialBarcodeNumber(
            tx,
            body.type,
          ),
          documentNumber: await buildNextMemberCredentialDocumentNumber(
            tx,
            body.type,
          ),
          memberId,
          status: MemberCredentialDocumentStatus.ACTIVE,
          title,
          type: body.type,
          verificationToken: buildMemberCredentialVerificationToken(),
        },
        include: memberCredentialDocumentInclude,
      });
    });

    if (!document) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Member credential document generated successfully',
      data: document,
    });
  } catch (err) {
    logger.error('Error while generating member credential document', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
