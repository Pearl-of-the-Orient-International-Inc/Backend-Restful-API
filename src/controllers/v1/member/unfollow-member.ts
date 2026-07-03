import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  getCurrentFollowerMember,
  getFollowTargetMember,
  sendMemberFollowState,
} from './member-follow-shared';

import type { Request, Response } from 'express';

export const unfollowMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const memberId = req.params.memberId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const [targetMember, followerMember] = await Promise.all([
      getFollowTargetMember(memberId),
      getCurrentFollowerMember(userId),
    ]);

    if (!targetMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member profile not found',
      });
      return;
    }

    if (!followerMember) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Only logged in members can follow profiles',
      });
      return;
    }

    await prisma.memberFollow.deleteMany({
      where: {
        userId,
        memberId: targetMember.id,
      },
    });

    await sendMemberFollowState({
      res,
      userId,
      memberId: targetMember.id,
      message: 'Member unfollowed successfully',
    });
  } catch (err) {
    logger.error('Error while unfollowing member', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
