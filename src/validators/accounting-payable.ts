import { z } from 'zod';
import { AccountingPayableStatus } from '@/generated/prisma/enums';

const optionalText = (max = 255) => z.string().trim().max(max).optional().or(z.literal(''));

const dateStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid date',
  });

const moneySchema = z.coerce.number().min(0).max(999999999);

const payableItemSchema = z.object({
  description: z.string().trim().min(1).max(255),
  category: optionalText(100),
  quantity: z.coerce.number().positive().max(999999),
  unitCost: moneySchema,
});

const payableBodySchema = z.object({
  supplier: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100),
  billDate: dateStringSchema,
  dueDate: dateStringSchema,
  reference: optionalText(100),
  description: optionalText(500),
  paymentTerms: optionalText(80),
  paymentMethod: optionalText(80),
  bankAccount: optionalText(150),
  remarks: optionalText(500),
  discount: moneySchema.optional(),
  tax: moneySchema.optional(),
  paidAmount: moneySchema.optional(),
  status: z.enum(AccountingPayableStatus).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        size: optionalText(50),
        url: optionalText(500),
      }),
    )
    .max(20)
    .optional(),
  items: z.array(payableItemSchema).min(1).max(100),
});

export const getAccountingPayablesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), {
        message: 'page must be a positive integer',
      }),
    limit: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), {
        message: 'limit must be a positive integer',
      }),
    search: optionalText(100),
    status: z.enum(AccountingPayableStatus).optional(),
    category: optionalText(100),
    supplier: optionalText(150),
  }),
});

export const getAccountingPayableByIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const createAccountingPayableSchema = z.object({
  body: payableBodySchema,
});

export const updateAccountingPayableSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: payableBodySchema,
});

export const deleteAccountingPayableSchema = getAccountingPayableByIdSchema;

export const updateAccountingPayableStatusSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    status: z.enum(AccountingPayableStatus),
  }),
});

export const recordAccountingPayablePaymentSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    amount: z.coerce.number().positive().max(999999999),
  }),
});

export type GetAccountingPayablesQuery = z.infer<typeof getAccountingPayablesSchema>['query'];
export type AccountingPayableBody = z.infer<typeof createAccountingPayableSchema>['body'];
export type UpdateAccountingPayableStatusBody = z.infer<
  typeof updateAccountingPayableStatusSchema
>['body'];
export type RecordAccountingPayablePaymentBody = z.infer<
  typeof recordAccountingPayablePaymentSchema
>['body'];
