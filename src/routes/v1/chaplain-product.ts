import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createChaplainProduct,
  deleteChaplainProduct,
  getChaplainProducts,
  getPublicChaplainProduct,
  getPublicChaplainProducts,
  updateChaplainProduct,
} from '@/controllers/v1/chaplain-product/chaplain-product.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  chaplainProductBodySchema,
  getChaplainProductsSchema,
} from '@/validators/chaplain-product';

const router = Router();
const adminAccess = [authenticate, authorize([UserType.ADMIN])];

router.get('/public', expressRateLimit('basic'), getPublicChaplainProducts);
router.get('/public/:id', expressRateLimit('basic'), getPublicChaplainProduct);
router.get(
  '/',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(getChaplainProductsSchema),
  getChaplainProducts,
);
router.post(
  '/',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(chaplainProductBodySchema),
  createChaplainProduct,
);
router.put(
  '/:id',
  expressRateLimit('basic'),
  ...adminAccess,
  validate(chaplainProductBodySchema),
  updateChaplainProduct,
);
router.delete(
  '/:id',
  expressRateLimit('basic'),
  ...adminAccess,
  deleteChaplainProduct,
);

export default router;
