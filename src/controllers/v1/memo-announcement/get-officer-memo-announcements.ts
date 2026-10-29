import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { requireOfficerScope } from '@/lib/officer-scope';
import { prisma } from '@/lib/prisma';
import { memoInclude, serializeMemoAnnouncement } from './memo-announcement-shared';

export const getOfficerMemoAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    await requireOfficerScope(req.userId!);
    const memos = await prisma.memoAnnouncement.findMany({ where: { authorUserId: req.userId! }, orderBy: { updatedAt: 'desc' }, include: memoInclude });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Officer memo drafts retrieved successfully', data: memos.map(serializeMemoAnnouncement) });
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? Number((error as { statusCode: number }).statusCode) : HTTPSTATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ code: status === HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Internal server error' });
  }
};
