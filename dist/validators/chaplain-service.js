"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelCurrentRequesterBookingSchema = exports.updateChaplainServiceBookingFinancialsSchema = exports.getChaplainServiceBookingsSchema = exports.updateChaplainServiceBookingStatusSchema = exports.createChaplainServiceBookingSchema = exports.getChaplainServicesSchema = exports.chaplainServiceBodySchema = void 0;
const zod_1 = require("zod");
exports.chaplainServiceBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(180),
    description: zod_1.z.string().trim().min(1).max(5000),
    availability: zod_1.z.string().trim().max(1000).nullable().optional(),
    commissionPercent: zod_1.z.coerce.number().finite().min(0).max(100).nullable().optional(),
    maxConcurrentBookings: zod_1.z.coerce.number().int().min(1).max(1000),
    sharedResourceName: zod_1.z.string().trim().max(180).nullable().optional(),
    sharedResourceCapacity: zod_1.z.coerce.number().int().min(1).max(1000).nullable().optional(),
    isActive: zod_1.z.boolean(),
    sortOrder: zod_1.z.coerce.number().int().min(0).max(1000000),
});
exports.getChaplainServicesSchema = zod_1.z.object({
    query: zod_1.z.object({
        isActive: zod_1.z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    }),
});
exports.createChaplainServiceBookingSchema = zod_1.z.object({
    serviceId: zod_1.z.uuid(),
    providerMemberId: zod_1.z.uuid(),
    availabilitySlotId: zod_1.z.uuid(),
    requesterName: zod_1.z.string().trim().min(1).max(180),
    requesterEmail: zod_1.z.email(),
    requesterPhone: zod_1.z.string().trim().min(5).max(30),
    preferredAt: zod_1.z.iso.datetime(),
    deliveryMethod: zod_1.z.enum(['ON_SITE', 'ONLINE', 'PHONE']),
    locationDetails: zod_1.z.string().trim().min(1).max(1000),
    notes: zod_1.z.string().trim().max(5000).optional(),
});
exports.updateChaplainServiceBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['AWAITING_CHAPLAIN_APPROVAL', 'CONFIRMED', 'RESCHEDULED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
    reason: zod_1.z.string().trim().max(1000).optional(),
    preferredAt: zod_1.z.iso.datetime().optional(),
    providerServiceFee: zod_1.z.coerce.number().finite().min(0).max(10000000).optional(),
}).superRefine((value, ctx) => {
    var _a;
    if (['RESCHEDULED', 'REJECTED', 'CANCELLED'].includes(value.status) &&
        !((_a = value.reason) === null || _a === void 0 ? void 0 : _a.trim())) {
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
exports.getChaplainServiceBookingsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z
            .enum(['PENDING', 'AWAITING_CHAPLAIN_APPROVAL', 'CONFIRMED', 'RESCHEDULED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
            .optional(),
    }),
});
exports.updateChaplainServiceBookingFinancialsSchema = zod_1.z.object({
    providerServiceFee: zod_1.z.coerce.number().finite().min(0).max(10000000).nullable().optional(),
    requesterPaymentStatus: zod_1.z.enum(['NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    providerCommissionStatus: zod_1.z.enum(['NOT_APPLICABLE', 'PENDING', 'SETTLED', 'WAIVED']).optional(),
}).refine((value) => Object.values(value).some((item) => item !== undefined), { message: 'At least one financial field is required' });
exports.cancelCurrentRequesterBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1).max(1000),
});
