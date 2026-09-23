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
exports.deleteCurrentServiceAvailability = exports.createCurrentServiceAvailability = exports.getCurrentServiceAvailability = exports.getPublicServiceAvailability = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const eligibility = {
    isActive: true,
    status: enums_1.MemberStatus.APPROVED,
    memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
};
const getCurrentEligibleMember = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return null;
    return prisma_1.prisma.member.findFirst({
        where: Object.assign({ userId }, eligibility),
        select: { id: true, uniqueId: true },
    });
});
const getPublicServiceAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = req.params.memberId;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Invalid member ID' });
            return;
        }
        const member = yield prisma_1.prisma.member.findFirst({
            where: Object.assign({ OR: [{ id: memberId }, { uniqueId: memberId }] }, eligibility),
            select: { id: true },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Eligible service chaplain not found' });
            return;
        }
        const slots = yield prisma_1.prisma.chaplainServiceAvailability.findMany({
            where: { memberId: member.id, endsAt: { gt: new Date() } },
            orderBy: { startsAt: 'asc' },
            select: { id: true, startsAt: true, endsAt: true, note: true },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Service availability retrieved successfully', data: slots });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public service availability', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getPublicServiceAvailability = getPublicServiceAvailability;
const getCurrentServiceAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield getCurrentEligibleMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
            return;
        }
        const slots = yield prisma_1.prisma.chaplainServiceAvailability.findMany({
            where: { memberId: member.id, endsAt: { gt: new Date() } },
            orderBy: { startsAt: 'asc' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Service availability retrieved successfully', data: slots });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving current service availability', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getCurrentServiceAvailability = getCurrentServiceAvailability;
const createCurrentServiceAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const member = yield getCurrentEligibleMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
            return;
        }
        const startsAt = new Date(req.body.startsAt);
        const endsAt = new Date(req.body.endsAt);
        if (startsAt <= new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Availability must start in the future' });
            return;
        }
        const overlapping = yield prisma_1.prisma.chaplainServiceAvailability.findFirst({
            where: { memberId: member.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
            select: { id: true },
        });
        if (overlapping) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'AVAILABILITY_CONFLICT', message: 'This availability overlaps an existing time slot' });
            return;
        }
        const slot = yield prisma_1.prisma.chaplainServiceAvailability.create({
            data: { memberId: member.id, startsAt, endsAt, note: ((_a = req.body.note) === null || _a === void 0 ? void 0 : _a.trim()) || null },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Availability added successfully', data: slot });
    }
    catch (err) {
        winston_1.logger.error('Error while creating service availability', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.createCurrentServiceAvailability = createCurrentServiceAvailability;
const deleteCurrentServiceAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield getCurrentEligibleMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only approved active Certified Specialist Training Officer Instructors can manage service availability' });
            return;
        }
        const slotId = req.params.slotId;
        if (!slotId || Array.isArray(slotId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Invalid availability ID' });
            return;
        }
        const result = yield prisma_1.prisma.chaplainServiceAvailability.deleteMany({ where: { id: slotId, memberId: member.id } });
        if (result.count === 0) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Availability slot not found' });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Availability removed successfully' });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting service availability', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.deleteCurrentServiceAvailability = deleteCurrentServiceAvailability;
