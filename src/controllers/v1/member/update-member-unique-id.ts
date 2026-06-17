import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { ensureItAdmin } from './member-admin-guards';

import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { updateMemberUniqueIdSchema } from '@/validators/member';
import type { z } from 'zod';

type UpdateMemberUniqueIdBody = z.infer<typeof updateMemberUniqueIdSchema>['body'];

const isUniqueIdConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const prismaError = error as Prisma.PrismaClientKnownRequestError;
  const target = prismaError.meta?.target;
  const normalizedTarget = Array.isArray(target)
    ? target.join(',').toLowerCase()
    : String(target ?? '').toLowerCase();

  return prismaError.code === 'P2002' && normalizedTarget.includes('uniqueid');
};

export const updateMemberUniqueId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    if (!(await ensureItAdmin(req.userId, res))) {
      return;
    }

    const { uniqueId } = req.body as UpdateMemberUniqueIdBody;
    const normalizedUniqueId = uniqueId.trim();

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, uniqueId: true },
    });

    if (!existingMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    if (existingMember.uniqueId === normalizedUniqueId) {
      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Member ID is unchanged',
        data: existingMember,
      });
      return;
    }

    const duplicateMember = await prisma.member.findFirst({
      where: {
        uniqueId: normalizedUniqueId,
        id: { not: memberId },
      },
      select: { id: true },
    });

    if (duplicateMember) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Member ID already exists',
      });
      return;
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { uniqueId: normalizedUniqueId },
      include: {
        ministerialExperiences: { orderBy: { order: 'asc' } },
        characterReferences: { orderBy: { order: 'asc' } },
        preferredBranches: { select: { id: true, title: true } },
        signature: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    logger.info('Member unique ID updated by IT admin', {
      memberId,
      uniqueId: normalizedUniqueId,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member ID updated successfully',
      data: updatedMember,
    });
  } catch (err) {
    if (isUniqueIdConflict(err)) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Member ID already exists',
      });
      return;
    }

    logger.error('Error while updating member unique ID', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
