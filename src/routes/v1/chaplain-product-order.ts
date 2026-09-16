import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  attachOrderPaymentSession,
  createChaplainProductOrder,
  getChaplainProductOrders,
  getOrderCheckoutContext,
  updateChaplainProductOrderStatus,
} from '@/controllers/v1/chaplain-product-order/chaplain-product-order.controller';
import { UserType } from '@/generated/prisma/enums';
import {
  authenticate,
  optionalAuthenticate,
} from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  attachPaymentSessionSchema,
  checkoutContextSchema,
  createChaplainProductOrderSchema,
  getChaplainProductOrdersSchema,
  updateChaplainProductOrderStatusSchema,
} from '@/validators/chaplain-product-order';

const router = Router();
const adminAccess = [authenticate, authorize([UserType.ADMIN])];

router.post(
  '/public',
  expressRateLimit('basic'),
  optionalAuthenticate,
  validate(createChaplainProductOrderSchema),
  createChaplainProductOrder,
);
router.post(
  '/public/:id/checkout-context',
  expressRateLimit('basic'),
  validate(checkoutContextSchema),
  getOrderCheckoutContext,
);
router.post(
  '/public/:id/payment-session',
  expressRateLimit('basic'),
  validate(attachPaymentSessionSchema),
  attachOrderPaymentSession,
);
router.get(
  '/',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(getChaplainProductOrdersSchema),
  getChaplainProductOrders,
);
router.patch(
  '/:id/status',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(updateChaplainProductOrderStatusSchema),
  updateChaplainProductOrderStatus,
);

export default router;
