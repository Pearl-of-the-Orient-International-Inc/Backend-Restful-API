import type { z } from 'zod';
import type {
  applyMemberSchema,
  upsertMemberIdGenerationAssetSchema,
  upsertChaplaincyTrainingProgressSchema,
  upsertOnlineInterviewAppointmentSchema,
  upsertPaymentCheckoutSchema,
  updateOnboardingStepSchema,
  updatePreOrientationProgressSchema,
  upsertMemberRequirementsSchema,
  updateMemberStatusSchema,
} from '@/validators/member';

export type ApplyMemberBody = z.infer<typeof applyMemberSchema>;
export type UpsertMemberRequirementsBody = z.infer<typeof upsertMemberRequirementsSchema>;
export type UpdatePreOrientationProgressBody = z.infer<typeof updatePreOrientationProgressSchema>;
export type UpdateOnboardingStepBody = z.infer<typeof updateOnboardingStepSchema>;
export type UpsertPaymentCheckoutBody = z.infer<typeof upsertPaymentCheckoutSchema>;
export type UpsertOnlineInterviewAppointmentBody = z.infer<typeof upsertOnlineInterviewAppointmentSchema>;
export type UpsertMemberIdGenerationAssetBody = z.infer<typeof upsertMemberIdGenerationAssetSchema>;
export type UpsertChaplaincyTrainingProgressBody = z.infer<typeof upsertChaplaincyTrainingProgressSchema>;
export type UpdateMemberStatusBody = z.infer<typeof updateMemberStatusSchema>;
