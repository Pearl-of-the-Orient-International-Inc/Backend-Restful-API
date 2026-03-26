import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ActivityLogActionType,
  BackupFrequency,
} from '@/generated/prisma/client';
import { setActivityLogContext } from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { UpdateBackupSettingsSchema } from '@/validators/backup-database';
import {
  calculateNextBackupRun,
  getOrCreateBackupSettings,
} from './backup-database-shared';

export const updateBackupSettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as UpdateBackupSettingsSchema;
    const settings = await getOrCreateBackupSettings();

    const updatedSettings = await prisma.databaseBackupSettings.update({
      where: { id: settings.id },
      data: {
        automaticBackupEnabled: payload.automaticBackupEnabled,
        frequency: payload.frequency as BackupFrequency,
        retentionDays: payload.retentionDays,
        nextRunAt: payload.automaticBackupEnabled
          ? calculateNextBackupRun(payload.frequency as BackupFrequency)
          : null,
        lastUpdatedByUserId: req.userId ?? null,
      },
    });

    setActivityLogContext(req, {
      actionType: ActivityLogActionType.UPDATE,
      actionLabel: 'Updated backup settings',
      moduleLabel: 'Backup Database',
      targetLabel: 'Automatic backup settings',
      description: 'Updated the backup schedule and retention settings.',
      metadata: [
        payload.automaticBackupEnabled ? 'Automatic backup enabled' : 'Automatic backup disabled',
        `Frequency: ${payload.frequency}`,
        `Retention: ${payload.retentionDays} days`,
      ],
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Backup settings updated successfully',
      data: {
        automaticBackupEnabled: updatedSettings.automaticBackupEnabled,
        frequency: updatedSettings.frequency,
        retentionDays: updatedSettings.retentionDays,
        nextRunAt: updatedSettings.nextRunAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    logger.error('Error while updating backup settings', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
