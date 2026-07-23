import { z } from 'zod';
import { AccountingReceivableStatus } from '@/generated/prisma/enums';

const optionalText = (max = 255) => z.string().trim().max(max).optional().or(z.literal(''));
const dateStringSchema = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'date must be a valid date',
});
const moneySchema = z.coerce.number().min(0).max(999999999);

const receivableItemSchema = z.object({
  description: z.string().trim().min(1).max(255),
  account: optionalText(100),
  quantity: z.coerce.number().positive().max(999999),
  unitPrice: moneySchema,
});

const receivableBodySchema = z.object({
  customer: z.string().trim().min(1).max(150),
  invoiceDate: dateStringSchema,
  dueDate: dateStringSchema,
  reference: optionalText(100),
  description: optionalText(500),
  paymentTerms: optionalText(80),
  paymentMethod: optionalText(80),
  bankAccount: optionalText(150),
  notes: optionalText(500),
  discount: moneySchema.optional(),
  tax: moneySchema.optional(),
  paidAmount: moneySchema.optional(),
  status: z.enum(AccountingReceivableStatus).optional(),
  attachments: z
    .array(z.object({ name: z.string().trim().min(1).max(255), size: optionalText(50), url: optionalText(500) }))
    .max(20)
    .optional(),
  items: z.array(receivableItemSchema).min(1).max(100),
});

export const getAccountingReceivablesSchema = z.object({
  query: z.object({
    page: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'page must be a positive integer',
    }),
    limit: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'limit must be a positive integer',
    }),
    search: optionalText(100),
    status: z.enum(AccountingReceivableStatus).optional(),
    customer: optionalText(150),
  }),
});

export const getAccountingReceivableByIdSchema = z.object({ params: z.object({ id: z.uuid() }) });
export const createAccountingReceivableSchema = z.object({ body: receivableBodySchema });
export const updateAccountingReceivableSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: receivableBodySchema,
});
export const deleteAccountingReceivableSchema = getAccountingReceivableByIdSchema;
export const updateAccountingReceivableStatusSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ status: z.enum(AccountingReceivableStatus) }),
});
export const recordAccountingReceivablePaymentSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ amount: z.coerce.number().positive().max(999999999) }),
});

export type GetAccountingReceivablesQuery = z.infer<typeof getAccountingReceivablesSchema>['query'];
export type AccountingReceivableBody = z.infer<typeof createAccountingReceivableSchema>['body'];
export type UpdateAccountingReceivableStatusBody = z.infer<typeof updateAccountingReceivableStatusSchema>['body'];
export type RecordAccountingReceivablePaymentBody = z.infer<typeof recordAccountingReceivablePaymentSchema>['body'];
