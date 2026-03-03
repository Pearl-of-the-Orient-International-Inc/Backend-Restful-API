/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { createOffice } from '@/controllers/v1/organization-chart/create-office';
import { updateOffice } from '@/controllers/v1/organization-chart/update-office';
import { getAllOffices } from '@/controllers/v1/organization-chart/get-all-offices';
import { deleteOffice } from '@/controllers/v1/organization-chart/delete-office';
import { getOfficeById } from '@/controllers/v1/organization-chart/get-office-by-id';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import { UserType } from '@/generated/prisma/enums';
import authorize from '@/middlewares/authorization';
import { validate } from '@/common/sanitation';
import {
  createOfficeSchema,
  updateOfficeSchema,
  getAllOfficesSchema,
} from '@/validators/organization-chart';

const router = Router();

/**
 * Routes
 */
router.post(
  '/office',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createOfficeSchema),
  createOffice,
);

router.get(
  '/office', 
  expressRateLimit('basic'), 
  authenticate,
  validate(getAllOfficesSchema), 
  getAllOffices
);

router.get(
  '/office/:id',
  expressRateLimit('basic'),
  authenticate,
  getOfficeById,
);

router.put(
  '/office/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateOfficeSchema),
  updateOffice,
);

router.delete(
  '/office/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteOffice,
);

export default router;
