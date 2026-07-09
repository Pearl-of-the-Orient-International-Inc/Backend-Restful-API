import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryCredentialDocumentStatus,
  SeminaryCredentialDocumentType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildNextBarcodeNumber,
  buildNextDocumentNumber,
  buildVerificationToken,
  findActiveCredentialDocument,
  seminaryCredentialDocumentInclude,
} from './credential-document-shared';

import type { Request, Response } from 'express';
import type { GenerateSeminaryCredentialDocumentBody } from './types';

export const generateSeminaryCredentialDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.params.studentId);
    const body = req.body as GenerateSeminaryCredentialDocumentBody;

    const document = await prisma.$transaction(async (tx) => {
      const application = await tx.seminaryApplication.findUnique({
        where: { studentId },
        select: {
          id: true,
          programCourse: true,
        },
      });

      if (!application) return null;

      const existing = await findActiveCredentialDocument(
        tx,
        application.id,
        body.type,
      );

      if (existing) {
        if (existing.barcodeNumber) return existing;

        return tx.seminaryCredentialDocument.update({
          where: { id: existing.id },
          data: {
            barcodeNumber: await buildNextBarcodeNumber(tx, body.type),
          },
          include: seminaryCredentialDocumentInclude,
        });
      }

      const barcodeNumber = await buildNextBarcodeNumber(tx, body.type);
      const documentNumber = await buildNextDocumentNumber(tx, body.type);
      const title =
        body.title?.trim() ||
        (body.type === SeminaryCredentialDocumentType.DIPLOMA
          ? 'Diploma'
          : body.type === SeminaryCredentialDocumentType.TRANSCRIPT
            ? 'Transcript of Records'
            : application.programCourse || 'Certificate');

      return tx.seminaryCredentialDocument.create({
        data: {
          applicationId: application.id,
          barcodeNumber,
          documentNumber,
          remarks: body.remarks?.trim() || null,
          status: SeminaryCredentialDocumentStatus.ACTIVE,
          title,
          type: body.type,
          verificationToken: buildVerificationToken(),
        },
        include: seminaryCredentialDocumentInclude,
      });
    });

    if (!document) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary student not found',
      });
      return;
    }

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary credential document generated successfully',
      data: document,
    });
  } catch (err) {
    logger.error('Error while generating seminary credential document', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
