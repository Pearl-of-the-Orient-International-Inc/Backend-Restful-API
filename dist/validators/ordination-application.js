"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOrdinationApplicationSchema = exports.submitOrdinationApplicationSchema = exports.saveOrdinationApplicationSchema = void 0;
const zod_1 = require("zod");
const documentSchema = zod_1.z.object({
    type: zod_1.z.enum(['ELIGIBILITY_EVIDENCE', 'LETTER_OF_INTENT', 'RECOMMENDATION', 'GOVERNMENT_ID', 'OTHER']),
    fileUrl: zod_1.z.url(),
    fileName: zod_1.z.string().trim().min(1).max(255),
    mimeType: zod_1.z.string().trim().max(120).optional(),
});
const fields = {
    ministryBackground: zod_1.z.string().trim().max(5000),
    callingStatement: zod_1.z.string().trim().max(5000),
    proposedMinistry: zod_1.z.string().trim().max(5000),
    additionalInformation: zod_1.z.string().trim().max(5000).nullable().optional(),
    documents: zod_1.z.array(documentSchema).max(12),
    informationAccurate: zod_1.z.boolean(),
    codeOfConductAccepted: zod_1.z.boolean(),
    backgroundCheckConsent: zod_1.z.boolean(),
};
exports.saveOrdinationApplicationSchema = zod_1.z.object({ body: zod_1.z.object({
        ministryBackground: fields.ministryBackground.optional(),
        callingStatement: fields.callingStatement.optional(),
        proposedMinistry: fields.proposedMinistry.optional(),
        additionalInformation: fields.additionalInformation,
        documents: fields.documents.optional(),
        informationAccurate: fields.informationAccurate.optional(),
        codeOfConductAccepted: fields.codeOfConductAccepted.optional(),
        backgroundCheckConsent: fields.backgroundCheckConsent.optional(),
    }) });
exports.submitOrdinationApplicationSchema = zod_1.z.object({ body: zod_1.z.object({
        ministryBackground: fields.ministryBackground.min(50),
        callingStatement: fields.callingStatement.min(50),
        proposedMinistry: fields.proposedMinistry.min(30),
        additionalInformation: fields.additionalInformation,
        documents: fields.documents.min(2),
        informationAccurate: zod_1.z.literal(true),
        codeOfConductAccepted: zod_1.z.literal(true),
        backgroundCheckConsent: zod_1.z.literal(true),
    }).superRefine((value, ctx) => {
        for (const type of ['ELIGIBILITY_EVIDENCE', 'GOVERNMENT_ID']) {
            if (!value.documents.some((document) => document.type === type)) {
                ctx.addIssue({ code: 'custom', path: ['documents'], message: `${type} document is required` });
            }
        }
    }) });
exports.reviewOrdinationApplicationSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['START_REVIEW', 'REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'APPROVE', 'REJECT']),
        notes: zod_1.z.string().trim().max(5000).optional(),
    }).superRefine((value, ctx) => {
        if (['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'REJECT'].includes(value.action) && !value.notes) {
            ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Review notes are required for this action' });
        }
    }),
});
