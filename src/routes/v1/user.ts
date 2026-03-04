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
import { getUserSessions } from '@/controllers/v1/user/get-user-sessions';
import { revokeUserSession } from '@/controllers/v1/user/revoke-user-session';
import { revokeOtherUserSessions } from '@/controllers/v1/user/revoke-other-user-sessions';

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

router.put(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.ADMIN]),
  updateCurrentUser,
);

router.delete(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.ADMIN]),
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
  authorize([UserType.MEMBER, UserType.ADMIN]),
  getUserSessions,
);

router.delete(
  '/sessions/others',
  expressRateLimit('basic'),
  authenticate,
  getSessionFromCookie,
  authorize([UserType.MEMBER, UserType.ADMIN]),
  revokeOtherUserSessions,
);

router.delete(
  '/sessions/:sessionId',
  expressRateLimit('basic'),
  authenticate,
  getSessionFromCookie,
  authorize([UserType.MEMBER, UserType.ADMIN]),
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

router.get(
  '/:userId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getUserById,
);

router.delete(
  '/:userId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteUserById,
);

export default router;
