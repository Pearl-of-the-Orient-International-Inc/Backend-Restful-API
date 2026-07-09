import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryCredentialDocumentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryCredentialDocumentInclude } from './credential-document-shared';

import type { Request, Response } from 'express';
import type { VerifySeminaryCredentialDocumentParams } from './types';

export const verifySeminaryCredentialDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = req.params as VerifySeminaryCredentialDocumentParams;
    const document = await prisma.seminaryCredentialDocument.findUnique({
      where: { verificationToken: params.token },
      include: seminaryCredentialDocumentInclude,
    });

    if (!document || document.status !== SeminaryCredentialDocumentStatus.ACTIVE) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary credential document could not be verified',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary credential document verified successfully',
      data: document,
    });
  } catch (err) {
    logger.error('Error while verifying seminary credential document', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
