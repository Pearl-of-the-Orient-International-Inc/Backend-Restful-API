import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  changeOwnerPin,
  getOwnerReport,
  getOwnerSession,
  loginOwner,
  logoutOwner,
  touchOwnerSession,
} from '@/controllers/v1/owner-access/owner-access.controller';
import { authenticateOwnerAccess } from '@/middlewares/owner-access';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  ownerChangePinSchema,
  ownerLoginSchema,
  ownerReportSchema,
} from '@/validators/owner-access';

const router = Router();

router.post(
  '/login',
  expressRateLimit('auth'),
  validate(ownerLoginSchema),
  loginOwner,
);
router.post('/logout', expressRateLimit('basic'), logoutOwner);
router.get(
  '/session',
  expressRateLimit('basic'),
  authenticateOwnerAccess,
  getOwnerSession,
);
router.post(
  '/touch',
  expressRateLimit('basic'),
  authenticateOwnerAccess,
  touchOwnerSession,
);
router.post(
  '/change-pin',
  expressRateLimit('auth'),
  authenticateOwnerAccess,
  validate(ownerChangePinSchema),
  changeOwnerPin,
);
router.get(
  '/report',
  expressRateLimit('basic'),
  authenticateOwnerAccess,
  validate(ownerReportSchema),
  getOwnerReport,
);

export default router;
