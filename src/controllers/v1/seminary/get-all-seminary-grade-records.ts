import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  getGradeRecordWhereForUser,
  toGradeRecordResponse,
} from './grade-record-shared';

import type { Request, Response } from 'express';
import type { GetAllSeminaryGradeRecordsQuery } from './types';

export const getAllSeminaryGradeRecords = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryGradeRecordsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const userWhere = await getGradeRecordWhereForUser(req.userId);

    const where: Prisma.SeminaryGradeRecordWhereInput = {
      ...userWhere,
      ...(query.program ? { program: query.program } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.term ? { term: query.term } : {}),
      ...(search
        ? {
            OR: [
              { recordNumber: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
              { studentName: { contains: search, mode: 'insensitive' } },
              { courseTitle: { contains: search, mode: 'insensitive' } },
              { courseCode: { contains: search, mode: 'insensitive' } },
              { instructorName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.seminaryGradeRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.seminaryGradeRecord.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Grade records retrieved successfully',
      data: records.map(toGradeRecordResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary grade records', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
