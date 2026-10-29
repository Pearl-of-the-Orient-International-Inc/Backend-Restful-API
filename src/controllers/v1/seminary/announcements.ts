import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { SeminaryAnnouncementAudience, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

const includeCreator = {
  createdByUser: { select: { id: true, name: true } },
} satisfies Prisma.SeminaryAnnouncementInclude;

const audiencesForRole = (role: UserType): SeminaryAnnouncementAudience[] => {
  if (role === UserType.INSTRUCTOR) {
    return ['ALL', 'INSTRUCTORS', 'STUDENTS_AND_INSTRUCTORS'];
  }

  return ['ALL', 'STUDENTS', 'STUDENTS_AND_INSTRUCTORS'];
};

const getRouteId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const persistenceMessage = (err: unknown) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
    return 'The announcement calendar database table is missing. Apply the latest Seminary database migration, then try again.';
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return 'The announcement contains an invalid date or value. Please check the form and try again.';
  }

  return err instanceof Error
    ? `The announcement could not be saved: ${err.message}`
    : 'The announcement could not be saved because of an unknown server error.';
};

export const getSeminaryAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const where: Prisma.SeminaryAnnouncementWhereInput =
      user.role === UserType.ADMIN
        ? {}
        : {
            status: 'PUBLISHED',
            audience: { in: audiencesForRole(user.role) },
          };

    const announcements = await prisma.seminaryAnnouncement.findMany({
      where,
      include: includeCreator,
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Announcements retrieved successfully',
      data: announcements,
    });
  } catch (err) {
    logger.error('Error while getting Seminary announcements', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'ANNOUNCEMENTS_READ_FAILED',
      message: 'The announcement calendar could not be loaded. Please refresh and try again.',
    });
  }
};

export const createSeminaryAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcement = await prisma.seminaryAnnouncement.create({
      data: { ...req.body, createdByUserId: req.userId! },
      include: includeCreator,
    });
    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (err) {
    const message = persistenceMessage(err);
    logger.error(`Error while creating Seminary announcement: ${message}`);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'ANNOUNCEMENT_CREATE_FAILED', message });
  }
};

export const updateSeminaryAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getRouteId(req.params.id);
    const announcement = await prisma.seminaryAnnouncement.update({
      where: { id },
      data: req.body,
      include: includeCreator,
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Announcement not found' });
      return;
    }
    const message = persistenceMessage(err);
    logger.error(`Error while updating Seminary announcement: ${message}`);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'ANNOUNCEMENT_UPDATE_FAILED', message });
  }
};

export const deleteSeminaryAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getRouteId(req.params.id);
    await prisma.seminaryAnnouncement.delete({ where: { id } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Announcement deleted successfully' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Announcement not found' });
      return;
    }
    logger.error('Error while deleting Seminary announcement', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'ANNOUNCEMENT_DELETE_FAILED',
      message: 'The announcement could not be deleted. Please try again.',
    });
  }
};
