import { z } from 'zod';
import {
  EventCategory,
  EventAttendeeInviteStatus,
  EventType,
  EventVisibility,
} from '@/generated/prisma/enums';

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, { message: `Must not exceed ${maxLength} characters` })
    .optional();

const eventBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Event name is required' })
      .max(150, { message: 'Event name must not exceed 150 characters' }),
    category: z.enum(EventCategory),
    type: z.enum(EventType),
    location: optionalTrimmedString(255),
    onlineLink: z.url({ message: 'Online link must be a valid URL' }).optional(),
    meetingId: optionalTrimmedString(100),
    meetingPassword: optionalTrimmedString(100),
    description: z
      .string()
      .trim()
      .min(1, { message: 'Description is required' })
      .max(4000, { message: 'Description must not exceed 4000 characters' }),
    thumbnailUrl: z.url({ message: 'Thumbnail URL must be a valid URL' }),
    organizer: z
      .string()
      .trim()
      .min(1, { message: 'Organizer is required' })
      .max(150, { message: 'Organizer must not exceed 150 characters' }),
    taggedMemberIds: z.array(z.uuid()).max(100).optional(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    visibility: z.enum(EventVisibility),
  })
  .superRefine((value, ctx) => {
    const startsAt = new Date(value.startsAt);
    const endsAt = new Date(value.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startsAt'],
        message: 'Start and end schedule must be valid dates',
      });
      return;
    }

    if (endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'End schedule must be after the start schedule',
      });
    }

    if (value.type === EventType.ONSITE && !value.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: 'Location is required for onsite events',
      });
    }

    if (value.type === EventType.ONLINE && !value.onlineLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['onlineLink'],
        message: 'Online link is required for online events',
      });
    }
  });

export const createEventSchema = eventBodySchema;
export const updateEventSchema = eventBodySchema;
export const inviteEventAttendeesSchema = z.object({
  memberIds: z.array(z.uuid()).min(1, { message: 'Select at least one member' }).max(200),
});

export const reviewEventAttendeeSchema = z.object({
  params: z.object({
    id: z.uuid(),
    attendeeId: z.uuid(),
  }),
  body: z.object({
    status: z.enum([
      EventAttendeeInviteStatus.APPROVED,
      EventAttendeeInviteStatus.REJECTED,
      EventAttendeeInviteStatus.ATTENDED,
    ]),
  }),
});

export const getAllEventsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'page must be a positive integer',
      })
      .refine((val) => !val || parseInt(val, 10) >= 1, {
        message: 'page must be at least 1',
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'limit must be a positive integer',
      })
      .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
        message: 'limit must be between 1 and 100',
      }),
    search: z.string().trim().min(1).max(150).optional(),
    category: z.enum(EventCategory).optional(),
    type: z.enum(EventType).optional(),
    visibility: z.enum(EventVisibility).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'startsAt', 'name']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateEventSchema = z.infer<typeof createEventSchema>;
export type UpdateEventSchema = z.infer<typeof updateEventSchema>;
export type InviteEventAttendeesSchema = z.infer<typeof inviteEventAttendeesSchema>;
export type ReviewEventAttendeeSchema = z.infer<typeof reviewEventAttendeeSchema>;
