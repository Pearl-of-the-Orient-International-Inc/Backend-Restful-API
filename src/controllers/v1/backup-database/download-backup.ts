import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ActivityLogActionType,
  ActivityLogResult,
} from '@/generated/prisma/client';
import { createActivityLog } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getClientIp, parseUserAgent } from '@/lib/helpers';

export const downloadBackup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid backup ID is required',
      });
      return;
    }

    const snapshot = await prisma.databaseBackupSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot || !snapshot.fileUrl) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Backup snapshot not found',
      });
      return;
    }

    if (req.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      if (user) {
        await createActivityLog({
          userId: user.id,
          actorName: user.name,
          actorEmail: user.email,
          actorAvatar: user.avatar,
          actionType: ActivityLogActionType.EXPORT,
          actionLabel: 'Downloaded backup file',
          moduleLabel: 'Backup Database',
          targetLabel: snapshot.fileName,
          description: `Downloaded the backup snapshot ${snapshot.fileName}.`,
          result: ActivityLogResult.SUCCESS,
          ipAddress: getClientIp(req) ?? null,
          deviceLabel: parseUserAgent(req.headers['user-agent'] ?? null) ?? null,
          metadata: ['Backup download', 'JSON export'],
        });
      }
    }

    const fileResponse = await fetch(snapshot.fileUrl);

    if (!fileResponse.ok) {
      res.status(HTTPSTATUS.BAD_GATEWAY).json({
        code: 'BAD_GATEWAY',
        message: 'Unable to fetch backup file from storage',
      });
      return;
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${snapshot.fileName}"`,
    );
    res.setHeader('Content-Length', String(fileBuffer.byteLength));
    res.status(HTTPSTATUS.OK).send(fileBuffer);
  } catch (err) {
    logger.error('Error while preparing backup download', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
