import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryCredentialDocumentInclude } from './credential-document-shared';
import type { Request, Response } from 'express';
import type { GetAllSeminaryCredentialDocumentsQuery } from './types';

export const getAllSeminaryCredentialDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryCredentialDocumentsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where: Prisma.SeminaryCredentialDocumentWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(search ? { OR: [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { application: { is: { OR: [
          { studentId: { contains: search, mode: 'insensitive' } },
          { givenName: { contains: search, mode: 'insensitive' } },
          { surname: { contains: search, mode: 'insensitive' } },
          { programCourse: { contains: search, mode: 'insensitive' } },
        ] } } },
      ] } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.seminaryCredentialDocument.findMany({ where, include: seminaryCredentialDocumentInclude, orderBy: { issuedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.seminaryCredentialDocument.count({ where }),
    ]);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Seminary credential documents retrieved successfully', data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error('Error while getting seminary credential documents', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
