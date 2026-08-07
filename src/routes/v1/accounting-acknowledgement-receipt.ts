import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createAcknowledgementReceipt,
  deleteAcknowledgementReceipt,
  getAcknowledgementReceiptById,
  getAcknowledgementReceipts,
} from '@/controllers/v1/accounting-acknowledgement-receipt/accounting-acknowledgement-receipt.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createAcknowledgementReceiptSchema,
  deleteAcknowledgementReceiptSchema,
  getAcknowledgementReceiptByIdSchema,
  getAcknowledgementReceiptsSchema,
} from '@/validators/accounting-acknowledgement-receipt';

const router = Router();

router.get('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(getAcknowledgementReceiptsSchema), getAcknowledgementReceipts);
router.post('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(createAcknowledgementReceiptSchema), createAcknowledgementReceipt);
router.get('/:id', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(getAcknowledgementReceiptByIdSchema), getAcknowledgementReceiptById);
router.delete('/:id', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(deleteAcknowledgementReceiptSchema), deleteAcknowledgementReceipt);

export default router;
