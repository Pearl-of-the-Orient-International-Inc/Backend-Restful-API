import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  getPublicPaymentFeePolicies,
  getPublicPaymentConfiguration,
  getPublicPaymentStatus,
  capturePublicPayPalOrder,
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
router.get('/public/config', expressRateLimit('basic'), getPublicPaymentConfiguration);
router.get('/public/status/:reference', expressRateLimit('basic'), getPublicPaymentStatus);
router.post(
  '/public/chaplain-orders/:id/checkout',
  expressRateLimit('basic'),
  validate(initiateChaplainOrderPaymentSchema),
  initiateChaplainOrderPayment,
);
router.post('/public/paypal/:orderId/capture', expressRateLimit('basic'), capturePublicPayPalOrder);
router.post('/webhooks/xendit', receiveXenditWebhook);
router.post('/webhooks/paypal', receivePayPalWebhook);

export default router;
