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

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';

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
