import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryCredentialDocumentInclude } from './credential-document-shared';

import type { Request, Response } from 'express';
import type { GetSeminaryCredentialDocumentByNumberParams } from './types';

export const getSeminaryCredentialDocumentByNumber = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = req.params as GetSeminaryCredentialDocumentByNumberParams;
    const document = await prisma.seminaryCredentialDocument.findFirst({
      where: {
        OR: [
          { documentNumber: params.documentNumber },
          { barcodeNumber: params.documentNumber },
        ],
      },
      include: seminaryCredentialDocumentInclude,
    });

    if (!document) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary credential document not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary credential document retrieved successfully',
      data: document,
    });
  } catch (err) {
    logger.error('Error while getting seminary credential document by number', {
      err,
    });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
