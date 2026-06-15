/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { getCurrentSeminaryApplication } from '@/controllers/v1/seminary/get-current-seminary-application';
import { upsertCurrentSeminaryApplication } from '@/controllers/v1/seminary/upsert-current-seminary-application';
import { getAllSeminaryApplications } from '@/controllers/v1/seminary/get-all-seminary-applications';
import { getSeminaryApplicationById } from '@/controllers/v1/seminary/get-seminary-application-by-id';
import { updateSeminaryApplicationStatus } from '@/controllers/v1/seminary/update-seminary-application-status';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { UserType } from '@/generated/prisma/enums';
import {
  getAllSeminaryApplicationsSchema,
  getSeminaryApplicationByIdSchema,
  updateSeminaryApplicationStatusSchema,
  upsertCurrentSeminaryApplicationSchema,
} from '@/validators/seminary';

const router = Router();

router.get(
  '/current/application',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentSeminaryApplication,
);

router.put(
  '/current/application',
  expressRateLimit('basic'),
  validate(upsertCurrentSeminaryApplicationSchema),
  upsertCurrentSeminaryApplication,
);

router.use(
  '/requirements/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '16MB',
    maxFileCount: 1,
  }),
);

router.use(
  '/payment-receipts/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 1,
  }),
);

router.get(
  '/applications',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllSeminaryApplicationsSchema),
  getAllSeminaryApplications,
);

router.get(
  '/applications/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getSeminaryApplicationByIdSchema),
  getSeminaryApplicationById,
);

router.patch(
  '/applications/:id/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateSeminaryApplicationStatusSchema),
  updateSeminaryApplicationStatus,
);

export default router;
