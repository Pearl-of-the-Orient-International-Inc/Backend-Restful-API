import { z } from 'zod';

export const createSurveyFeedbackResponseSchema = z.object({
  respondentName: z.string().trim().max(150).nullable().optional(),
  respondentType: z.enum(['Visitor', 'Member', 'Student', 'Service requester']),
  discoverySource: z.enum(['Social media', 'Friend or family', 'Community announcement', 'Online search', 'Organization member', 'Other']),
  improvementAreas: z.array(z.enum(['Chaplain services', 'Training and seminars', 'Membership support', 'Website experience', 'Communication and announcements'])).min(1).max(5),
  welcomeRating: z.number().int().min(1).max(5),
  accessibilityRating: z.number().int().min(1).max(5),
  satisfactionRating: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(1).max(3000),
  hasIssue: z.boolean(),
  issueCategory: z.enum(['Website or technical problem', 'Chaplain service concern', 'Membership concern', 'Payment concern', 'Safety or conduct concern', 'Other']).nullable().optional(),
  issueDescription: z.string().trim().max(3000).nullable().optional(),
  contactEmail: z.email().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.hasIssue && !value.issueCategory) {
    ctx.addIssue({ code: 'custom', path: ['issueCategory'], message: 'Issue category is required' });
  }
  if (value.hasIssue && !value.issueDescription?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['issueDescription'], message: 'Issue description is required' });
  }
});

export type CreateSurveyFeedbackResponseBody = z.infer<typeof createSurveyFeedbackResponseSchema>;
