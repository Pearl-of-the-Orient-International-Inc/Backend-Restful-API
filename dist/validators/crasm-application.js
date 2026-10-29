"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCrasmApplicationSchema = exports.submitCrasmApplicationSchema = exports.saveCrasmApplicationSchema = void 0;
const zod_1 = require("zod");
const document = zod_1.z.object({ type: zod_1.z.enum(['APPOINTMENT', 'GOVERNMENT_ID', 'CHURCH_ASSIGNMENT', 'OTHER']), fileUrl: zod_1.z.url(), fileName: zod_1.z.string().trim().min(1).max(255), mimeType: zod_1.z.string().trim().max(120).optional() });
const fields = {
    appointmentTitle: zod_1.z.string().trim().max(200), appointingOfficer: zod_1.z.string().trim().max(300), recommendingOfficer: zod_1.z.string().trim().max(300), territorialJurisdiction: zod_1.z.string().trim().max(1000), churchName: zod_1.z.string().trim().max(300), churchAddress: zod_1.z.string().trim().max(1000), documents: zod_1.z.array(document).max(12), informationAccurate: zod_1.z.boolean(), backgroundCheckConsent: zod_1.z.boolean(),
};
exports.saveCrasmApplicationSchema = zod_1.z.object({ body: zod_1.z.object({ appointmentTitle: fields.appointmentTitle.optional(), appointingOfficer: fields.appointingOfficer.optional(), recommendingOfficer: fields.recommendingOfficer.optional(), territorialJurisdiction: fields.territorialJurisdiction.optional(), churchName: fields.churchName.optional(), churchAddress: fields.churchAddress.optional(), documents: fields.documents.optional(), informationAccurate: fields.informationAccurate.optional(), backgroundCheckConsent: fields.backgroundCheckConsent.optional() }) });
exports.submitCrasmApplicationSchema = zod_1.z.object({ body: zod_1.z.object({ appointmentTitle: fields.appointmentTitle.min(2), appointingOfficer: fields.appointingOfficer.min(2), recommendingOfficer: fields.recommendingOfficer.min(2), territorialJurisdiction: fields.territorialJurisdiction.min(2), churchName: fields.churchName.min(2), churchAddress: fields.churchAddress.min(5), documents: fields.documents.min(2), informationAccurate: zod_1.z.literal(true), backgroundCheckConsent: zod_1.z.literal(true) }).superRefine((value, ctx) => { for (const type of ['APPOINTMENT', 'GOVERNMENT_ID'])
        if (!value.documents.some((item) => item.type === type))
            ctx.addIssue({ code: 'custom', path: ['documents'], message: `${type} document is required` }); }) });
exports.reviewCrasmApplicationSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
    body: zod_1.z.object({ action: zod_1.z.enum(['START_REVIEW', 'REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'APPROVE', 'REJECT']), notes: zod_1.z.string().trim().max(5000).optional() }).superRefine((value, ctx) => {
        if (['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'REJECT'].includes(value.action) && !value.notes)
            ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Review notes are required for this action' });
    }),
});
