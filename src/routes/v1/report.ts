import { Router } from 'express';
import { getMinistryReport } from '@/controllers/v1/report/get-ministry-report';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { getMinistryReportSchema } from '@/validators/report';

const router = Router();

router.get(
  '/ministry',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMinistryReportSchema),
  getMinistryReport,
);

export default router;
