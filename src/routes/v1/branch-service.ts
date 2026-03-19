import { Router } from 'express';
import type { Request, Response } from 'express';

import { getBranchServiceById } from '@/controllers/v1/branch-service/get-branch-service-by-id';

import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { UserType } from '@/generated/prisma/enums'; 

import { validateParams, validate } from '@/common/sanitation';

import { 
  branchServiceIdParamSchema,
  createBranchServiceSchema,
  updateBranchServiceSchema 
} from '@/validators/branch-service';

const router = Router();

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  validateParams(branchServiceIdParamSchema),
  getBranchServiceById,
);

router.post(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createBranchServiceSchema),
  //controller here
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validateParams(branchServiceIdParamSchema),
  validate(updateBranchServiceSchema),
  //controller here
);

export default router;