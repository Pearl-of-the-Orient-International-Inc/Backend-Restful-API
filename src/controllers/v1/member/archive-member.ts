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

export const archiveMember = async (
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

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, isActive: true },
    });

    if (!existingMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    if (!existingMember.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Member is already archived',
      });
      return;
    }

    const archivedMember = await prisma.member.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    logger.info('Member archived', { memberId });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member archived successfully',
      data: archivedMember,
    });
  } catch (err) {
    logger.error('Error while archiving member', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
