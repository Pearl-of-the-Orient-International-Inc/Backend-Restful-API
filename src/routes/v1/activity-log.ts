import { Router } from 'express';
import { deleteActivityLog } from '@/controllers/v1/activity-log/delete-activity-log';
import { getAllActivityLogs } from '@/controllers/v1/activity-log/get-all-activity-logs';
import { getCurrentUserActivityLogs } from '@/controllers/v1/activity-log/get-current-user-activity-logs';
import { getUserActivityLogs } from '@/controllers/v1/activity-log/get-user-activity-logs';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  deleteActivityLogSchema,
  getAllActivityLogsSchema,
  getCurrentUserActivityLogsSchema,
  getUserActivityLogsSchema,
} from '@/validators/activity-log';

const router = Router();

router.get(
  '/current',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.ADMIN]),
  validate(getCurrentUserActivityLogsSchema),
  getCurrentUserActivityLogs,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllActivityLogsSchema),
  getAllActivityLogs,
);

router.get(
  '/users/:userId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getUserActivityLogsSchema),
  getUserActivityLogs,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(deleteActivityLogSchema),
  deleteActivityLog,
);

export default router;
