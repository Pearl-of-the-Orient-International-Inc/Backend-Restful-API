import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createAccountingReceivable,
  deleteAccountingReceivable,
  getAccountingReceivableById,
  getAccountingReceivables,
  recordAccountingReceivablePayment,
  updateAccountingReceivable,
  updateAccountingReceivableStatus,
} from '@/controllers/v1/accounting-receivable/accounting-receivable.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createAccountingReceivableSchema,
  deleteAccountingReceivableSchema,
  getAccountingReceivableByIdSchema,
  getAccountingReceivablesSchema,
  recordAccountingReceivablePaymentSchema,
  updateAccountingReceivableSchema,
  updateAccountingReceivableStatusSchema,
} from '@/validators/accounting-receivable';

const router = Router();

router.get('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(getAccountingReceivablesSchema), getAccountingReceivables);
router.post('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(createAccountingReceivableSchema), createAccountingReceivable);
router.get('/:id', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(getAccountingReceivableByIdSchema), getAccountingReceivableById);
router.put('/:id', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(updateAccountingReceivableSchema), updateAccountingReceivable);
router.patch('/:id/status', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(updateAccountingReceivableStatusSchema), updateAccountingReceivableStatus);
router.post('/:id/payments', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(recordAccountingReceivablePaymentSchema), recordAccountingReceivablePayment);
router.delete('/:id', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(deleteAccountingReceivableSchema), deleteAccountingReceivable);

export default router;
