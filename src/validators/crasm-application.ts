import { z } from 'zod';

const document = z.object({ type: z.enum(['APPOINTMENT', 'GOVERNMENT_ID', 'CHURCH_ASSIGNMENT', 'OTHER']), fileUrl: z.url(), fileName: z.string().trim().min(1).max(255), mimeType: z.string().trim().max(120).optional() });
const fields = {
  appointmentTitle: z.string().trim().max(200), appointingOfficer: z.string().trim().max(300), recommendingOfficer: z.string().trim().max(300), territorialJurisdiction: z.string().trim().max(1000), churchName: z.string().trim().max(300), churchAddress: z.string().trim().max(1000), documents: z.array(document).max(12), informationAccurate: z.boolean(), backgroundCheckConsent: z.boolean(),
};
export const saveCrasmApplicationSchema = z.object({ body: z.object({ appointmentTitle: fields.appointmentTitle.optional(), appointingOfficer: fields.appointingOfficer.optional(), recommendingOfficer: fields.recommendingOfficer.optional(), territorialJurisdiction: fields.territorialJurisdiction.optional(), churchName: fields.churchName.optional(), churchAddress: fields.churchAddress.optional(), documents: fields.documents.optional(), informationAccurate: fields.informationAccurate.optional(), backgroundCheckConsent: fields.backgroundCheckConsent.optional() }) });
export const submitCrasmApplicationSchema = z.object({ body: z.object({ appointmentTitle: fields.appointmentTitle.min(2), appointingOfficer: fields.appointingOfficer.min(2), recommendingOfficer: fields.recommendingOfficer.min(2), territorialJurisdiction: fields.territorialJurisdiction.min(2), churchName: fields.churchName.min(2), churchAddress: fields.churchAddress.min(5), documents: fields.documents.min(2), informationAccurate: z.literal(true), backgroundCheckConsent: z.literal(true) }).superRefine((value, ctx) => { for (const type of ['APPOINTMENT', 'GOVERNMENT_ID'] as const) if (!value.documents.some((item) => item.type === type)) ctx.addIssue({ code: 'custom', path: ['documents'], message: `${type} document is required` }); }) });

export const reviewCrasmApplicationSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ action: z.enum(['START_REVIEW', 'REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'APPROVE', 'REJECT']), notes: z.string().trim().max(5000).optional() }).superRefine((value, ctx) => {
    if (['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'REJECT'].includes(value.action) && !value.notes) ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Review notes are required for this action' });
  }),
});
