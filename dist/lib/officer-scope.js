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
exports.requireOfficerScope = exports.getOfficerScope = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const nationwideLevels = new Set([
    client_1.OfficeTitleLevel.CHIEF_CHAPLAIN,
    client_1.OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR,
]);
const requiredLocationFields = {
    [client_1.OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR]: ['region'],
    [client_1.OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR]: ['region'],
    [client_1.OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR]: ['region', 'province'],
    [client_1.OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR]: ['region', 'province'],
    [client_1.OfficeTitleLevel.CITY_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
    [client_1.OfficeTitleLevel.MUNICIPAL_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
    [client_1.OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
    [client_1.OfficeTitleLevel.BARANGAY_CHAPLAIN]: ['region', 'province', 'cityMunicipality', 'barangay'],
    [client_1.OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN]: ['region', 'province', 'cityMunicipality', 'barangay'],
};
const locationWhere = (assignment) => {
    var _a;
    if (nationwideLevels.has(assignment.officeTitle.level))
        return {};
    const required = (_a = requiredLocationFields[assignment.officeTitle.level]) !== null && _a !== void 0 ? _a : [];
    if (!required.length || required.some((field) => { var _a; return !((_a = assignment[field]) === null || _a === void 0 ? void 0 : _a.trim()); }))
        return null;
    const fields = Object.assign(Object.assign(Object.assign(Object.assign({}, (assignment.region ? { region: assignment.region } : {})), (assignment.province ? { province: assignment.province } : {})), (assignment.cityMunicipality ? { municipalityCity: assignment.cityMunicipality } : {})), (assignment.barangay ? { barangay: assignment.barangay } : {}));
    return Object.keys(fields).length ? fields : null;
};
const getOfficerScope = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const member = yield prisma_1.prisma.member.findUnique({
        where: { userId },
        select: {
            id: true,
            isActive: true,
            status: true,
            officerAssignments: {
                where: { isActive: true },
                select: {
                    id: true,
                    department: true,
                    region: true,
                    province: true,
                    cityMunicipality: true,
                    barangay: true,
                    officeTitle: { select: { id: true, name: true, level: true, isActive: true } },
                },
            },
        },
    });
    if (!(member === null || member === void 0 ? void 0 : member.isActive) || member.status !== 'APPROVED')
        return null;
    const assignments = member.officerAssignments
        .filter((assignment) => assignment.officeTitle.isActive)
        .map((_a) => {
        var { officeTitle } = _a, assignment = __rest(_a, ["officeTitle"]);
        return (Object.assign(Object.assign({}, assignment), { officeTitle: { id: officeTitle.id, name: officeTitle.name, level: officeTitle.level } }));
    });
    const scopes = assignments.map(locationWhere).filter((scope) => scope !== null);
    if (!scopes.length)
        return null;
    return {
        memberId: member.id,
        assignments,
        memberWhere: {
            isActive: true,
            status: 'APPROVED',
            OR: scopes,
        },
    };
});
exports.getOfficerScope = getOfficerScope;
const requireOfficerScope = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const scope = yield (0, exports.getOfficerScope)(userId);
    if (!scope) {
        const error = new Error('An active officer assignment is required to access scoped members');
        Object.assign(error, { statusCode: http_codes_1.HTTPSTATUS.FORBIDDEN });
        throw error;
    }
    return scope;
});
exports.requireOfficerScope = requireOfficerScope;
