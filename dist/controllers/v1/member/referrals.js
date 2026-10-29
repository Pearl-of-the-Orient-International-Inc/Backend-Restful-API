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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockHonorRoll = exports.updateReferralCriterion = exports.getReferralCriteria = exports.getPublicHonorRoll = exports.rotateCurrentReferral = exports.getCurrentReferral = exports.resolvePublicReferral = exports.awardReferralPoints = exports.ensureReferralCode = void 0;
const node_crypto_1 = require("node:crypto");
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const DEFAULT_CRITERIA = [
    { key: 'APPLICATION_SUBMITTED', label: 'Membership application submitted', description: 'A referred applicant successfully submits a membership application.', points: 3, sortOrder: 1 },
    { key: 'MEMBER_APPROVED', label: 'Referred member approved', description: 'The referred applicant is approved as an active member.', points: 5, sortOrder: 2 },
];
const periodKeyFor = (date = new Date()) => {
    const values = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' }).formatToParts(date);
    const get = (type) => { var _a; return (_a = values.find((value) => value.type === type)) === null || _a === void 0 ? void 0 : _a.value; };
    return `${get('year')}-${get('month')}`;
};
const periodBounds = (periodKey) => {
    const [year, month] = periodKey.split('-').map(Number);
    return {
        startsAt: new Date(Date.UTC(year, month - 1, 1)),
        endsAt: new Date(Date.UTC(year, month, 1)),
    };
};
const ensureCriteria = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all(DEFAULT_CRITERIA.map((criterion) => tx.referralPointCriterion.upsert({
        where: { key: criterion.key }, update: {}, create: criterion,
    })));
});
const createCode = () => { var _a; return `POI-${(_a = (0, node_crypto_1.randomBytes)(5).toString('hex').toUpperCase().match(/.{1,4}/g)) === null || _a === void 0 ? void 0 : _a.join('-')}`; };
const ensureReferralCode = (tx, memberId) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield tx.member.findUnique({ where: { id: memberId }, select: { referralCode: true, status: true, isActive: true } });
    if (!member || member.status !== enums_1.MemberStatus.APPROVED || !member.isActive)
        return null;
    if (member.referralCode)
        return member.referralCode;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const referralCode = createCode();
        try {
            const updated = yield tx.member.update({ where: { id: memberId }, data: { referralCode, referralCodeCreatedAt: new Date() }, select: { referralCode: true } });
            return updated.referralCode;
        }
        catch (error) {
            if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002'))
                throw error;
        }
    }
    throw new Error('Unable to create a unique referral code');
});
exports.ensureReferralCode = ensureReferralCode;
const awardReferralPoints = (tx, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const referred = yield tx.member.findUnique({ where: { id: input.referredMemberId }, select: { referredByMemberId: true } });
    if (!(referred === null || referred === void 0 ? void 0 : referred.referredByMemberId))
        return null;
    const referrer = yield tx.member.findUnique({ where: { id: referred.referredByMemberId }, select: { status: true, isActive: true } });
    if (!referrer || referrer.status !== enums_1.MemberStatus.APPROVED || !referrer.isActive)
        return null;
    yield ensureCriteria(tx);
    const criterion = yield tx.referralPointCriterion.findUnique({ where: { key: input.criterionKey } });
    if (!(criterion === null || criterion === void 0 ? void 0 : criterion.isActive))
        return null;
    const occurredAt = (_a = input.occurredAt) !== null && _a !== void 0 ? _a : new Date();
    const periodKey = periodKeyFor(occurredAt);
    if (criterion.monthlyCap) {
        const existingPoints = yield tx.referralPointLedgerEntry.aggregate({ where: { referrerMemberId: referred.referredByMemberId, criterionId: criterion.id, periodKey, status: 'EARNED' }, _sum: { points: true } });
        if (((_b = existingPoints._sum.points) !== null && _b !== void 0 ? _b : 0) >= criterion.monthlyCap)
            return null;
    }
    try {
        return yield tx.referralPointLedgerEntry.create({ data: { referrerMemberId: referred.referredByMemberId, referredMemberId: input.referredMemberId, criterionId: criterion.id, points: criterion.points, occurredAt, periodKey, sourceType: input.sourceType, sourceId: input.sourceId, createdByUserId: input.createdByUserId } });
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
            return null;
        throw error;
    }
});
exports.awardReferralPoints = awardReferralPoints;
const resolvePublicReferral = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const code = String((_a = req.params.code) !== null && _a !== void 0 ? _a : '').trim().toUpperCase();
        const member = yield prisma_1.prisma.member.findFirst({ where: { referralCode: code, status: enums_1.MemberStatus.APPROVED, isActive: true }, select: { uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, currentPositionRole: true, currentPositionRoleOther: true } });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'REFERRAL_NOT_FOUND', message: 'This referral link is invalid or is no longer active.' });
            return;
        }
        const name = [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' ');
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral verified', data: { name, memberNumber: member.uniqueId, title: (_c = (_b = member.currentPositionRoleOther) !== null && _b !== void 0 ? _b : member.currentPositionRole) !== null && _c !== void 0 ? _c : 'Pearl Chaplain Member' } });
    }
    catch (err) {
        winston_1.logger.error('Error resolving referral', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_RESOLVE_FAILED', message: 'Unable to verify this referral link.' });
    }
});
exports.resolvePublicReferral = resolvePublicReferral;
const getCurrentReferral = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const member = yield prisma_1.prisma.member.findUnique({ where: { userId: req.userId }, select: { id: true } });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'MEMBER_NOT_FOUND', message: 'A member profile is required to use referrals.' });
            return;
        }
        const referralCode = yield prisma_1.prisma.$transaction((tx) => (0, exports.ensureReferralCode)(tx, member.id));
        if (!referralCode) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'REFERRAL_NOT_ELIGIBLE', message: 'Only active, approved members can share a referral link.' });
            return;
        }
        const periodKey = periodKeyFor();
        const [points, referrals] = yield Promise.all([prisma_1.prisma.referralPointLedgerEntry.aggregate({ where: { referrerMemberId: member.id, periodKey, status: 'EARNED' }, _sum: { points: true } }), prisma_1.prisma.member.count({ where: { referredByMemberId: member.id } })]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral link retrieved', data: { referralCode, referralCount: referrals, monthPoints: (_a = points._sum.points) !== null && _a !== void 0 ? _a : 0, periodKey } });
    }
    catch (err) {
        winston_1.logger.error('Error getting current referral', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_READ_FAILED', message: 'Unable to load your referral link.' });
    }
});
exports.getCurrentReferral = getCurrentReferral;
const rotateCurrentReferral = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield prisma_1.prisma.member.findUnique({ where: { userId: req.userId }, select: { id: true, status: true, isActive: true } });
        if (!member || member.status !== enums_1.MemberStatus.APPROVED || !member.isActive) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'REFERRAL_NOT_ELIGIBLE', message: 'Only active, approved members can rotate a referral link.' });
            return;
        }
        const referralCode = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () { yield tx.member.update({ where: { id: member.id }, data: { referralCode: null } }); return (0, exports.ensureReferralCode)(tx, member.id); }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral link rotated', data: { referralCode } });
    }
    catch (err) {
        winston_1.logger.error('Error rotating referral', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_ROTATE_FAILED', message: 'Unable to rotate the referral link.' });
    }
});
exports.rotateCurrentReferral = rotateCurrentReferral;
const getPublicHonorRoll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const periodKey = typeof req.query.period === 'string' && /^\d{4}-\d{2}$/.test(req.query.period) ? req.query.period : periodKeyFor();
        const lockedPeriod = yield prisma_1.prisma.referralRecognitionPeriod.findUnique({ where: { periodKey } });
        const rows = yield prisma_1.prisma.referralPointLedgerEntry.groupBy({ by: ['referrerMemberId'], where: { periodKey, status: 'EARNED' }, _sum: { points: true }, _count: { _all: true }, orderBy: { _sum: { points: 'desc' } }, take: 3 });
        const members = yield prisma_1.prisma.member.findMany({ where: { id: { in: rows.map((row) => row.referrerMemberId) }, status: enums_1.MemberStatus.APPROVED, isActive: true }, select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, user: { select: { avatar: true } } } });
        const byId = new Map(members.map((member) => [member.id, member]));
        const provisionalRankings = rows.flatMap((row, index) => { var _a; const member = byId.get(row.referrerMemberId); return member ? [{ memberId: member.id, rank: index + 1, memberNumber: member.uniqueId, name: [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' '), avatar: member.user.avatar, points: (_a = row._sum.points) !== null && _a !== void 0 ? _a : 0, milestones: row._count._all }] : []; });
        const lockedRankings = (lockedPeriod === null || lockedPeriod === void 0 ? void 0 : lockedPeriod.isLocked) && Array.isArray(lockedPeriod.winners)
            ? lockedPeriod.winners
            : null;
        const rankings = (lockedRankings !== null && lockedRankings !== void 0 ? lockedRankings : provisionalRankings).map((_a) => {
            var { memberId: _memberId } = _a, ranking = __rest(_a, ["memberId"]);
            return ranking;
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Membership Builders Honor Roll retrieved', data: { periodKey, rankings, isProvisional: !(lockedPeriod === null || lockedPeriod === void 0 ? void 0 : lockedPeriod.isLocked) } });
    }
    catch (err) {
        winston_1.logger.error('Error getting honor roll', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'HONOR_ROLL_READ_FAILED', message: 'Unable to load the Membership Builders Honor Roll.' });
    }
});
exports.getPublicHonorRoll = getPublicHonorRoll;
const getReferralCriteria = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.$transaction((tx) => ensureCriteria(tx));
        const criteria = yield prisma_1.prisma.referralPointCriterion.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral criteria retrieved', data: criteria });
    }
    catch (err) {
        winston_1.logger.error('Error getting referral criteria', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_CRITERIA_READ_FAILED', message: 'Unable to load referral criteria.' });
    }
});
exports.getReferralCriteria = getReferralCriteria;
const updateReferralCriterion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = typeof req.params.key === 'string' ? req.params.key : '';
        const body = req.body;
        if (!key || (body.points !== undefined && (!Number.isInteger(body.points) || Number(body.points) < 0))) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Provide a valid criterion key and a whole-number point value.' });
            return;
        }
        yield prisma_1.prisma.$transaction((tx) => ensureCriteria(tx));
        const criterion = yield prisma_1.prisma.referralPointCriterion.update({
            where: { key },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (body.points !== undefined ? { points: Number(body.points) } : {})), (typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {})), (body.monthlyCap === null || (Number.isInteger(body.monthlyCap) && Number(body.monthlyCap) >= 0) ? { monthlyCap: body.monthlyCap } : {})), (typeof body.label === 'string' && body.label.trim() ? { label: body.label.trim() } : {})), (typeof body.description === 'string' ? { description: body.description.trim() || null } : {})),
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral criterion updated', data: criterion });
    }
    catch (err) {
        winston_1.logger.error('Error updating referral criterion', { err });
        res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'REFERRAL_CRITERION_NOT_FOUND', message: 'Referral criterion was not found.' });
    }
});
exports.updateReferralCriterion = updateReferralCriterion;
const lockHonorRoll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const periodKey = typeof req.params.period === 'string' && /^\d{4}-\d{2}$/.test(req.params.period) ? req.params.period : '';
        if (!periodKey) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Use a period in YYYY-MM format.' });
            return;
        }
        const requestedIds = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.winnerMemberIds) ? req.body.winnerMemberIds.filter((id) => typeof id === 'string').slice(0, 3) : [];
        const rows = yield prisma_1.prisma.referralPointLedgerEntry.groupBy({ by: ['referrerMemberId'], where: { periodKey, status: 'EARNED' }, _sum: { points: true }, _count: { _all: true }, orderBy: { _sum: { points: 'desc' } }, take: 25 });
        const rowByMember = new Map(rows.map((row) => [row.referrerMemberId, row]));
        const winnerIds = requestedIds.length > 0 ? requestedIds.filter((id) => rowByMember.has(id)) : rows.slice(0, 3).map((row) => row.referrerMemberId);
        const members = yield prisma_1.prisma.member.findMany({ where: { id: { in: winnerIds }, status: enums_1.MemberStatus.APPROVED, isActive: true }, select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, user: { select: { avatar: true } } } });
        const byId = new Map(members.map((member) => [member.id, member]));
        const winners = winnerIds.flatMap((id, index) => { var _a; const member = byId.get(id); const row = rowByMember.get(id); return member && row ? [{ memberId: id, rank: index + 1, memberNumber: member.uniqueId, name: [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' '), avatar: member.user.avatar, points: (_a = row._sum.points) !== null && _a !== void 0 ? _a : 0, milestones: row._count._all }] : []; });
        const { startsAt, endsAt } = periodBounds(periodKey);
        const period = yield prisma_1.prisma.referralRecognitionPeriod.upsert({ where: { periodKey }, create: { periodKey, startsAt, endsAt, isLocked: true, lockedAt: new Date(), lockedByUserId: req.userId, winners }, update: { isLocked: true, lockedAt: new Date(), lockedByUserId: req.userId, winners } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Honor Roll locked. Recognition issuance remains a separate process.', data: period });
    }
    catch (err) {
        winston_1.logger.error('Error locking honor roll', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'HONOR_ROLL_LOCK_FAILED', message: 'Unable to lock this Honor Roll period.' });
    }
});
exports.lockHonorRoll = lockHonorRoll;
