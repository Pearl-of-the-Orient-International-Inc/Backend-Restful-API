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
exports.submitCurrentCrasmApplication = exports.saveCurrentCrasmApplication = exports.getCurrentCrasmApplication = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member = (userId) => prisma_1.prisma.member.findUnique({ where: { userId: userId !== null && userId !== void 0 ? userId : '' }, select: { id: true, memberType: true, status: true, isActive: true } });
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
