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
import { refreshToken } from '@/controllers/v1/auth/refresh-token';
import { forgotPassword } from '@/controllers/v1/auth/forgot-password';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from '@/validators/auth';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { getSessionFromCookie } from '@/middlewares/get-session-from-cookie';

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
router.get(
  '/refresh-token',
  expressRateLimit('basic'),
  getSessionFromCookie,
  refreshToken,
);
router.post(
  '/forgot-password',
  expressRateLimit('passwordReset'),
  validate(forgotPasswordSchema),
  forgotPassword,
);

export default router;
