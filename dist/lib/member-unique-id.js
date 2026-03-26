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
exports.generateNextMemberUniqueId = void 0;
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
const MEMBER_ROLE_DIGIT = '2';
const OFFICER_ROLE_DIGIT = '1';
const RESERVED_MEMBER_MIN_SERIES = 36;
const getRoleDigit = (role) => role === enums_1.UserType.OFFICER ? OFFICER_ROLE_DIGIT : MEMBER_ROLE_DIGIT;
const getYearTwoDigits = (date) => String(date.getFullYear()).slice(-2);
const parseSeries = (uniqueId) => {
    const match = uniqueId.match(/^\d{3}-(\d{5})$/);
    if (!match)
        return 0;
    return Number.parseInt(match[1], 10) || 0;
};
const generateNextMemberUniqueId = (role_1, ...args_1) => __awaiter(void 0, [role_1, ...args_1], void 0, function* (role, now = new Date()) {
    const prefix = `${getYearTwoDigits(now)}${getRoleDigit(role)}`;
    const existing = yield prisma_1.prisma.member.findMany({
        where: {
            uniqueId: {
                startsWith: `${prefix}-`,
            },
        },
        select: {
            uniqueId: true,
        },
    });
    const maxExistingSeries = existing.reduce((max, record) => {
        if (!record.uniqueId)
            return max;
        return Math.max(max, parseSeries(record.uniqueId));
    }, 0);
    const baselineSeries = prefix === '262'
        ? RESERVED_MEMBER_MIN_SERIES
        : 0;
    const nextSeries = Math.max(maxExistingSeries, baselineSeries) + 1;
    const paddedSeries = String(nextSeries).padStart(5, '0');
    return `${prefix}-${paddedSeries}`;
});
exports.generateNextMemberUniqueId = generateNextMemberUniqueId;
