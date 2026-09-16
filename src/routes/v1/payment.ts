import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  getPublicPaymentFeePolicies,
  initiateChaplainOrderPayment,
  receivePayPalWebhook,
  receiveXenditWebhook,
} from '@/controllers/v1/payment/payment.controller';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { initiateChaplainOrderPaymentSchema } from '@/validators/chaplain-product-order';

const router = Router();

router.get(
  '/public/fees',
  expressRateLimit('basic'),
  getPublicPaymentFeePolicies,
);
router.post(
  '/public/chaplain-orders/:id/checkout',
  expressRateLimit('basic'),
  validate(initiateChaplainOrderPaymentSchema),
  initiateChaplainOrderPayment,
);
router.post('/webhooks/xendit', receiveXenditWebhook);
router.post('/webhooks/paypal', receivePayPalWebhook);

export default router;
