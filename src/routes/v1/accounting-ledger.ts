import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createAccountingLedgerTransaction,
  deleteAccountingLedgerTransaction,
  getAccountingLedgerTransactions,
  updateAccountingLedgerTransaction,
} from '@/controllers/v1/accounting-ledger/accounting-ledger.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createAccountingLedgerTransactionSchema,
  deleteAccountingLedgerTransactionSchema,
  getAccountingLedgerTransactionsSchema,
  updateAccountingLedgerTransactionSchema,
} from '@/validators/accounting-ledger';

const router = Router();

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAccountingLedgerTransactionsSchema),
  getAccountingLedgerTransactions,
);

router.post(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createAccountingLedgerTransactionSchema),
  createAccountingLedgerTransaction,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateAccountingLedgerTransactionSchema),
  updateAccountingLedgerTransaction,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(deleteAccountingLedgerTransactionSchema),
  deleteAccountingLedgerTransaction,
);

export default router;
