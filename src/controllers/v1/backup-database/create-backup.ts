import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ActivityLogActionType,
  BackupSnapshotSource,
} from '@/generated/prisma/client';
import { setActivityLogContext } from '@/lib/activity-log';
import { logger } from '@/lib/winston';
import {
  createDatabaseBackupSnapshot,
  serializeBackupSnapshot,
} from './backup-database-shared';

export const createBackup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const snapshot = await createDatabaseBackupSnapshot({
      source: BackupSnapshotSource.MANUAL,
      createdByUserId: req.userId,
    });

    setActivityLogContext(req, {
      actionType: ActivityLogActionType.EXPORT,
      actionLabel: 'Created JSON backup',
      moduleLabel: 'Backup Database',
      targetLabel: snapshot.fileName,
      description: `Created the backup snapshot ${snapshot.fileName}.`,
      metadata: ['Manual backup', 'JSON export'],
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Backup created successfully',
      data: serializeBackupSnapshot(snapshot),
    });
  } catch (err) {
    logger.error('Error while creating backup snapshot', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Internal server error',
    });
  }
};
