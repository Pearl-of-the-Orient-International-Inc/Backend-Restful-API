import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  normalizeFeeCollectionStatus,
  toFeeCollectionResponse,
} from './fee-collection-shared';
import { ensureSeminaryFeeCollectionAccount } from './fee-collection-account';

import type { Request, Response } from 'express';
import type { GetAllSeminaryFeeCollectionsQuery } from './types';
import type { Prisma } from '@/generated/prisma/client';

export const getAllSeminaryFeeCollections = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Backfill accounts for students registered before Fee Collection was added.
    // The helper uses an upsert, so existing payment history is never changed.
    const studentsWithoutGuaranteedAccounts =
      await prisma.seminaryApplication.findMany({
        where: {
          studentId: { not: null },
          programLevel: { not: null },
        },
        select: {
          studentId: true,
          givenName: true,
          middleName: true,
          surname: true,
          programCourse: true,
          programLevel: true,
        },
      });
    await prisma.$transaction(async (tx) => {
      for (const student of studentsWithoutGuaranteedAccounts) {
        if (!student.studentId || !student.programLevel) continue;
        await ensureSeminaryFeeCollectionAccount(tx, {
          studentId: student.studentId,
          givenName: student.givenName,
          middleName: student.middleName,
          surname: student.surname,
          programCourse: student.programCourse,
          programLevel: student.programLevel,
        });
      }
    });

    const query = req.query as GetAllSeminaryFeeCollectionsQuery;
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    const search = query.search?.trim();

    const where: Prisma.SeminaryFeeCollectionAccountWhereInput = {
      ...(query.programLevel ? { programLevel: query.programLevel } : {}),
      ...(query.status ? { status: normalizeFeeCollectionStatus(query.status) } : {}),
      ...(search
        ? {
            OR: [
              { studentName: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
              { referenceNumber: { contains: search, mode: 'insensitive' } },
              { program: { contains: search, mode: 'insensitive' } },
              { paymentMethod: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [accounts, total] = await Promise.all([
      prisma.seminaryFeeCollectionAccount.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { studentName: 'asc' }],
        ...(limit ? { skip, take: limit } : {}),
      }),
      prisma.seminaryFeeCollectionAccount.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee collection accounts retrieved successfully',
      data: accounts.map(toFeeCollectionResponse),
      meta: limit
        ? {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }
        : undefined,
    });
  } catch (err) {
    logger.error('Error while getting seminary fee collection accounts', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
