import { UserAccountStatus, UserPosition, UserType } from '@/generated/prisma/enums';
import z from 'zod';
import { emailSchema, passwordSchema } from './auth';

export const createUserAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must not exceed 100 characters' }),
  email: emailSchema,
  password: passwordSchema,
  role: z
    .enum(UserType)
    .optional()
    .default(UserType.ADMIN)
    .refine((value) => value === UserType.ADMIN, {
      message: 'Account role must be ADMIN',
    }),
  position: z.enum(UserPosition, {
    message: 'Position is required',
  }),
  accountStatus: z.enum(UserAccountStatus).optional().default(UserAccountStatus.ACTIVE),
  avatar: z.string().trim().url().optional().or(z.literal('')).or(z.null()),
  isTwoFactorEnabled: z.boolean().optional().default(false),
  notes: z.string().trim().max(1000).optional(),
});

export const updateUserByIdSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: 'Name is required' })
      .max(100, { error: 'Name must not exceed 100 characters' })
      .optional(),
    email: emailSchema.optional(),
    role: z
      .enum(UserType)
      .refine((value) => value === UserType.ADMIN, {
        message: 'Account role must be ADMIN',
      })
      .optional(),
    position: z.enum(UserPosition).optional(),
    accountStatus: z.enum(UserAccountStatus).optional(),
    avatar: z.string().trim().url().optional().or(z.literal('')).or(z.null()),
    isTwoFactorEnabled: z.boolean().optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export type CreateUserAccountSchema = z.infer<typeof createUserAccountSchema>;
export type UpdateUserByIdSchema = z.infer<typeof updateUserByIdSchema>;
