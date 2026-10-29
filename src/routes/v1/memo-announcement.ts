import { Router } from 'express';
import { validate } from '@/common/sanitation';
import { archiveMemoAnnouncement } from '@/controllers/v1/memo-announcement/archive-memo-announcement';
import { deleteMemoAnnouncement } from '@/controllers/v1/memo-announcement/delete-memo-announcement';
import { getMemoAnnouncementById } from '@/controllers/v1/memo-announcement/get-memo-announcement-by-id';
import { getMemoAnnouncements } from '@/controllers/v1/memo-announcement/get-memo-announcements';
import { publishMemoAnnouncement } from '@/controllers/v1/memo-announcement/publish-memo-announcement';
import { restoreMemoAnnouncement } from '@/controllers/v1/memo-announcement/restore-memo-announcement';
import { searchMemoRecipients } from '@/controllers/v1/memo-announcement/search-memo-recipients';
import { updateMemoAnnouncement } from '@/controllers/v1/memo-announcement/update-memo-announcement';
import { createOfficerMemoAnnouncement } from '@/controllers/v1/memo-announcement/create-officer-memo-announcement';
import { getOfficerMemoAnnouncements } from '@/controllers/v1/memo-announcement/get-officer-memo-announcements';
import { createMemoAnnouncement } from '@/controllers/v1/memo-announcement/create-memo-announcement';
import { rejectMemoAnnouncement } from '@/controllers/v1/memo-announcement/reject-memo-announcement';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createOfficerMemoAnnouncementSchema,
  createMemoAnnouncementSchema,
  getMemoAnnouncementsSchema,
  publishMemoAnnouncementSchema,
  searchMemoRecipientsSchema,
  updateMemoAnnouncementSchema,
} from '@/validators/memo-announcement';

const router = Router();

router.get(
  '/officer',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.OFFICER]),
  getOfficerMemoAnnouncements,
);

router.post(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createMemoAnnouncementSchema),
  createMemoAnnouncement,
);

router.post(
  '/officer',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.OFFICER]),
  validate(createOfficerMemoAnnouncementSchema),
  createOfficerMemoAnnouncement,
);

router.post(
  '/:id/reject',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  rejectMemoAnnouncement,
);

router.get(
  '/recipients/search',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(searchMemoRecipientsSchema),
  searchMemoRecipients,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMemoAnnouncementsSchema),
  getMemoAnnouncements,
);


router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getMemoAnnouncementById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateMemoAnnouncementSchema),
  updateMemoAnnouncement,
);

router.post(
  '/:id/publish',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(publishMemoAnnouncementSchema),
  publishMemoAnnouncement,
);

router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  archiveMemoAnnouncement,
);

router.patch(
  '/:id/restore',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  restoreMemoAnnouncement,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteMemoAnnouncement,
);

export default router;
