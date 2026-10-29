import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import { findSeminaryScheduleConflict } from './course-schedule-shared';
import type {
  CreateSeminaryCourseScheduleBody,
  GetAllSeminaryCourseSchedulesQuery,
  UpdateSeminaryCourseScheduleBody,
} from './types';
import type { Request, Response } from 'express';

const includeScheduleDetails = {
  course: { select: { id: true, courseCode: true, courseName: true, program: true } },
  instructor: { select: { id: true, name: true, userId: true } },
} satisfies Prisma.SeminaryCourseScheduleInclude;

const formatConflictMessage = (schedule: { course: { courseCode: string }; instructor: { name: string } }) =>
  `Schedule conflicts with ${schedule.course.courseCode} assigned to ${schedule.instructor.name}.`;

const getSchedulePersistenceError = (err: unknown) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2021') {
      return 'The timetable database table is missing. Apply the seminary course schedule migration, then try again.';
    }
    if (err.code === 'P2022') {
      const column = typeof err.meta?.column === 'string' ? ` (${err.meta.column})` : '';
      return `The timetable database is missing a required column${column}. Apply the latest seminary course schedule migrations, then try again.`;
    }
    if (err.code === 'P2003') {
      return 'The selected course or instructor is no longer available. Refresh the page and choose it again.';
    }
    if (err.code === 'P2002') {
      return 'A schedule with the same unique details already exists.';
    }
    return `The database could not save this schedule (${err.code}): ${err.message}`;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return 'The schedule details use an invalid format. Please check the date, time, course, and instructor, then try again.';
  }

  return err instanceof Error
    ? `The schedule could not be saved: ${err.message}`
    : 'The schedule could not be saved because of an unknown server error.';
};

const ensureReferencesExist = async (courseId: string, instructorId: string) => {
  const [course, instructor] = await prisma.$transaction([
    prisma.seminaryCourse.findFirst({ where: { id: courseId, status: 'ACTIVE' }, select: { id: true } }),
    prisma.seminaryInstructor.findFirst({ where: { id: instructorId, status: { in: ['ACTIVE', 'PART_TIME'] } }, select: { id: true } }),
  ]);
  return { course, instructor };
};

const toScheduleDate = (value: Date | string, fieldName: string) => {
  const date = value instanceof Date
    ? value
    : new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid calendar date.`);
  }

  return date;
};

export const getSeminaryCourseSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryCourseSchedulesQuery;
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const where: Prisma.SeminaryCourseScheduleWhereInput = {
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(query.period ? { period: query.period } : {}),
      ...(query.className ? { className: query.className } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    if (user.role === UserType.INSTRUCTOR) {
      where.instructor = { userId: req.userId };
    } else if (user.role === UserType.MEMBER) {
      const enrollment = await prisma.seminaryApplication.findFirst({
        where: { member: { userId: req.userId }, status: 'ENROLLED' },
        orderBy: { updatedAt: 'desc' },
        select: { academicYear: true, programLevel: true },
      });
      if (!enrollment?.programLevel) {
        res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'No enrolled course schedules found', data: [] });
        return;
      }
      where.course = { program: enrollment.programLevel };
      if (enrollment.academicYear) where.academicYear = enrollment.academicYear;
    }

    const schedules = await prisma.seminaryCourseSchedule.findMany({
      where,
      include: includeScheduleDetails,
      orderBy: [{ scheduledDate: 'asc' }, { startTime: 'asc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedules retrieved successfully', data: schedules });
  } catch (err) {
    logger.error('Error while getting seminary course schedules', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

const persistSchedule = async (
  body: CreateSeminaryCourseScheduleBody,
  id?: string,
) => {
  const { course, instructor } = await ensureReferencesExist(body.courseId, body.instructorId);
  if (!course) return { error: 'The selected active course was not found' };
  if (!instructor) return { error: 'The selected active instructor was not found' };

  // HTML date inputs submit YYYY-MM-DD. Prisma DateTime fields require a full
  // timestamp, so normalize dates once before conflict detection and persistence.
  const scheduledDate = toScheduleDate(body.scheduledDate, 'Scheduled date');
  const recurrenceEndDate = body.recurrenceEndDate
    ? toScheduleDate(body.recurrenceEndDate, 'Recurrence end date')
    : undefined;
  const scheduleInput = { ...body, scheduledDate, recurrenceEndDate };

  const conflict = await findSeminaryScheduleConflict(scheduleInput, id);
  if (conflict) return { error: formatConflictMessage(conflict) };

  const data = {
    academicYear: body.academicYear,
    period: body.period,
    className: body.className,
    courseId: body.courseId,
    instructorId: body.instructorId,
    subjectName: body.subjectName,
    units: body.units,
    scheduledDate,
    recurrenceDays: body.recurrenceDays ?? [],
    recurrenceEndDate,
    startTime: body.startTime,
    endTime: body.endTime,
    deliveryMode: body.deliveryMode,
    location: body.location,
    meetingLink: body.meetingLink,
    status: body.status ?? 'SCHEDULED',
  };
  const schedule = id
    ? await prisma.seminaryCourseSchedule.update({ where: { id }, data, include: includeScheduleDetails })
    : await prisma.seminaryCourseSchedule.create({ data, include: includeScheduleDetails });
  return { schedule };
};

export const createSeminaryCourseSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await persistSchedule(req.body as CreateSeminaryCourseScheduleBody);
    if (result.error) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: result.error });
      return;
    }
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Course schedule created successfully', data: result.schedule });
  } catch (err) {
    const message = getSchedulePersistenceError(err);
    logger.error(`Error while creating seminary course schedule: ${message}`);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'SCHEDULE_CREATE_FAILED', message });
  }
};

export const updateSeminaryCourseSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const found = await prisma.seminaryCourseSchedule.findUnique({ where: { id }, select: { id: true } });
    if (!found) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Course schedule not found' });
      return;
    }
    const result = await persistSchedule(req.body as UpdateSeminaryCourseScheduleBody, id);
    if (result.error) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: result.error });
      return;
    }
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedule updated successfully', data: result.schedule });
  } catch (err) {
    const message = getSchedulePersistenceError(err);
    logger.error(`Error while updating seminary course schedule: ${message}`);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'SCHEDULE_UPDATE_FAILED', message });
  }
};

export const deleteSeminaryCourseSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.seminaryCourseSchedule.delete({ where: { id } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedule deleted successfully' });
  } catch (err) {
    logger.error('Error while deleting seminary course schedule', { err });
    res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Course schedule not found' });
  }
};
