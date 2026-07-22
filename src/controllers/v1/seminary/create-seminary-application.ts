import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryApplicationStatus,
  SeminaryEnrollmentType,
  SeminarySchoolAffiliation,
  SeminaryStudentStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  parseAge,
  parseDate,
  seminaryApplicationInclude,
  trimToNull,
} from './seminary-shared';

import type { Request, Response } from 'express';
import type { CreateSeminaryApplicationBody } from './types';

const ADMISSION_NUMBER_PREFIX = 'POTSC';

const buildAdmissionNumber = (year: number, sequence: number) =>
  `${ADMISSION_NUMBER_PREFIX}-${String(year).slice(-2)}-${String(sequence).padStart(4, '0')}`;

const getNextAdmissionNumber = async (year: number) => {
  const prefix = `${ADMISSION_NUMBER_PREFIX}-${String(year).slice(-2)}-`;
  const latestApplication = await prisma.seminaryApplication.findFirst({
    where: {
      admissionNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      admissionNumber: 'desc',
    },
    select: {
      admissionNumber: true,
    },
  });

  const latestNumberParts = latestApplication?.admissionNumber?.split('-') ?? [];
  const latestSequence = latestNumberParts.length
    ? Number.parseInt(latestNumberParts[latestNumberParts.length - 1] ?? '0', 10)
    : 0;

  return buildAdmissionNumber(year, Number.isFinite(latestSequence) ? latestSequence + 1 : 1);
};

export const createSeminaryApplication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryApplicationBody;
    const submittedAt = parseDate(body.admissionDate) ?? new Date();
    const admissionNumber = await getNextAdmissionNumber(submittedAt.getFullYear());

    const application = await prisma.seminaryApplication.create({
      data: {
        admissionNumber,
        academicYear: trimToNull(body.academicYear),
        surname: trimToNull(body.surname),
        givenName: trimToNull(body.givenName),
        middleName: trimToNull(body.middleName),
        emailAddress: trimToNull(body.emailAddress),
        mobilePhone: trimToNull(body.mobilePhone),
        mailingAddress: trimToNull(body.mailingAddress),
        homeAddress: trimToNull(body.homeAddress),
        dateOfBirth: parseDate(body.dateOfBirth),
        birthPlace: trimToNull(body.birthPlace),
        age: parseAge(body.age),
        gender: body.gender || null,
        height: trimToNull(body.height),
        weight: trimToNull(body.weight),
        civilStatus: body.civilStatus || null,
        officePhone: trimToNull(body.officePhone),
        churchAttended: trimToNull(body.churchAttended),
        churchAddress: trimToNull(body.churchAddress),
        pastorName: trimToNull(body.pastorName),
        contactNumber: trimToNull(body.contactNumber),
        ministryInvolved: trimToNull(body.ministryInvolved),
        programLevel: body.programLevel || null,
        programCourse: trimToNull(body.programCourse),
        highSchool: trimToNull(body.highSchool),
        highSchoolYearGraduated: trimToNull(body.highSchoolYearGraduated),
        collegeSchool: trimToNull(body.collegeSchool),
        collegeCourse: trimToNull(body.collegeCourse),
        collegeYearGraduated: trimToNull(body.collegeYearGraduated),
        vocationalSchool: trimToNull(body.vocationalSchool),
        vocationalCourse: trimToNull(body.vocationalCourse),
        vocationalYearGraduated: trimToNull(body.vocationalYearGraduated),
        othersSchool: trimToNull(body.othersSchool),
        othersCourse: trimToNull(body.othersCourse),
        othersYearGraduated: trimToNull(body.othersYearGraduated),
        enrollmentType: SeminaryEnrollmentType.REGULAR,
        schoolAffiliation: SeminarySchoolAffiliation.IN_HOUSE,
        status: SeminaryApplicationStatus.SUBMITTED,
        studentStatus: SeminaryStudentStatus.ACTIVE,
        submittedAt,
      },
      include: seminaryApplicationInclude,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary application created successfully',
      data: application,
    });
  } catch (err) {
    logger.error('Error while creating seminary application', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
