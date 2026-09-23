import { z } from 'zod';

export const chaplainServiceBodySchema = z.object({
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(5000),
  availability: z.string().trim().max(1000).nullable().optional(),
  commissionPercent: z.coerce.number().finite().min(0).max(100).nullable().optional(),
  maxConcurrentBookings: z.coerce.number().int().min(1).max(1000),
  sharedResourceName: z.string().trim().max(180).nullable().optional(),
  sharedResourceCapacity: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000),
});

export const getChaplainServicesSchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  }),
});

export type ChaplainServiceBody = z.infer<typeof chaplainServiceBodySchema>;

export const createChaplainServiceBookingSchema = z.object({
  serviceId: z.uuid(),
  providerMemberId: z.uuid(),
  availabilitySlotId: z.uuid(),
  requesterName: z.string().trim().min(1).max(180),
  requesterEmail: z.email(),
  requesterPhone: z.string().trim().min(5).max(30),
  preferredAt: z.iso.datetime(),
  deliveryMethod: z.enum(['ON_SITE', 'ONLINE', 'PHONE']),
  locationDetails: z.string().trim().min(1).max(1000),
  notes: z.string().trim().max(5000).optional(),
});

export type CreateChaplainServiceBookingBody = z.infer<
  typeof createChaplainServiceBookingSchema
>;

export const updateChaplainServiceBookingStatusSchema = z.object({
  status: z.enum(['AWAITING_CHAPLAIN_APPROVAL', 'CONFIRMED', 'RESCHEDULED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  reason: z.string().trim().max(1000).optional(),
  preferredAt: z.iso.datetime().optional(),
  providerServiceFee: z.coerce.number().finite().min(0).max(10_000_000).optional(),
}).superRefine((value, ctx) => {
  if (
    ['RESCHEDULED', 'REJECTED', 'CANCELLED'].includes(value.status) &&
    !value.reason?.trim()
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['reason'],
      message: 'A reason is required for this action',
    });
  }
  if (value.status === 'RESCHEDULED' && !value.preferredAt) {
    ctx.addIssue({
      code: 'custom',
      path: ['preferredAt'],
      message: 'A new preferred date and time is required when rescheduling',
    });
  }
});

export const getChaplainServiceBookingsSchema = z.object({
  query: z.object({
    status: z
      .enum(['PENDING', 'AWAITING_CHAPLAIN_APPROVAL', 'CONFIRMED', 'RESCHEDULED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
      .optional(),
  }),
});

export const updateChaplainServiceBookingFinancialsSchema = z.object({
  providerServiceFee: z.coerce.number().finite().min(0).max(10_000_000).nullable().optional(),
  requesterPaymentStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  providerCommissionStatus: z.enum(['NOT_APPLICABLE', 'PENDING', 'SETTLED', 'WAIVED']).optional(),
}).refine(
  (value) => Object.values(value).some((item) => item !== undefined),
  { message: 'At least one financial field is required' },
);

export const cancelCurrentRequesterBookingSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export type UpdateChaplainServiceBookingFinancialsBody = z.infer<
  typeof updateChaplainServiceBookingFinancialsSchema
>;

export type UpdateChaplainServiceBookingStatusBody = z.infer<
  typeof updateChaplainServiceBookingStatusSchema
>;
