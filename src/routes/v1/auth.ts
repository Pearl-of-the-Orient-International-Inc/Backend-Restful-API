/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { register } from '@/controllers/v1/auth/register';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import { registerSchema } from '@/validators/auth';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';

const router = Router();

/**
 * Routes
 */
router.post(
  '/register',
  expressRateLimit('passwordReset'),
  validate(registerSchema),
  register,
);

export default router;
