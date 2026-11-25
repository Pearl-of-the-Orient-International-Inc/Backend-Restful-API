import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryCredentialDocumentStatus, SeminaryCredentialDocumentType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { buildNextBarcodeNumber, buildNextDocumentNumber, buildVerificationToken, findActiveCredentialDocument, seminaryCredentialDocumentInclude } from './credential-document-shared';
import type { Request, Response } from 'express';
import type { GenerateSeminaryTranscriptBatchBody } from './types';

export const generateSeminaryTranscriptBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIds } = req.body as GenerateSeminaryTranscriptBatchBody;
    const documents = await prisma.$transaction(async (tx) => {
      const students = await tx.seminaryApplication.findMany({ where: { studentId: { in: studentIds } }, select: { id: true, studentId: true, programCourse: true } });
      if (students.length !== new Set(studentIds).size) throw new Error('STUDENT_NOT_FOUND');
      const result = [];
      for (const studentId of studentIds) {
        const student = students.find((item) => item.studentId === studentId)!;
        const existing = await findActiveCredentialDocument(tx, student.id, SeminaryCredentialDocumentType.TRANSCRIPT);
        if (existing) { result.push(existing); continue; }
        result.push(await tx.seminaryCredentialDocument.create({ data: { applicationId: student.id, type: SeminaryCredentialDocumentType.TRANSCRIPT, status: SeminaryCredentialDocumentStatus.ACTIVE, title: 'Official Transcript of Records', documentNumber: await buildNextDocumentNumber(tx, SeminaryCredentialDocumentType.TRANSCRIPT), barcodeNumber: await buildNextBarcodeNumber(tx, SeminaryCredentialDocumentType.TRANSCRIPT), verificationToken: buildVerificationToken() }, include: seminaryCredentialDocumentInclude }));
      }
      return result;
    });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Transcript batch generated successfully', data: documents });
  } catch (err) {
    if (err instanceof Error && err.message === 'STUDENT_NOT_FOUND') { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'One or more seminary students were not found' }); return; }
    logger.error('Error while generating seminary transcript batch', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
