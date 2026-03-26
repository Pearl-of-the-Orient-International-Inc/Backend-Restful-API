import config from '@/config';
import { logger } from '@/lib/winston';
import { maybeRunAutomaticBackup } from '@/controllers/v1/backup-database/backup-database-shared';

const MIN_INTERVAL_MS = 15_000;

let backupSchedulerTimer: NodeJS.Timeout | null = null;

const resolveIntervalMs = () => {
  const rawInterval = Number(config.BACKUP_SCHEDULER_INTERVAL_MS);

  if (!Number.isFinite(rawInterval) || rawInterval < MIN_INTERVAL_MS) {
    return MIN_INTERVAL_MS;
  }

  return rawInterval;
};

const runBackupSchedulerTick = async () => {
  try {
    await maybeRunAutomaticBackup({
      trigger: 'scheduler',
    });
  } catch (error) {
    logger.error('Backup scheduler tick failed', { error });
  }
};

export const startBackupDatabaseScheduler = () => {
  if (backupSchedulerTimer) {
    return;
  }

  const intervalMs = resolveIntervalMs();

  void runBackupSchedulerTick();

  backupSchedulerTimer = setInterval(() => {
    void runBackupSchedulerTick();
  }, intervalMs);

  logger.info(`Backup scheduler started with ${intervalMs}ms interval`);
};

export const stopBackupDatabaseScheduler = () => {
  if (!backupSchedulerTimer) {
    return;
  }

  clearInterval(backupSchedulerTimer);
  backupSchedulerTimer = null;
  logger.info('Backup scheduler stopped');
};
