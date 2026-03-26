import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { ActivityLogActionType } from '@/generated/prisma/client';
import { setActivityLogContext } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { restoreDatabaseBackupSnapshot } from './backup-database-shared';

export const restoreBackup = async (
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

    if (!snapshot) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Backup snapshot not found',
      });
      return;
    }

    if (!snapshot.fileUrl) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'This backup snapshot cannot be restored',
      });
      return;
    }

    await restoreDatabaseBackupSnapshot({
      snapshot,
      restoredByUserId: req.userId,
    });

    setActivityLogContext(req, {
      actionType: ActivityLogActionType.UPDATE,
      actionLabel: 'Restored database backup',
      moduleLabel: 'Backup Database',
      targetLabel: snapshot.fileName,
      description: `Restored the database using ${snapshot.fileName}.`,
      metadata: ['Database restore', 'JSON import'],
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Backup restored successfully',
      data: {
        id: snapshot.id,
        fileName: snapshot.fileName,
      },
    });
  } catch (err) {
    logger.error('Error while restoring backup snapshot', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Internal server error',
    });
  }
};
