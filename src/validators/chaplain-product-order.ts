import { z } from 'zod';
import {
  ChaplainOrderFulfillmentMethod,
  ChaplainOrderPaymentMethod,
  ChaplainOrderStatus,
  PaymentGateway,
} from '@/generated/prisma/enums';

export const createChaplainProductOrderSchema = z
  .object({
    productId: z.string().trim().min(1).max(150),
    quantity: z.coerce.number().int().min(1).max(99),
    customerName: z.string().trim().min(2).max(180),
    customerEmail: z.email().max(255),
    customerPhone: z.string().trim().min(7).max(40),
    fulfillmentMethod: z.enum(ChaplainOrderFulfillmentMethod),
    deliveryAddress: z.string().trim().max(500).nullable().optional(),
    customerNotes: z.string().trim().max(1000).nullable().optional(),
    paymentMethod: z.enum(ChaplainOrderPaymentMethod),
    paymentGateway: z.enum(PaymentGateway).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.fulfillmentMethod === ChaplainOrderFulfillmentMethod.DELIVERY &&
      !value.deliveryAddress?.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['deliveryAddress'],
        message: 'Delivery address is required for delivery orders',
      });
    }
    if (
      value.paymentMethod === ChaplainOrderPaymentMethod.ONLINE &&
      !value.paymentGateway
    ) {
      context.addIssue({
        code: 'custom',
        path: ['paymentGateway'],
        message: 'Select Xendit or PayPal for online payment',
      });
    }
  });

export const initiateChaplainOrderPaymentSchema = z.object({
  checkoutToken: z.string().uuid(),
});

export const checkoutContextSchema = z.object({
  checkoutToken: z.string().uuid(),
});

export const attachPaymentSessionSchema = z.object({
  checkoutToken: z.string().uuid(),
  providerCheckoutId: z.string().trim().min(1).max(255),
  providerCheckoutUrl: z.url().max(2048),
});

export const updateChaplainProductOrderStatusSchema = z.object({
  status: z.enum(ChaplainOrderStatus),
});

export const getChaplainProductOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    search: z.string().trim().max(180).optional(),
    status: z.enum(ChaplainOrderStatus).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateChaplainProductOrderBody = z.infer<
  typeof createChaplainProductOrderSchema
>;
