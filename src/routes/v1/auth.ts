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
import { resetPassword } from '@/controllers/v1/auth/reset-password';
import { verifyEmail } from '@/controllers/v1/auth/verify-email';
import { resendVerification } from '@/controllers/v1/auth/resend-verification';
import { verifyPassword } from '@/controllers/v1/auth/verify-password';
import { changePassword } from '@/controllers/v1/auth/change-password';
import { setupTwoFactor } from '@/controllers/v1/auth/setup-two-factor';
import { enableTwoFactor } from '@/controllers/v1/auth/enable-two-factor';
import { disableTwoFactor } from '@/controllers/v1/auth/disable-two-factor';
import { verifyTwoFactor } from '@/controllers/v1/auth/verify-two-factor';
import {
  getPasskeyAuthenticationOptions,
  getPasskeyRegistrationOptions,
  getPasskeyStatus,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from '@/controllers/v1/auth/passkey';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import {
  forgotPasswordSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyPasswordSchema,
  verificationEmailSchema,
  twoFactorEnableSchema,
  verifyTwoFactorSchema,
  passkeyRegistrationOptionsSchema,
  passkeyRegistrationVerifySchema,
  passkeyAuthenticationOptionsSchema,
  passkeyAuthenticationVerifySchema,
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
router.post(
  '/verify-two-factor',
  expressRateLimit('auth'),
  validate(verifyTwoFactorSchema),
  verifyTwoFactor,
);
router.delete('/logout', expressRateLimit('basic'), authenticate, logout);
router.get(
  '/refresh-token',
  expressRateLimit('basic'),
  getSessionFromCookie,
  refreshToken,
);
router.post(
  '/forgot-password',
  expressRateLimit('basic'),
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  '/reset-password',
  expressRateLimit('passwordReset'),
  validate(resetPasswordSchema),
  resetPassword,
);

router.post(
  '/verify-email',
  expressRateLimit('auth'),
  validate(verificationEmailSchema),
  verifyEmail,
);

router.post(
  '/resend-email-verification',
  expressRateLimit('auth'),
  validate(resendVerificationSchema),
  resendVerification,
);

router.post(
  '/verify-password',
  expressRateLimit('basic'),
  authenticate,
  validate(verifyPasswordSchema),
  verifyPassword,
);

router.post(
  '/change-password',
  expressRateLimit('passwordReset'),
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

router.post(
  '/two-factor/setup',
  expressRateLimit('basic'),
  authenticate,
  setupTwoFactor,
);

router.post(
  '/two-factor/enable',
  expressRateLimit('basic'),
  authenticate,
  validate(twoFactorEnableSchema),
  enableTwoFactor,
);

router.post(
  '/two-factor/disable',
  expressRateLimit('basic'),
  authenticate,
  disableTwoFactor,
);

router.get(
  '/passkey/status',
  expressRateLimit('basic'),
  authenticate,
  getPasskeyStatus,
);

router.post(
  '/passkey/register/options',
  expressRateLimit('basic'),
  authenticate,
  validate(passkeyRegistrationOptionsSchema),
  getPasskeyRegistrationOptions,
);

router.post(
  '/passkey/register/verify',
  expressRateLimit('basic'),
  authenticate,
  validate(passkeyRegistrationVerifySchema),
  verifyPasskeyRegistration,
);

router.post(
  '/passkey/authenticate/options',
  expressRateLimit('auth'),
  validate(passkeyAuthenticationOptionsSchema),
  getPasskeyAuthenticationOptions,
);

router.post(
  '/passkey/authenticate/verify',
  expressRateLimit('auth'),
  validate(passkeyAuthenticationVerifySchema),
  verifyPasskeyAuthentication,
);

export default router;
