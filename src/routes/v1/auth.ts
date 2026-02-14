/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { register } from '@/controllers/v1/auth/register';
import { login } from '@/controllers/v1/auth/login';
import { logout } from '@/controllers/v1/auth/logout';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import { loginSchema, registerSchema } from '@/validators/auth';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';

const router = Router();

/**
 * Routes
 */
router.post(
  '/register',
  expressRateLimit('auth'),
  validate(registerSchema),
  register,
);
router.post('/login', expressRateLimit('auth'), validate(loginSchema), login);
router.delete('/logout', expressRateLimit('basic'), authenticate, logout);

export default router;
