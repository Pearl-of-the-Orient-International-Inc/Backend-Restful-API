import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus, MemberType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const eligibility = {
  isActive: true,
  status: MemberStatus.APPROVED,
  memberType: MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
} as const;

const getCurrentEligibleMember = async (userId?: string) => {
  if (!userId) return null;
  return prisma.member.findFirst({
    where: { userId, ...eligibility },
    select: { id: true, uniqueId: true },
  });
};

export const getPublicServiceAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.memberId;
    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Invalid member ID' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { OR: [{ id: memberId }, { uniqueId: memberId }], ...eligibility },
      select: { id: true },
    });
    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Eligible service chaplain not found' });
      return;
    }

    const slots = await prisma.chaplainServiceAvailability.findMany({
      where: { memberId: member.id, endsAt: { gt: new Date() } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, startsAt: true, endsAt: true, note: true },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Service availability retrieved successfully', data: slots });
  } catch (err) {
    logger.error('Error while retrieving public service availability', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const getCurrentServiceAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const member = await getCurrentEligibleMember(req.userId);
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
      return;
    }
    const slots = await prisma.chaplainServiceAvailability.findMany({
      where: { memberId: member.id, endsAt: { gt: new Date() } },
      orderBy: { startsAt: 'asc' },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Service availability retrieved successfully', data: slots });
  } catch (err) {
    logger.error('Error while retrieving current service availability', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const createCurrentServiceAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const member = await getCurrentEligibleMember(req.userId);
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
      return;
    }

    const startsAt = new Date(req.body.startsAt);
    const endsAt = new Date(req.body.endsAt);
    if (startsAt <= new Date()) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Availability must start in the future' });
      return;
    }

    const overlapping = await prisma.chaplainServiceAvailability.findFirst({
      where: { memberId: member.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      select: { id: true },
    });
    if (overlapping) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'AVAILABILITY_CONFLICT', message: 'This availability overlaps an existing time slot' });
      return;
    }

    const slot = await prisma.chaplainServiceAvailability.create({
      data: { memberId: member.id, startsAt, endsAt, note: req.body.note?.trim() || null },
    });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Availability added successfully', data: slot });
  } catch (err) {
    logger.error('Error while creating service availability', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const deleteCurrentServiceAvailability = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const member = await getCurrentEligibleMember(req.userId);
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
      return;
    }
    const slotId = req.params.slotId;
    if (!slotId || Array.isArray(slotId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Invalid availability ID' });
      return;
    }
    const result = await prisma.chaplainServiceAvailability.deleteMany({ where: { id: slotId, memberId: member.id } });
    if (result.count === 0) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Availability slot not found' });
      return;
    }
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Availability removed successfully' });
  } catch (err) {
    logger.error('Error while deleting service availability', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
