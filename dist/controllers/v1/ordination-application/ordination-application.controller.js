"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOrdinationApplication = exports.getAllOrdinationApplications = exports.submitCurrentOrdinationApplication = exports.saveCurrentOrdinationApplication = exports.getCurrentOrdinationApplication = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memberSelect = { id: true, memberType: true, status: true, isActive: true, firstName: true, middleInitial: true, lastName: true, user: { select: { email: true, avatar: true } } };
const applicationInclude = { member: { select: memberSelect }, reviews: { orderBy: { createdAt: 'desc' }, include: { reviewer: { select: { id: true, name: true, email: true } } } } };
const currentMember = (userId) => prisma_1.prisma.member.findUnique({ where: { userId: userId !== null && userId !== void 0 ? userId : '' }, select: memberSelect });
const eligible = (member) => Boolean(member && member.isActive && member.status === enums_1.MemberStatus.APPROVED && member.memberType === enums_1.MemberType.PROFESSIONAL_CHAPLAIN);
const getCurrentOrdinationApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield currentMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Member profile not found' });
            return;
        }
        const application = yield prisma_1.prisma.ordinationApplication.findUnique({ where: { memberId: member.id }, include: applicationInclude });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination eligibility retrieved', data: { eligible: eligible(member), eligibilityReason: eligible(member) ? 'Professional Chaplain membership verified' : 'Only active, approved Professional Chaplains may apply', memberType: member.memberType, application } });
    }
    catch (err) {
        winston_1.logger.error('Error fetching ordination application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getCurrentOrdinationApplication = getCurrentOrdinationApplication;
const editableStatuses = [enums_1.OrdinationApplicationStatus.DRAFT, enums_1.OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, enums_1.OrdinationApplicationStatus.RETURNED_FOR_CORRECTION];
const saveCurrentOrdinationApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const member = yield currentMember(req.userId);
        if (!eligible(member)) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Professional Chaplains may apply for ordination' });
            return;
        }
        const existing = yield prisma_1.prisma.ordinationApplication.findUnique({ where: { memberId: member.id } });
        if (existing && !editableStatuses.includes(existing.status)) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'NOT_EDITABLE', message: 'This application cannot be edited in its current status' });
            return;
        }
        const body = req.body;
        const application = yield prisma_1.prisma.ordinationApplication.upsert({
            where: { memberId: member.id },
            create: { memberId: member.id, eligibilityMemberType: member.memberType, ministryBackground: String((_a = body.ministryBackground) !== null && _a !== void 0 ? _a : ''), callingStatement: String((_b = body.callingStatement) !== null && _b !== void 0 ? _b : ''), proposedMinistry: String((_c = body.proposedMinistry) !== null && _c !== void 0 ? _c : ''), additionalInformation: body.additionalInformation, documents: ((_d = body.documents) !== null && _d !== void 0 ? _d : []), informationAccurate: Boolean(body.informationAccurate), codeOfConductAccepted: Boolean(body.codeOfConductAccepted), backgroundCheckConsent: Boolean(body.backgroundCheckConsent) },
            update: Object.assign(Object.assign({}, body), { eligibilityMemberType: member.memberType }),
            include: applicationInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application draft saved', data: application });
    }
    catch (err) {
        winston_1.logger.error('Error saving ordination application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.saveCurrentOrdinationApplication = saveCurrentOrdinationApplication;
const submitCurrentOrdinationApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield currentMember(req.userId);
        if (!eligible(member)) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Professional Chaplains may apply for ordination' });
            return;
        }
        const existing = yield prisma_1.prisma.ordinationApplication.findUnique({ where: { memberId: member.id } });
        if (existing && !editableStatuses.includes(existing.status)) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'ALREADY_SUBMITTED', message: 'This application has already been submitted' });
            return;
        }
        const application = yield prisma_1.prisma.ordinationApplication.upsert({
            where: { memberId: member.id },
            create: Object.assign(Object.assign({}, req.body), { memberId: member.id, eligibilityMemberType: member.memberType, status: enums_1.OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null }),
            update: Object.assign(Object.assign({}, req.body), { eligibilityMemberType: member.memberType, status: enums_1.OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null, reviewedAt: null, decidedAt: null }),
            include: applicationInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application submitted successfully', data: application });
    }
    catch (err) {
        winston_1.logger.error('Error submitting ordination application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.submitCurrentOrdinationApplication = submitCurrentOrdinationApplication;
const getAllOrdinationApplications = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma_1.prisma.ordinationApplication.findMany({ orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }], include: applicationInclude });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination applications retrieved', data });
    }
    catch (err) {
        winston_1.logger.error('Error fetching ordination applications', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAllOrdinationApplications = getAllOrdinationApplications;
const reviewOrdinationApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = String(req.params.id);
        const { action, notes } = req.body;
        const current = yield prisma_1.prisma.ordinationApplication.findUnique({ where: { id }, include: { member: { select: { memberType: true, status: true, isActive: true } } } });
        if (!current) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Ordination application not found' });
            return;
        }
        const allowedActions = {
            SUBMITTED: [enums_1.OrdinationReviewAction.START_REVIEW, enums_1.OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, enums_1.OrdinationReviewAction.RETURN_FOR_CORRECTION, enums_1.OrdinationReviewAction.APPROVE, enums_1.OrdinationReviewAction.REJECT],
            UNDER_REVIEW: [enums_1.OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, enums_1.OrdinationReviewAction.RETURN_FOR_CORRECTION, enums_1.OrdinationReviewAction.APPROVE, enums_1.OrdinationReviewAction.REJECT],
        };
        if (!((_a = allowedActions[current.status]) === null || _a === void 0 ? void 0 : _a.includes(action))) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'INVALID_TRANSITION', message: `The ${action.toLowerCase().split('_').join(' ')} action is not allowed while the application is ${current.status.toLowerCase().split('_').join(' ')}` });
            return;
        }
        if (action === enums_1.OrdinationReviewAction.APPROVE && (!current.member.isActive || current.member.status !== enums_1.MemberStatus.APPROVED || current.member.memberType !== enums_1.MemberType.PROFESSIONAL_CHAPLAIN)) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'ELIGIBILITY_CHANGED', message: 'The applicant is no longer an active, approved Professional Chaplain' });
            return;
        }
        const statusMap = { START_REVIEW: enums_1.OrdinationApplicationStatus.UNDER_REVIEW, REQUEST_ADDITIONAL_INFORMATION: enums_1.OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, RETURN_FOR_CORRECTION: enums_1.OrdinationApplicationStatus.RETURNED_FOR_CORRECTION, APPROVE: enums_1.OrdinationApplicationStatus.APPROVED, REJECT: enums_1.OrdinationApplicationStatus.REJECTED };
        const status = statusMap[action];
        const now = new Date();
        const application = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.ordinationApplicationReview.create({ data: { applicationId: id, reviewerId: req.userId, action, notes: notes || null } });
            return tx.ordinationApplication.update({ where: { id }, data: { status, adminNotes: notes !== null && notes !== void 0 ? notes : current.adminNotes, requestedInformation: ['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION'].includes(action) ? notes : null, reviewedAt: now, decidedAt: ['APPROVE', 'REJECT'].includes(action) ? now : null }, include: applicationInclude });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application review updated', data: application });
    }
    catch (err) {
        winston_1.logger.error('Error reviewing ordination application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.reviewOrdinationApplication = reviewOrdinationApplication;
