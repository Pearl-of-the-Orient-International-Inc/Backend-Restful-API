import { Router } from 'express';

import { getBranchServiceById } from '@/controllers/v1/branch-service/get-branch-service-by-id';

import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { validateParams } from '@/common/sanitation';
import { branchServiceIdParamSchema } from '@/validators/branch-service';

const router = Router();

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  validateParams(branchServiceIdParamSchema),
  getBranchServiceById,
);

export default router;