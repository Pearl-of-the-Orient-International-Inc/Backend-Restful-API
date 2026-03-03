/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { createBranchService } from '@/controllers/v1/branch-service/create-branch-service';
import { getAllBranchServices } from '@/controllers/v1/branch-service/get-all-branch-services';
import { getBranchServiceById } from '@/controllers/v1/branch-service/get-branch-service-by-id';
import { updateBranchService } from '@/controllers/v1/branch-service/update-branch-service';
import { deleteBranchService } from '@/controllers/v1/branch-service/delete-branch-service';


/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { validate } from '@/common/sanitation';
import {
  createBranchServiceSchema,
  getAllBranchServicesSchema,
  updateBranchServiceSchema,
} from '@/validators/branch-service';

const router = Router();

/**
 * Routes
 */
router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createBranchServiceSchema),
  createBranchService,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  validate(getAllBranchServicesSchema),
  getAllBranchServices,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  getBranchServiceById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateBranchServiceSchema),
  updateBranchService,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteBranchService,
);

export default router;
