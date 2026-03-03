/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { UpdateMemberStatusBody } from './types';

export const updateMemberStatus = async (
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

    const { status } = req.body as UpdateMemberStatusBody;

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, status: true, isActive: true },
    });

    if (!existingMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    logger.info('Member status updated', {
      memberId,
      from: existingMember.status,
      to: status,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member status updated successfully',
      data: updatedMember,
    });
  } catch (err) {
    logger.error('Error while updating member status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
