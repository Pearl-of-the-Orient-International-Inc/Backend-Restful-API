import { Router } from 'express';
import { getDashboardReport } from '@/controllers/v1/report/get-dashboard-report';
import { getMemberLocationReport } from '@/controllers/v1/report/get-member-location-report';
import { getMinistryReport } from '@/controllers/v1/report/get-ministry-report';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  getDashboardReportSchema,
  getMemberLocationReportSchema,
  getMinistryReportSchema,
} from '@/validators/report';

const router = Router();

router.get(
  '/dashboard',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getDashboardReportSchema),
  getDashboardReport,
);

router.get(
  '/dashboard/member-locations',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMemberLocationReportSchema),
  getMemberLocationReport,
);

router.get(
  '/ministry',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMinistryReportSchema),
  getMinistryReport,
);

export default router;
