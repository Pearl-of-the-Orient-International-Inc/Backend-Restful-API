import { z } from 'zod';
import { emailSchema } from './auth';



export const updateCurrentUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name cannot be empty' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .optional(),
  email: emailSchema,
  avatar: z
    .url({ message: 'Avatar must be a valid URL' })
    .optional(),
});

export type UpdateCurrentUserSchema = z.infer<typeof updateCurrentUserSchema>;