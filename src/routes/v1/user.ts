/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { getCurrentUser } from '@/controllers/v1/user/get-current-user';
import { updateCurrentUser } from '@/controllers/v1/user/update-current-user';
import { deleteCurrentUser } from '@/controllers/v1/user/delete-current-user';
import { getAllUsers } from '@/controllers/v1/user/get-all-users';
import { getUserById } from '@/controllers/v1/user/get-user-by-id';
import { deleteUserById } from '@/controllers/v1/user/delete-user-by-id';
import { createUserAccount } from '@/controllers/v1/user/create-user-account';
import { updateUserById } from '@/controllers/v1/user/update-user-by-id';
import { getUserSessions } from '@/controllers/v1/user/get-user-sessions';
import { revokeUserSession } from '@/controllers/v1/user/revoke-user-session';
import { revokeOtherUserSessions } from '@/controllers/v1/user/revoke-other-user-sessions';
import { changeUserPasswordByAdmin } from '@/controllers/v1/user/change-user-password-by-admin';
import { resendUserEmailVerificationByAdmin } from '@/controllers/v1/user/resend-user-email-verification-by-admin';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { getSessionFromCookie } from '@/middlewares/get-session-from-cookie';
import { validate } from '@/common/sanitation';
import { sessionIdPathSchema } from '@/validators/session';
import {
  changeUserPasswordByAdminSchema,
  createUserAccountSchema,
  updateUserByIdSchema,
} from '@/validators/user';

const router = Router();
const authenticatedUserRoles = [
  UserType.MEMBER,
  UserType.OFFICER,
  UserType.ADMIN,
  UserType.INSTRUCTOR,
];

/**
 * Routes
 */
router.get(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize(authenticatedUserRoles),
  getCurrentUser,
);

router.put(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize(authenticatedUserRoles),
  updateCurrentUser,
);

router.delete(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize(authenticatedUserRoles),
  deleteCurrentUser,
);

router.use(
  '/avatar/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '4MB',
    maxFileCount: 1,
  }),
);

router.get(
  '/sessions',
  expressRateLimit('basic'),
  authenticate,
  getSessionFromCookie,
  authorize(authenticatedUserRoles),
  getUserSessions,
);

router.delete(
  '/sessions/others',
  expressRateLimit('basic'),
  authenticate,
  getSessionFromCookie,
  authorize(authenticatedUserRoles),
  revokeOtherUserSessions,
);

router.delete(
  '/sessions/:sessionId',
  expressRateLimit('basic'),
  authenticate,
  getSessionFromCookie,
  authorize(authenticatedUserRoles),
  validate(sessionIdPathSchema),
  revokeUserSession,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getAllUsers,
);

router.post(
  '/',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createUserAccountSchema),
  createUserAccount,
);

router.get(
  '/:userId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getUserById,
);

router.put(
  '/:userId',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateUserByIdSchema),
  updateUserById,
);

router.post(
  '/:userId/change-password',
  expressRateLimit('passwordReset'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(changeUserPasswordByAdminSchema),
  changeUserPasswordByAdmin,
);

router.post(
  '/:userId/resend-email-verification',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  resendUserEmailVerificationByAdmin,
);

router.delete(
  '/:userId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteUserById,
);

export default router;
