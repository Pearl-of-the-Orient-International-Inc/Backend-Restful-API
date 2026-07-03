import { HTTPSTATUS } from '@/common/http-codes';
import { logger } from '@/lib/winston';
import {
  getCurrentFollowerMember,
  getFollowTargetMember,
  sendMemberFollowState,
} from './member-follow-shared';

import type { Request, Response } from 'express';

export const getMemberFollowStatus = async (
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

    await sendMemberFollowState({
      res,
      userId,
      memberId: targetMember.id,
      message: 'Follow status retrieved successfully',
    });
  } catch (err) {
    logger.error('Error while getting member follow status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
