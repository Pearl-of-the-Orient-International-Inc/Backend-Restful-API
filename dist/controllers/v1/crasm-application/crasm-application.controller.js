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
exports.reviewCrasmApplication = exports.getAllCrasmApplications = exports.submitCurrentCrasmApplication = exports.saveCurrentCrasmApplication = exports.getCurrentCrasmApplication = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memberSelect = { id: true, memberType: true, status: true, isActive: true, firstName: true, middleInitial: true, lastName: true, user: { select: { email: true, avatar: true } } };
const applicationInclude = { member: { select: memberSelect }, reviews: { orderBy: { createdAt: 'desc' }, include: { reviewer: { select: { id: true, name: true, email: true } } } } };
const member = (userId) => prisma_1.prisma.member.findUnique({ where: { userId: userId !== null && userId !== void 0 ? userId : '' }, select: memberSelect });
const eligible = (profile) => Boolean((profile === null || profile === void 0 ? void 0 : profile.isActive) && profile.status === enums_1.MemberStatus.APPROVED && profile.memberType === enums_1.MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER);
const editable = [enums_1.OrdinationApplicationStatus.DRAFT, enums_1.OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, enums_1.OrdinationApplicationStatus.RETURNED_FOR_CORRECTION];
const getCurrentCrasmApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () { try {
    const profile = yield member(req.userId);
    if (!profile) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Member profile not found' });
        return;
    }
    const application = yield prisma_1.prisma.crasmApplication.findUnique({ where: { memberId: profile.id } });
    res.status(200).json({ code: 'OK', data: { eligible: eligible(profile), eligibilityReason: eligible(profile) ? 'Ordained and Commissioned Practitioner membership verified' : 'Only active, approved Ordained and Commissioned Practitioners may apply for CRASM', application } });
}
catch (err) {
    winston_1.logger.error('Error fetching CRASM application', { err });
    res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
} });
exports.getCurrentCrasmApplication = getCurrentCrasmApplication;
const persist = (req, res, submit) => __awaiter(void 0, void 0, void 0, function* () { var _a, _b, _c, _d, _e, _f, _g; try {
    const profile = yield member(req.userId);
    if (!eligible(profile)) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Ordained and Commissioned Practitioners may apply for CRASM' });
        return;
    }
    const existing = yield prisma_1.prisma.crasmApplication.findUnique({ where: { memberId: profile.id } });
    if (existing && !editable.includes(existing.status)) {
        res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'NOT_EDITABLE', message: 'This application cannot be edited in its current status' });
        return;
    }
    const body = req.body;
    const required = { appointmentTitle: String((_a = body.appointmentTitle) !== null && _a !== void 0 ? _a : ''), appointingOfficer: String((_b = body.appointingOfficer) !== null && _b !== void 0 ? _b : ''), recommendingOfficer: String((_c = body.recommendingOfficer) !== null && _c !== void 0 ? _c : ''), territorialJurisdiction: String((_d = body.territorialJurisdiction) !== null && _d !== void 0 ? _d : ''), churchName: String((_e = body.churchName) !== null && _e !== void 0 ? _e : ''), churchAddress: String((_f = body.churchAddress) !== null && _f !== void 0 ? _f : ''), documents: ((_g = body.documents) !== null && _g !== void 0 ? _g : []), informationAccurate: Boolean(body.informationAccurate), backgroundCheckConsent: Boolean(body.backgroundCheckConsent) };
    const application = yield prisma_1.prisma.crasmApplication.upsert({ where: { memberId: profile.id }, create: Object.assign(Object.assign({ memberId: profile.id }, required), (submit ? { status: enums_1.OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date() } : {})), update: Object.assign(Object.assign({}, required), (submit ? { status: enums_1.OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null } : {})) });
    res.status(200).json({ code: 'OK', data: application });
}
catch (err) {
    winston_1.logger.error('Error saving CRASM application', { err });
    res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
} });
const saveCurrentCrasmApplication = (req, res) => persist(req, res, false);
exports.saveCurrentCrasmApplication = saveCurrentCrasmApplication;
const submitCurrentCrasmApplication = (req, res) => persist(req, res, true);
exports.submitCurrentCrasmApplication = submitCurrentCrasmApplication;
const getAllCrasmApplications = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma_1.prisma.crasmApplication.findMany({ orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }], include: applicationInclude });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'CRASM applications retrieved', data });
    }
    catch (err) {
        winston_1.logger.error('Error fetching CRASM applications', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAllCrasmApplications = getAllCrasmApplications;
const reviewCrasmApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = String(req.params.id);
        const { action, notes } = req.body;
        const current = yield prisma_1.prisma.crasmApplication.findUnique({ where: { id }, include: { member: { select: { memberType: true, status: true, isActive: true } } } });
        if (!current) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'CRASM application not found' });
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
        if (action === enums_1.OrdinationReviewAction.APPROVE && (!current.member.isActive || current.member.status !== enums_1.MemberStatus.APPROVED || current.member.memberType !== enums_1.MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER)) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'ELIGIBILITY_CHANGED', message: 'The applicant is no longer an active, approved Ordained and Commissioned Practitioner' });
            return;
        }
        const statusMap = { START_REVIEW: enums_1.OrdinationApplicationStatus.UNDER_REVIEW, REQUEST_ADDITIONAL_INFORMATION: enums_1.OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, RETURN_FOR_CORRECTION: enums_1.OrdinationApplicationStatus.RETURNED_FOR_CORRECTION, APPROVE: enums_1.OrdinationApplicationStatus.APPROVED, REJECT: enums_1.OrdinationApplicationStatus.REJECTED };
        const status = statusMap[action];
        const now = new Date();
        const application = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.crasmApplicationReview.create({ data: { applicationId: id, reviewerId: req.userId, action, notes: notes || null } });
            return tx.crasmApplication.update({ where: { id }, data: { status, adminNotes: notes !== null && notes !== void 0 ? notes : current.adminNotes, requestedInformation: ['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION'].includes(action) ? notes : null, reviewedAt: now, decidedAt: ['APPROVE', 'REJECT'].includes(action) ? now : null }, include: applicationInclude });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'CRASM application review updated', data: application });
    }
    catch (err) {
        winston_1.logger.error('Error reviewing CRASM application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.reviewCrasmApplication = reviewCrasmApplication;
