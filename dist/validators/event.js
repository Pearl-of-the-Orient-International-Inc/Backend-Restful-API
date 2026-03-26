"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEventsSchema = exports.inviteEventAttendeesSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalTrimmedString = (maxLength) => zod_1.z
    .string()
    .trim()
    .max(maxLength, { message: `Must not exceed ${maxLength} characters` })
    .optional();
const eventBodySchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Event name is required' })
        .max(150, { message: 'Event name must not exceed 150 characters' }),
    category: zod_1.z.enum(enums_1.EventCategory),
    type: zod_1.z.enum(enums_1.EventType),
    location: optionalTrimmedString(255),
    onlineLink: zod_1.z.url({ message: 'Online link must be a valid URL' }).optional(),
    meetingId: optionalTrimmedString(100),
    meetingPassword: optionalTrimmedString(100),
    description: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Description is required' })
        .max(4000, { message: 'Description must not exceed 4000 characters' }),
    thumbnailUrl: zod_1.z.url({ message: 'Thumbnail URL must be a valid URL' }),
    organizer: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Organizer is required' })
        .max(150, { message: 'Organizer must not exceed 150 characters' }),
    startsAt: zod_1.z.iso.datetime(),
    endsAt: zod_1.z.iso.datetime(),
    visibility: zod_1.z.enum(enums_1.EventVisibility),
})
    .superRefine((value, ctx) => {
    var _a, _b;
    const startsAt = new Date(value.startsAt);
    const endsAt = new Date(value.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['startsAt'],
            message: 'Start and end schedule must be valid dates',
        });
        return;
    }
    if (endsAt <= startsAt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['endsAt'],
            message: 'End schedule must be after the start schedule',
        });
    }
    if (value.type === enums_1.EventType.ONSITE && !((_a = value.location) === null || _a === void 0 ? void 0 : _a.trim())) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['location'],
            message: 'Location is required for onsite events',
        });
    }
    if (value.type === enums_1.EventType.ONLINE && !((_b = value.onlineLink) === null || _b === void 0 ? void 0 : _b.trim())) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['onlineLink'],
            message: 'Online link is required for online events',
        });
    }
});
exports.createEventSchema = eventBodySchema;
exports.updateEventSchema = eventBodySchema;
exports.inviteEventAttendeesSchema = zod_1.z.object({
    memberIds: zod_1.z.array(zod_1.z.uuid()).min(1, { message: 'Select at least one member' }).max(200),
});
exports.getAllEventsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'page must be a positive integer',
        })
            .refine((val) => !val || parseInt(val, 10) >= 1, {
            message: 'page must be at least 1',
        }),
        limit: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'limit must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
            message: 'limit must be between 1 and 100',
        }),
        search: zod_1.z.string().trim().min(1).max(150).optional(),
        category: zod_1.z.enum(enums_1.EventCategory).optional(),
        type: zod_1.z.enum(enums_1.EventType).optional(),
        visibility: zod_1.z.enum(enums_1.EventVisibility).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'startsAt', 'name']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
