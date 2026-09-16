import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildNextStudentId,
  buildSeminaryStudentData,
} from './student-shared';

import type { Request, Response } from 'express';
import type { BulkImportSeminaryStudentsBody } from './types';

type ImportStudent = BulkImportSeminaryStudentsBody['students'][number];
type StudentIdentity = {
  studentId?: string | null;
  surname?: string | null;
  givenName?: string | null;
  middleName?: string | null;
};

class DuplicateStudentsError extends Error {}

const normalizeIdentityPart = (value?: string | null) =>
  value?.trim().replace(/\s+/g, ' ').toLocaleLowerCase() ?? '';

const getStudentNameKey = (student: StudentIdentity) => {
  const surname = normalizeIdentityPart(student.surname);
  const givenName = normalizeIdentityPart(student.givenName);

  if (!surname || !givenName) return null;

  return [surname, givenName, normalizeIdentityPart(student.middleName)].join(
    '|',
  );
};

const getStudentDisplayName = (student: StudentIdentity) =>
  [student.givenName, student.middleName, student.surname]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ') || student.studentId?.trim() || 'Unnamed student';

const findBatchDuplicates = (students: ImportStudent[]) => {
  const seenStudentIds = new Set<string>();
  const seenNames = new Set<string>();
  const duplicates = new Set<string>();

  for (const student of students) {
    const studentId = student.studentId?.trim().toUpperCase();
    const nameKey = getStudentNameKey(student);

    if (studentId) {
      if (seenStudentIds.has(studentId)) {
        duplicates.add(getStudentDisplayName(student));
      }
      seenStudentIds.add(studentId);
    }

    if (nameKey) {
      if (seenNames.has(nameKey)) {
        duplicates.add(getStudentDisplayName(student));
      }
      seenNames.add(nameKey);
    }
  }

  return [...duplicates];
};

const duplicateMessage = (names: string[]) => {
  const visibleNames = names.slice(0, 3).join(', ');
  const remaining = names.length - 3;

  return `Duplicate student${names.length === 1 ? '' : 's'} found: ${visibleNames}${
    remaining > 0 ? ` and ${remaining} more` : ''
  }`;
};

export const bulkImportSeminaryStudents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as BulkImportSeminaryStudentsBody;
    const batchDuplicates = findBatchDuplicates(body.students);

    if (batchDuplicates.length) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: duplicateMessage(batchDuplicates),
      });
      return;
    }

    const students = await prisma.$transaction(
      async (tx) => {
        const rowsWithNames = body.students.filter(
          (student) => getStudentNameKey(student) !== null,
        );
        const existingStudents = rowsWithNames.length
          ? await tx.seminaryApplication.findMany({
              where: {
                OR: rowsWithNames.map((student) => ({
                  surname: {
                    equals: student.surname?.trim(),
                    mode: 'insensitive',
                  },
                  givenName: {
                    equals: student.givenName?.trim(),
                    mode: 'insensitive',
                  },
                })),
              },
              select: {
                studentId: true,
                surname: true,
                givenName: true,
                middleName: true,
              },
            })
          : [];
        const existingByName = new Map(
          existingStudents
            .map((student) => [getStudentNameKey(student), student] as const)
            .filter(
              (
                entry,
              ): entry is [string, (typeof existingStudents)[number]] =>
                entry[0] !== null,
            ),
        );
        const existingDuplicates = rowsWithNames.filter((student) => {
          const existing = existingByName.get(
            getStudentNameKey(student) ?? '',
          );

          if (!existing) return false;

          const requestedId = student.studentId?.trim().toUpperCase();
          const existingId = existing.studentId?.trim().toUpperCase();

          return !requestedId || requestedId !== existingId;
        });

        if (existingDuplicates.length) {
          throw new DuplicateStudentsError(
            duplicateMessage(existingDuplicates.map(getStudentDisplayName)),
          );
        }

        const imported = [];

        for (const row of body.students) {
          const studentId =
            row.studentId?.trim() || (await buildNextStudentId(tx));
          const data = buildSeminaryStudentData(row);
          const student = row.studentId?.trim()
            ? await tx.seminaryApplication.upsert({
                where: {
                  studentId,
                },
                create: {
                  ...data,
                  studentId,
                },
                update: data,
              })
            : await tx.seminaryApplication.create({
                data: {
                  ...data,
                  studentId,
                },
              });

          imported.push(student);
        }

        return imported;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 30_000,
      },
    );

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: `${students.length} seminary students imported successfully`,
      data: students,
    });
  } catch (err) {
    if (err instanceof DuplicateStudentsError) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: err.message,
      });
      return;
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'A student with the same student number already exists',
      });
      return;
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2034'
    ) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message:
          'Another student import was completed at the same time. No students were added; review the list and try again.',
      });
      return;
    }

    logger.error('Error while bulk importing seminary students', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
