/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { createOffice } from '@/controllers/v1/organization-chart/create-office';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { validate } from '@/common/sanitation';
import { createOfficeSchema } from '@/validators/organization-chart';

const router = Router();

/**
 * Routes
 */
router.post(
  '/create-office',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createOfficeSchema),
  createOffice,
);

export default router;
