import { Router } from 'express';
import { createBackup } from '@/controllers/v1/backup-database/create-backup';
import { downloadBackup } from '@/controllers/v1/backup-database/download-backup';
import { getBackupOverview } from '@/controllers/v1/backup-database/get-backup-overview';
import { restoreBackup } from '@/controllers/v1/backup-database/restore-backup';
import { updateBackupSettings } from '@/controllers/v1/backup-database/update-backup-settings';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  backupIdParamSchema,
  updateBackupSettingsSchema,
} from '@/validators/backup-database';

const router = Router();

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getBackupOverview,
);

router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  createBackup,
);

router.patch(
  '/settings',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateBackupSettingsSchema),
  updateBackupSettings,
);

router.post(
  '/:id/restore',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(backupIdParamSchema),
  restoreBackup,
);

router.get(
  '/:id/download',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(backupIdParamSchema),
  downloadBackup,
);

export default router;
