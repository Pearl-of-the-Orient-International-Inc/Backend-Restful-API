/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { getCurrentUser } from '@/controllers/v1/user/get-current-user';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';

const router = Router();

/**
 * Routes
 */
router.get(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.ADMIN]),
  getCurrentUser,
);

export default router;
