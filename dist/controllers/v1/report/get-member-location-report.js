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
exports.getMemberLocationReport = void 0;
const date_fns_1 = require("date-fns");
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const regionColors = [
    '#2563eb',
    '#16a34a',
    '#8b5cf6',
    '#f59e0b',
    '#0f766e',
    '#ea580c',
    '#ec4899',
    '#14b8a6',
    '#64748b',
];
const trendColors = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#0f766e', '#ea580c'];
const getMemberLocationReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const parsedMonths = parseInt(req.query.months, 10);
        const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;
        const granularity = (_a = req.query.granularity) !== null && _a !== void 0 ? _a : 'province';
        const region = normalizeOptional(req.query.region);
        const province = normalizeOptional(req.query.province);
        const municipalityCity = normalizeOptional(req.query.municipalityCity);
        const members = yield prisma_1.prisma.member.findMany({
            select: {
                isActive: true,
                createdAt: true,
                region: true,
                province: true,
                municipalityCity: true,
                barangay: true,
            },
        });
        const report = buildMemberLocationReport({
            members,
            monthsToShow,
            granularity,
            region,
            province,
            municipalityCity,
        });
        winston_1.logger.info('Member location report retrieved', {
            granularity,
            region,
            province,
            municipalityCity,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member location report retrieved successfully',
            data: report,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting member location report', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getMemberLocationReport = getMemberLocationReport;
function buildMemberLocationReport({ members, monthsToShow, granularity, region, province, municipalityCity, }) {
    const now = new Date();
    const activeMembers = members.filter((member) => member.isActive);
    const membersWithLocation = activeMembers.filter((member) => Boolean(member.region && member.province && member.municipalityCity && member.barangay));
    const regionCounts = new Map();
    activeMembers.forEach((member) => {
        var _a, _b;
        const label = (_a = member.region) === null || _a === void 0 ? void 0 : _a.trim();
        if (!label) {
            return;
        }
        regionCounts.set(label, ((_b = regionCounts.get(label)) !== null && _b !== void 0 ? _b : 0) + 1);
    });
    const regionBreakdown = Array.from(regionCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([label, value], index) => ({
        label,
        value,
        percentage: activeMembers.length
            ? Math.round((value / activeMembers.length) * 100)
            : 0,
        fill: regionColors[index % regionColors.length],
    }));
    const scopedMembers = activeMembers.filter((member) => {
        var _a, _b, _c;
        if (region && ((_a = member.region) === null || _a === void 0 ? void 0 : _a.trim()) !== region) {
            return false;
        }
        if (province && ((_b = member.province) === null || _b === void 0 ? void 0 : _b.trim()) !== province) {
            return false;
        }
        if (municipalityCity && ((_c = member.municipalityCity) === null || _c === void 0 ? void 0 : _c.trim()) !== municipalityCity) {
            return false;
        }
        return true;
    });
    const locationAccessor = getLocationAccessor(granularity);
    const totalsByLocation = new Map();
    scopedMembers.forEach((member) => {
        var _a, _b;
        const label = (_a = locationAccessor(member)) === null || _a === void 0 ? void 0 : _a.trim();
        if (!label) {
            return;
        }
        totalsByLocation.set(label, ((_b = totalsByLocation.get(label)) !== null && _b !== void 0 ? _b : 0) + 1);
    });
    const series = Array.from(totalsByLocation.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([label, total], index) => ({
        key: `series_${index + 1}`,
        label,
        total,
        color: trendColors[index % trendColors.length],
    }));
    const monthStarts = (0, date_fns_1.eachMonthOfInterval)({
        start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, monthsToShow - 1)),
        end: (0, date_fns_1.startOfMonth)(now),
    });
    const locationTrendData = monthStarts.map((monthStart) => {
        const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
        const point = {
            month: (0, date_fns_1.format)(monthStart, 'MMM'),
        };
        series.forEach((item) => {
            point[item.key] = scopedMembers.filter((member) => {
                var _a;
                const label = (_a = locationAccessor(member)) === null || _a === void 0 ? void 0 : _a.trim();
                return (label === item.label &&
                    (0, date_fns_1.isWithinInterval)(member.createdAt, { start: monthStart, end: monthEnd }));
            }).length;
        });
        return point;
    });
    return {
        summary: {
            totalActiveMembers: activeMembers.length,
            membersWithLocation: membersWithLocation.length,
            membersWithoutLocation: activeMembers.length - membersWithLocation.length,
            granularity,
            scopeLabel: buildScopeLabel(granularity, region, province, municipalityCity),
        },
        regionBreakdown,
        locationTrend: {
            granularity,
            series,
            data: locationTrendData,
        },
    };
}
function getLocationAccessor(granularity) {
    if (granularity === 'province') {
        return (member) => member.province;
    }
    if (granularity === 'municipality') {
        return (member) => member.municipalityCity;
    }
    return (member) => member.barangay;
}
function buildScopeLabel(granularity, region, province, municipalityCity) {
    if (granularity === 'province') {
        return region ? `Province trends in ${region}` : 'Province trends nationwide';
    }
    if (granularity === 'municipality') {
        if (province) {
            return `Municipality / city trends in ${province}`;
        }
        if (region) {
            return `Municipality / city trends in ${region}`;
        }
        return 'Municipality / city trends nationwide';
    }
    if (municipalityCity) {
        return `Barangay trends in ${municipalityCity}`;
    }
    if (province) {
        return `Barangay trends in ${province}`;
    }
    if (region) {
        return `Barangay trends in ${region}`;
    }
    return 'Barangay trends nationwide';
}
function normalizeOptional(value) {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
}
