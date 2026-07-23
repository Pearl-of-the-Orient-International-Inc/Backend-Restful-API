import { z } from 'zod';
import {
  AccountingLedgerTransactionStatus,
  AccountingLedgerTransactionType,
} from '@/generated/prisma/enums';

const optionalText = (max = 255) =>
  z.string().trim().max(max).optional().or(z.literal(''));
const dateStringSchema = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'transactionDate must be a valid date',
});
const moneySchema = z.coerce.number().min(0).max(999999999);

export const getAccountingLedgerTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'page must be a positive integer',
    }),
    limit: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'limit must be a positive integer',
    }),
    search: optionalText(100),
    type: z.enum(AccountingLedgerTransactionType).optional(),
    status: z.enum(AccountingLedgerTransactionStatus).optional(),
    account: optionalText(150),
  }),
});

export const createAccountingLedgerTransactionSchema = z
  .object({
    body: z.object({
      transactionDate: dateStringSchema,
      type: z.enum(AccountingLedgerTransactionType),
      party: z.string().trim().min(1).max(150),
      note: optionalText(500),
      account: z.string().trim().min(1).max(150),
      accountNo: optionalText(80),
      category: z.string().trim().min(1).max(100),
      debit: moneySchema.optional(),
      credit: moneySchema.optional(),
      status: z.enum(AccountingLedgerTransactionStatus),
      reference: optionalText(100),
    }),
  })
  .refine((data) => Number(data.body.debit ?? 0) > 0 || Number(data.body.credit ?? 0) > 0, {
    message: 'debit or credit is required',
    path: ['body', 'debit'],
  });

export const updateAccountingLedgerTransactionSchema =
  createAccountingLedgerTransactionSchema.extend({
    params: z.object({
      id: z.uuid(),
    }),
  });

export const deleteAccountingLedgerTransactionSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export type GetAccountingLedgerTransactionsQuery = z.infer<
  typeof getAccountingLedgerTransactionsSchema
>['query'];
export type CreateAccountingLedgerTransactionBody = z.infer<
  typeof createAccountingLedgerTransactionSchema
>['body'];
export type UpdateAccountingLedgerTransactionBody = z.infer<
  typeof updateAccountingLedgerTransactionSchema
>['body'];
