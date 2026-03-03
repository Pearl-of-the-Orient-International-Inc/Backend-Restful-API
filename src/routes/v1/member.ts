/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { applyMember } from '@/controllers/v1/member/apply-member';
import { updateMemberStatus } from '@/controllers/v1/member/update-member-status';
import { getPendingMembers } from '@/controllers/v1/member/get-pending-members';
import { getAllMembers } from '@/controllers/v1/member/get-all-members';
import { archiveMember } from '@/controllers/v1/member/archive-member';
import { retrieveMember } from '@/controllers/v1/member/retrieve-member';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { UserType } from '@/generated/prisma/enums';
import { validate } from '@/common/sanitation';
import {
  applyMemberSchema,
  getAllMembersSchema,
  updateMemberStatusSchema,
} from '@/validators/member';

const router = Router();

router.post(
  '/apply',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(applyMemberSchema),
  applyMember,
);

router.patch(
  '/:id/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateMemberStatusSchema),
  updateMemberStatus,
);

router.get(
  '/pending',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllMembersSchema),
  getPendingMembers,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllMembersSchema),
  getAllMembers,
);

router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  archiveMember,
);

router.patch(
  '/:id/retrieve',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  retrieveMember,
);

export default router;
