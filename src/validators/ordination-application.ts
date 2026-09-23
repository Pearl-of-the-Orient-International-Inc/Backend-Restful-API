import { z } from 'zod';

const documentSchema = z.object({
  type: z.enum(['ELIGIBILITY_EVIDENCE', 'LETTER_OF_INTENT', 'RECOMMENDATION', 'GOVERNMENT_ID', 'OTHER']),
  fileUrl: z.url(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120).optional(),
});

const fields = {
  ministryBackground: z.string().trim().max(5000),
  callingStatement: z.string().trim().max(5000),
  proposedMinistry: z.string().trim().max(5000),
  additionalInformation: z.string().trim().max(5000).nullable().optional(),
  documents: z.array(documentSchema).max(12),
  informationAccurate: z.boolean(),
  codeOfConductAccepted: z.boolean(),
  backgroundCheckConsent: z.boolean(),
};

export const saveOrdinationApplicationSchema = z.object({ body: z.object({
  ministryBackground: fields.ministryBackground.optional(),
  callingStatement: fields.callingStatement.optional(),
  proposedMinistry: fields.proposedMinistry.optional(),
  additionalInformation: fields.additionalInformation,
  documents: fields.documents.optional(),
  informationAccurate: fields.informationAccurate.optional(),
  codeOfConductAccepted: fields.codeOfConductAccepted.optional(),
  backgroundCheckConsent: fields.backgroundCheckConsent.optional(),
}) });

export const submitOrdinationApplicationSchema = z.object({ body: z.object({
  ministryBackground: fields.ministryBackground.min(50),
  callingStatement: fields.callingStatement.min(50),
  proposedMinistry: fields.proposedMinistry.min(30),
  additionalInformation: fields.additionalInformation,
  documents: fields.documents.min(2),
  informationAccurate: z.literal(true),
  codeOfConductAccepted: z.literal(true),
  backgroundCheckConsent: z.literal(true),
}).superRefine((value, ctx) => {
  for (const type of ['ELIGIBILITY_EVIDENCE', 'GOVERNMENT_ID'] as const) {
    if (!value.documents.some((document) => document.type === type)) {
      ctx.addIssue({ code: 'custom', path: ['documents'], message: `${type} document is required` });
    }
  }
}) });

export const reviewOrdinationApplicationSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    action: z.enum(['START_REVIEW', 'REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'APPROVE', 'REJECT']),
    notes: z.string().trim().max(5000).optional(),
  }).superRefine((value, ctx) => {
    if (['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'REJECT'].includes(value.action) && !value.notes) {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Review notes are required for this action' });
    }
  }),
});
