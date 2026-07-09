import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryCredentialDocumentInclude } from './credential-document-shared';

import type { Request, Response } from 'express';
import type { GetSeminaryCredentialDocumentsQuery } from './types';

export const getSeminaryCredentialDocuments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.params.studentId);
    const query = req.query as GetSeminaryCredentialDocumentsQuery;
    const student = await prisma.seminaryApplication.findUnique({
      where: { studentId },
      select: { id: true },
    });

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary student not found',
      });
      return;
    }

    const documents = await prisma.seminaryCredentialDocument.findMany({
      where: {
        applicationId: student.id,
        ...(query.type ? { type: query.type } : {}),
      },
      include: seminaryCredentialDocumentInclude,
      orderBy: { issuedAt: 'desc' },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary credential documents retrieved successfully',
      data: documents,
    });
  } catch (err) {
    logger.error('Error while getting seminary credential documents', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
