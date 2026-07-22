import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createAccountingPayable,
  deleteAccountingPayable,
  getAccountingPayableById,
  getAccountingPayables,
  recordAccountingPayablePayment,
  updateAccountingPayable,
  updateAccountingPayableStatus,
} from '@/controllers/v1/accounting-payable/accounting-payable.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createAccountingPayableSchema,
  deleteAccountingPayableSchema,
  getAccountingPayableByIdSchema,
  getAccountingPayablesSchema,
  recordAccountingPayablePaymentSchema,
  updateAccountingPayableSchema,
  updateAccountingPayableStatusSchema,
} from '@/validators/accounting-payable';

const router = Router();

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAccountingPayablesSchema),
  getAccountingPayables,
);

router.post(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createAccountingPayableSchema),
  createAccountingPayable,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAccountingPayableByIdSchema),
  getAccountingPayableById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateAccountingPayableSchema),
  updateAccountingPayable,
);

router.patch(
  '/:id/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateAccountingPayableStatusSchema),
  updateAccountingPayableStatus,
);

router.post(
  '/:id/payments',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(recordAccountingPayablePaymentSchema),
  recordAccountingPayablePayment,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(deleteAccountingPayableSchema),
  deleteAccountingPayable,
);

export default router;
