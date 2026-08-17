import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryCourseStatus,
  SeminaryStudyMaterialStatus,
  UserType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { CreateSeminaryStudyMaterialBody } from './types';

type CourseSubject = {
  professor?: string;
  subjectName?: string;
};

const toCourseSubjects = (value: unknown): CourseSubject[] =>
  Array.isArray(value) ? (value as CourseSubject[]) : [];

export const createSeminaryStudyMaterial = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const body = req.body as CreateSeminaryStudyMaterialBody;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        seminaryInstructor: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
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

    const material = await prisma.seminaryStudyMaterial.create({
      data: {
        title: body.title,
        subtitle: body.subtitle,
        subject: body.subject,
        type: body.type,
        status: body.status ?? SeminaryStudyMaterialStatus.DRAFT,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        uploadedByName: user.seminaryInstructor?.name ?? user.name,
        uploadedByRole: user.role === UserType.INSTRUCTOR ? 'Instructor' : user.role,
        uploadedByUserId: user.id,
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Study material uploaded successfully',
      data: material,
    });
  } catch (err) {
    logger.error('Error while creating seminary study material', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
