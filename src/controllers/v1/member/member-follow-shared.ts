import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';

import type { Response } from 'express';

export const getFollowTargetMember = async (memberId: string) =>
  prisma.member.findFirst({
    where: {
      OR: [{ id: memberId }, { uniqueId: memberId }],
    },
    select: {
      id: true,
      uniqueId: true,
      userId: true,
    },
  });

export const getCurrentFollowerMember = async (userId: string) =>
  prisma.member.findUnique({
    where: { userId },
    select: {
      id: true,
      uniqueId: true,
    },
  });

export const sendMemberFollowState = async ({
  res,
  userId,
  memberId,
  message,
}: {
  res: Response;
  userId: string;
  memberId: string;
  message: string;
}) => {
  const [follow, followerCount] = await Promise.all([
    prisma.memberFollow.findUnique({
      where: {
        userId_memberId: {
          userId,
          memberId,
        },
      },
      select: { id: true },
    }),
    prisma.memberFollow.count({
      where: { memberId },
    }),
  ]);

  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message,
    data: {
      isFollowing: Boolean(follow),
      followerCount,
    },
  });
};
