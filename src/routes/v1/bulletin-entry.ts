import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  archiveBulletinEntry,
  createBulletinEntry,
  getPublicBulletinEntry,
  getBulletinEntries,
  getPublicBulletinEntries,
  publishBulletinEntry,
  restoreBulletinEntry,
  unpublishBulletinEntry,
  updateBulletinEntry,
} from '@/controllers/v1/bulletin-entry/bulletin-entry.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createBulletinEntrySchema,
  getBulletinEntriesSchema,
  updateBulletinEntrySchema,
} from '@/validators/bulletin-entry';

const router = Router();
const adminAccess = [authenticate, authorize([UserType.ADMIN])];

router.get('/public', expressRateLimit('basic'), getPublicBulletinEntries);
router.get('/public/:id', expressRateLimit('basic'), getPublicBulletinEntry);
router.get(
  '/',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(getBulletinEntriesSchema),
  getBulletinEntries,
);
router.post(
  '/',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(createBulletinEntrySchema),
  createBulletinEntry,
);
router.put(
  '/:id',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(updateBulletinEntrySchema),
  updateBulletinEntry,
);
router.patch(
  '/:id/publish',
  expressRateLimit('basic'),
  ...adminAccess,
  publishBulletinEntry,
);
router.patch(
  '/:id/unpublish',
  expressRateLimit('basic'),
  ...adminAccess,
  unpublishBulletinEntry,
);
router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  ...adminAccess,
  archiveBulletinEntry,
);
router.patch(
  '/:id/restore',
  expressRateLimit('basic'),
  ...adminAccess,
  restoreBulletinEntry,
);

export default router;
