import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryCourseStatus,
  SeminaryStudyMaterialStatus,
  UserType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryStudyMaterialBody } from './types';

type CourseSubject = {
  professor?: string;
  subjectName?: string;
};

const toCourseSubjects = (value: unknown): CourseSubject[] =>
  Array.isArray(value) ? (value as CourseSubject[]) : [];

export const updateSeminaryStudyMaterial = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const body = req.body as UpdateSeminaryStudyMaterialBody;
    const [user, existingMaterial] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          role: true,
          seminaryInstructor: {
            select: { name: true },
          },
        },
      }),
      prisma.seminaryStudyMaterial.findUnique({
        where: { id },
        select: { id: true, uploadedByUserId: true },
      }),
    ]);

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    if (!existingMaterial) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Study material not found',
      });
      return;
    }

    if (
      user.role === UserType.INSTRUCTOR &&
      existingMaterial.uploadedByUserId !== userId
    ) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'You can manage only study materials you uploaded',
      });
      return;
    }

    if (user.role === UserType.INSTRUCTOR) {
      const instructorName = user.seminaryInstructor?.name ?? user.name;
      const courses = await prisma.seminaryCourse.findMany({
        where: { status: SeminaryCourseStatus.ACTIVE },
        select: { subjects: true },
      });
      const hasAssignedSubject = courses
        .flatMap((course) => toCourseSubjects(course.subjects))
        .some(
          (subject) =>
            subject.subjectName === body.subject &&
            subject.professor?.toLowerCase() === instructorName.toLowerCase(),
        );

      if (!hasAssignedSubject) {
        res.status(HTTPSTATUS.FORBIDDEN).json({
          code: 'FORBIDDEN',
          message: 'Subject is not assigned to this instructor',
        });
        return;
      }
    }

    const material = await prisma.seminaryStudyMaterial.update({
      where: { id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        subject: body.subject,
        type: body.type,
        status: body.status ?? SeminaryStudyMaterialStatus.DRAFT,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Study material updated successfully',
      data: material,
    });
  } catch (err) {
    logger.error('Error while updating seminary study material', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
