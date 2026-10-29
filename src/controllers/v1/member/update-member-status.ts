/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';
import { MemberStatus, UserAccountStatus } from '@/generated/prisma/enums';

/**
 * Types
 */
import type { Request, Response } from 'express';
import { Prisma } from '@/generated/prisma/client';
import type { UpdateMemberStatusBody } from './types';
import { awardReferralPoints } from './referrals';

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
      select: {
        id: true,
        status: true,
        isActive: true,
        uniqueId: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!existingMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const updatedMember = await prisma.$transaction(
      async (tx) => {
        let nextUniqueId = existingMember.uniqueId;
        if (status === MemberStatus.APPROVED && !existingMember.uniqueId) {
          nextUniqueId = await generateNextMemberUniqueId(existingMember.user.role, tx);
        }

        const updated = await tx.member.update({
          where: { id: memberId },
          data: {
            status,
            uniqueId: nextUniqueId,
            user: {
              update:
                status === MemberStatus.APPROVED
                  ? { accountStatus: UserAccountStatus.ACTIVE }
                  : {},
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                accountStatus: true,
              },
            },
          },
        });
        if (status === MemberStatus.APPROVED && existingMember.status !== MemberStatus.APPROVED) {
          await awardReferralPoints(tx, {
            referredMemberId: memberId,
            criterionKey: 'MEMBER_APPROVED',
            sourceType: 'MEMBER_STATUS',
            sourceId: memberId,
            createdByUserId: req.userId,
          });
        }
        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

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
