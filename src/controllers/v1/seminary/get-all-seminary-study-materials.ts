import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { SeminaryCourseStatus, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { GetAllSeminaryStudyMaterialsQuery } from './types';

type CourseSubject = {
  professor?: string;
  subjectName?: string;
};

const toCourseSubjects = (value: unknown): CourseSubject[] =>
  Array.isArray(value) ? (value as CourseSubject[]) : [];

export const getAllSeminaryStudyMaterials = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryStudyMaterialsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const user = req.userId
      ? await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            name: true,
            role: true,
            seminaryInstructor: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;
    const instructorSubjects =
      user?.role === UserType.INSTRUCTOR
        ? (
            await prisma.seminaryCourse.findMany({
              where: { status: SeminaryCourseStatus.ACTIVE },
              select: { subjects: true },
            })
          )
            .flatMap((course) => toCourseSubjects(course.subjects))
            .filter(
              (subject) =>
                subject.professor?.toLowerCase() ===
                (user.seminaryInstructor?.name ?? user.name).toLowerCase(),
            )
            .map((subject) => subject.subjectName)
            .filter((subject): subject is string => Boolean(subject))
        : null;

    const where: Prisma.SeminaryStudyMaterialWhereInput = {
      ...(instructorSubjects
        ? { subject: { in: instructorSubjects } }
        : query.subject
          ? { subject: query.subject }
          : {}),
      ...(instructorSubjects && query.subject
        ? { AND: [{ subject: query.subject }] }
        : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { subtitle: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { fileName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [materials, total] = await prisma.$transaction([
      prisma.seminaryStudyMaterial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.seminaryStudyMaterial.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Study materials retrieved successfully',
      data: materials,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary study materials', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
