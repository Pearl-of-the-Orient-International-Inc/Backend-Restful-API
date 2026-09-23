import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { ChaplainServiceBody } from '@/validators/chaplain-service';
import { MemberStatus, MemberType } from '@/generated/prisma/enums';

const serialize = (service: Awaited<ReturnType<typeof prisma.chaplainService.findFirstOrThrow>>) => ({
  ...service,
  commissionPercent:
    service.commissionPercent === null ? null : Number(service.commissionPercent),
});

const toWriteData = (body: ChaplainServiceBody) => ({
  name: body.name.trim(),
  description: body.description.trim(),
  availability: body.availability?.trim() || null,
  commissionPercent: body.commissionPercent ?? null,
  maxConcurrentBookings: body.maxConcurrentBookings,
  sharedResourceName: body.sharedResourceName?.trim() || null,
  sharedResourceKey:
    body.sharedResourceName?.trim().replace(/\s+/g, ' ').toLowerCase() || null,
  sharedResourceCapacity: body.sharedResourceName?.trim()
    ? (body.sharedResourceCapacity ?? 1)
    : null,
  isActive: body.isActive,
  sortOrder: body.sortOrder,
});

const getId = (req: Request): string | null => {
  const id = req.params.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
};

export const getChaplainServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const services = await prisma.chaplainService.findMany({
      where: typeof isActive === 'boolean' ? { isActive } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Chaplain services retrieved successfully', data: services.map(serialize) });
  } catch (err) {
    logger.error('Error while retrieving chaplain services', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const getPublicChaplainServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await prisma.chaplainService.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Public chaplain services retrieved successfully', data: services.map(serialize) });
  } catch (err) {
    logger.error('Error while retrieving public chaplain services', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const getEligibleServiceChaplains = async (_req: Request, res: Response): Promise<void> => {
  try {
    const members = await prisma.member.findMany({
      where: { isActive: true, status: MemberStatus.APPROVED, memberType: MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, region: true, province: true, municipalityCity: true, user: { select: { avatar: true } }, officerAssignments: { where: { isActive: true }, select: { officeTitle: { select: { name: true } } }, take: 1 } },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Eligible service chaplains retrieved successfully', data: members });
  } catch (err) {
    logger.error('Error while retrieving eligible service chaplains', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const createChaplainService = async (req: Request, res: Response): Promise<void> => {
  try {
    const service = await prisma.chaplainService.create({ data: toWriteData(req.body as ChaplainServiceBody) });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Chaplain service created successfully', data: serialize(service) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'A service with this name already exists' });
      return;
    }
    logger.error('Error while creating chaplain service', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const updateChaplainService = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    if (!id) { res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Service ID is required' }); return; }
    const service = await prisma.chaplainService.update({ where: { id }, data: toWriteData(req.body as ChaplainServiceBody) });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Chaplain service updated successfully', data: serialize(service) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') { res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'A service with this name already exists' }); return; }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Chaplain service not found' }); return; }
    logger.error('Error while updating chaplain service', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
