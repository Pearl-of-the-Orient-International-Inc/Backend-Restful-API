import { UserType } from '@/generated/prisma/enums';
import z from 'zod';

export const emailSchema = z
  .email()
  .trim()
  .min(1, { error: 'Email is required' })
  .max(255, { error: 'Email must not exceed 255 characters' });

export const passwordSchema = z
  .string()
  .trim()
  .min(8, { error: 'Password must be at least 8 characters long' })
  .max(255, { error: 'Password must not exceed 255 characters' })
  .regex(/[A-Z]/, {
    error: 'Password must contain at least 1 uppercase letter',
  })
  .regex(/[0-9]/, { error: 'Password must contain at least 1 number' })
  .regex(/[^A-Za-z0-9]/, {
    error: 'Password must contain at least 1 special character',
  });

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must not exceed 100 characters' }),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(UserType, {
    message: 'Role must be either MEMBER, ADMIN, or SUPERADMIN',
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
