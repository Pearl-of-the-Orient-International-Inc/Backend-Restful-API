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

export const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, { error: 'Email or instructor ID is required' })
  .max(255, { error: 'Email or instructor ID must not exceed 255 characters' })
  .refine(
    (value) =>
      z.email().safeParse(value).success ||
      /^POTSCI-\d{2}-\d{4}-INS$/i.test(value),
    {
      error: 'Enter a valid email address or instructor ID',
    },
  )
  .transform((value) =>
    /^POTSCI-\d{2}-\d{4}-INS$/i.test(value)
      ? value.toUpperCase()
      : value.toLowerCase(),
  );

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(100, { error: 'Name must not exceed 100 characters' }),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(UserType, {
    message: 'Role must be one of MEMBER, OFFICER, or ADMIN',
  }),
});

export const loginSchema = z.object({
  email: loginIdentifierSchema,
  password: z
    .string()
    .trim()
    .min(1, { error: 'Password is required' })
    .max(255, { error: 'Password must not exceed 255 characters' }),
  userAgent: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const verificationEmailSchema = z.object({
  code: z.string().min(1, { error: 'Verification code is required' }),
});

export const verifyPasswordSchema = z.object({
  oldPassword: z
    .string()
    .trim()
    .min(1, { error: 'Current password is required' })
    .max(255, { error: 'Current password must not exceed 255 characters' }),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .trim()
      .min(1, { error: 'Current password is required' })
      .max(255, { error: 'Current password must not exceed 255 characters' }),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  })
  .refine((val) => val.oldPassword !== val.password, {
    message: 'New password must be different from current password',
    path: ['password'],
  });

export const twoFactorEnableSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: 'Token must be a 6-digit code' }),
});

export const verifyTwoFactorSchema = z.object({
  mfaToken: z.string().trim().min(1, { error: 'MFA token is required' }),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: 'Token must be a 6-digit code' }),
  userAgent: z.string().optional(),
});

export const passkeyRegistrationOptionsSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: 'Passkey label must not be empty' })
    .max(100, { error: 'Passkey label must not exceed 100 characters' })
    .optional(),
});

export const passkeyRegistrationVerifySchema = z.object({
  response: z.object({}).passthrough(),
});

export const passkeyAuthenticationOptionsSchema = z.object({
  email: emailSchema,
});

export const passkeyAuthenticationVerifySchema = z.object({
  email: emailSchema,
  response: z.object({}).passthrough(),
  userAgent: z.string().optional(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationSchema = z.infer<typeof resendVerificationSchema>;
export type VerificationEmailSchema = z.infer<typeof verificationEmailSchema>;
export type VerifyPasswordSchema = z.infer<typeof verifyPasswordSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type TwoFactorEnableSchema = z.infer<typeof twoFactorEnableSchema>;
export type VerifyTwoFactorSchema = z.infer<typeof verifyTwoFactorSchema>;
export type PasskeyRegistrationOptionsSchema = z.infer<
  typeof passkeyRegistrationOptionsSchema
>;
export type PasskeyRegistrationVerifySchema = z.infer<
  typeof passkeyRegistrationVerifySchema
>;
export type PasskeyAuthenticationOptionsSchema = z.infer<
  typeof passkeyAuthenticationOptionsSchema
>;
export type PasskeyAuthenticationVerifySchema = z.infer<
  typeof passkeyAuthenticationVerifySchema
>;
