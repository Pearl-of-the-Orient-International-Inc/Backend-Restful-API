import { HTTPSTATUS } from '@/common/http-codes';
import { MemberCredentialDocumentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { memberCredentialDocumentInclude } from './credential-document-shared';

import type { Request, Response } from 'express';
import type { VerifyMemberCredentialDocumentParams } from './types';

export const verifyMemberCredentialDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = req.params as VerifyMemberCredentialDocumentParams;
    const document = await prisma.memberCredentialDocument.findUnique({
      where: { verificationToken: params.token },
      include: memberCredentialDocumentInclude,
    });

    if (!document || document.status !== MemberCredentialDocumentStatus.ACTIVE) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member credential document could not be verified',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member credential document verified successfully',
      data: document,
    });
  } catch (err) {
    logger.error('Error while verifying member credential document', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

