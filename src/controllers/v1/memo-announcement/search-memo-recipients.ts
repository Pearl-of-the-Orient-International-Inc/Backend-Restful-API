import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const fullName = (member: {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  extensionName: string | null;
  user: { name: string };
}) =>
  [
    member.firstName,
    member.middleInitial ? `${member.middleInitial.replace(/\.$/, '')}.` : null,
    member.lastName,
    member.extensionName,
  ]
    .filter(Boolean)
    .join(' ') || member.user.name;

export const searchMemoRecipients = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);

    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        status: MemberStatus.APPROVED,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        memberType: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: limit,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo recipients retrieved successfully',
      data: [
        ...members.map((member) => ({
          id: member.id,
          type: 'MEMBER',
          name: fullName(member),
          email: member.user.email,
          avatar: member.user.avatar,
          label: 'Member',
          meta: `${member.memberType} / ${member.status}`,
        })),
      ],
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during memo recipient search', err);
  }
};
