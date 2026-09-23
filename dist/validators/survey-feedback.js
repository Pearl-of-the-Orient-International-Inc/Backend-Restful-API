"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSurveyFeedbackResponseSchema = void 0;
const zod_1 = require("zod");
exports.createSurveyFeedbackResponseSchema = zod_1.z.object({
    respondentName: zod_1.z.string().trim().max(150).nullable().optional(),
    respondentType: zod_1.z.enum(['Visitor', 'Member', 'Student', 'Service requester']),
    discoverySource: zod_1.z.enum(['Social media', 'Friend or family', 'Community announcement', 'Online search', 'Organization member', 'Other']),
    improvementAreas: zod_1.z.array(zod_1.z.enum(['Chaplain services', 'Training and seminars', 'Membership support', 'Website experience', 'Communication and announcements'])).min(1).max(5),
    welcomeRating: zod_1.z.number().int().min(1).max(5),
    accessibilityRating: zod_1.z.number().int().min(1).max(5),
    satisfactionRating: zod_1.z.number().int().min(1).max(5),
    feedback: zod_1.z.string().trim().min(1).max(3000),
    hasIssue: zod_1.z.boolean(),
    issueCategory: zod_1.z.enum(['Website or technical problem', 'Chaplain service concern', 'Membership concern', 'Payment concern', 'Safety or conduct concern', 'Other']).nullable().optional(),
    issueDescription: zod_1.z.string().trim().max(3000).nullable().optional(),
    contactEmail: zod_1.z.email().nullable().optional(),
}).superRefine((value, ctx) => {
    var _a;
    if (value.hasIssue && !value.issueCategory) {
        ctx.addIssue({ code: 'custom', path: ['issueCategory'], message: 'Issue category is required' });
    }
    if (value.hasIssue && !((_a = value.issueDescription) === null || _a === void 0 ? void 0 : _a.trim())) {
        ctx.addIssue({ code: 'custom', path: ['issueDescription'], message: 'Issue description is required' });
    }
});
