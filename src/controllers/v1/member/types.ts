import type { z } from 'zod';
import type {
  applyMemberSchema,
  updateMemberStatusSchema,
} from '@/validators/member';

export type ApplyMemberBody = z.infer<typeof applyMemberSchema>;
export type UpdateMemberStatusBody = z.infer<typeof updateMemberStatusSchema>;
