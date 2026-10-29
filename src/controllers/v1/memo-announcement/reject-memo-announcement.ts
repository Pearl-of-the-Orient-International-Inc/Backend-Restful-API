import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemoStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { memoInclude, serializeMemoAnnouncement } from './memo-announcement-shared';

export const rejectMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const reviewNotes =
    typeof req.body?.reviewNotes === 'string' ? req.body.reviewNotes.trim() : '';

  const memo = await prisma.memoAnnouncement.findUnique({
    where: { id },
    select: { id: true, status: true, authorUserId: true },
  });

  if (!memo) {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      code: 'NOT_FOUND',
      message: 'Memo announcement not found',
    });
    return;
  }

  if (!memo.authorUserId) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({
      code: 'BAD_REQUEST',
      message: 'Only officer-submitted memos can be rejected through review.',
    });
    return;
  }

  if (memo.status !== MemoStatus.DRAFT) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({
      code: 'BAD_REQUEST',
      message: 'Only draft memos can be rejected.',
    });
    return;
  }

  const rejected = await prisma.memoAnnouncement.update({
    where: { id: memo.id },
    data: {
      status: MemoStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedByUserId: req.userId ?? null,
      reviewNotes: reviewNotes || null,
    },
    include: memoInclude,
  });

  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Officer memo rejected',
    data: serializeMemoAnnouncement(rejected),
  });
};
