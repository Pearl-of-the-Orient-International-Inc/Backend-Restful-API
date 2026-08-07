import { z } from 'zod';
import { ReceiptOrganization, ReceiptPaymentType } from '@/generated/prisma/enums';

const optionalText = (max = 255) =>
  z.string().trim().max(max).optional().or(z.literal(''));
const dateStringSchema = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'date must be a valid date',
});
const moneySchema = z.coerce.number().min(0).max(999999999);

const receiptItemSchema = z.object({
  particulars: z.string().trim().min(1).max(255),
  amount: moneySchema.optional(),
  remarks: optionalText(255),
});

const receiptBodySchema = z.object({
  organization: z.enum(ReceiptOrganization),
  name: z.string().trim().min(1).max(150),
  receiptDate: dateStringSchema,
  course: optionalText(150),
  school: optionalText(150),
  paymentType: z.enum(ReceiptPaymentType).optional().default(ReceiptPaymentType.CASH),
  checkNo: optionalText(100),
  cashier: optionalText(150),
  remarks: optionalText(500),
  items: z.array(receiptItemSchema).min(1).max(100),
});

export const getAcknowledgementReceiptsSchema = z.object({
  query: z.object({
    page: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'page must be a positive integer',
    }),
    limit: z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
      message: 'limit must be a positive integer',
    }),
    search: optionalText(100),
    organization: z.enum(ReceiptOrganization).optional(),
  }),
});

export const getAcknowledgementReceiptByIdSchema = z.object({
  params: z.object({ id: z.uuid() }),
});
export const createAcknowledgementReceiptSchema = z.object({ body: receiptBodySchema });
export const deleteAcknowledgementReceiptSchema = getAcknowledgementReceiptByIdSchema;

export type GetAcknowledgementReceiptsQuery = z.infer<typeof getAcknowledgementReceiptsSchema>['query'];
export type AcknowledgementReceiptBody = z.infer<typeof createAcknowledgementReceiptSchema>['body'];
