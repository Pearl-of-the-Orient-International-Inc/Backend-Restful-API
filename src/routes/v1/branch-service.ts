/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */


/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { validate } from '@/common/sanitation';
import {
  createOfficeSchema,
  updateOfficeSchema,
  getAllOfficesSchema,
} from '@/validators/organization-chart';

const router = Router();

/**
 * Routes
 */
router.post(
  '/branch-service/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
//   validate(createOfficeSchema),
//   createOffice,
);

export default router;
