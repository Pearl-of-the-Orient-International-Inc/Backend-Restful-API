import { z } from 'zod';

const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' });

export const ownerLoginSchema = z.object({
  pin: pinSchema,
});

export const ownerChangePinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export const ownerReportSchema = z.object({
  query: z.object({
    from: z.iso.datetime().or(z.iso.date()).optional(),
    to: z.iso.datetime().or(z.iso.date()).optional(),
  }),
});

export type OwnerLoginSchema = z.infer<typeof ownerLoginSchema>;
export type OwnerChangePinSchema = z.infer<typeof ownerChangePinSchema>;
