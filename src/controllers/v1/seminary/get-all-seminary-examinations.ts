import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  getExaminationWhereForUser,
  toExaminationResponse,
} from './examination-shared';

import type { Request, Response } from 'express';
import type { GetAllSeminaryExaminationsQuery } from './types';

export const getAllSeminaryExaminations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryExaminationsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const userWhere = await getExaminationWhereForUser(req.userId);

    const where: Prisma.SeminaryExaminationWhereInput = {
      ...userWhere,
      ...(query.subject ? { subject: query.subject } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { coverage: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [examinations, total] = await prisma.$transaction([
      prisma.seminaryExamination.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.seminaryExamination.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Examinations retrieved successfully',
      data: examinations.map(toExaminationResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary examinations', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
