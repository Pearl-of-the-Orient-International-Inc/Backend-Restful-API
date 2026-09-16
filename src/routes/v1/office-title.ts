/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { createOfficeTitle } from '@/controllers/v1/office-title/create-office-title';
import { getAllOfficeTitles } from '@/controllers/v1/office-title/get-all-office-titles';
import { getOfficeTitleById } from '@/controllers/v1/office-title/get-office-title-by-id';
import { updateOfficeTitle } from '@/controllers/v1/office-title/update-office-title';
import { deleteOfficeTitle } from '@/controllers/v1/office-title/delete-office-title';
import { archiveOfficeTitle } from '@/controllers/v1/office-title/archive-office-title';
import { retrieveOfficeTitle } from '@/controllers/v1/office-title/retrieve-office-title';
import { getPublicOrganizationalStructure } from '@/controllers/v1/office-title/get-public-organizational-structure';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { validate } from '@/common/sanitation';
import {
  createOfficeTitleSchema,
  getAllOfficeTitlesSchema,
  updateOfficeTitleSchema,
} from '@/validators/office-title';

const router = Router();

router.get(
  '/public/organizational-structure',
  expressRateLimit('basic'),
  getPublicOrganizationalStructure,
);

router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createOfficeTitleSchema),
  createOfficeTitle,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllOfficeTitlesSchema),
  getAllOfficeTitles,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getOfficeTitleById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateOfficeTitleSchema),
  updateOfficeTitle,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteOfficeTitle,
);

router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  archiveOfficeTitle,
);

router.patch(
  '/:id/retrieve',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  retrieveOfficeTitle,
);

export default router;
