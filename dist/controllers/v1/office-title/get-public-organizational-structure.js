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
exports.getPublicOrganizationalStructure = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getPublicOrganizationalStructure = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offices = yield prisma_1.prisma.officeTitle.findMany({
            where: { isActive: true, isPublic: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                level: true,
                description: true,
                sections: true,
                sortOrder: true,
                reportsToId: true,
                assignments: {
                    where: {
                        isActive: true,
                        isPublic: true,
                        member: { isActive: true, status: enums_1.MemberStatus.APPROVED },
                    },
                    orderBy: [{ startDate: 'asc' }],
                    select: {
                        id: true,
                        memberId: true,
                        department: true,
                        region: true,
                        province: true,
                        cityMunicipality: true,
                        barangay: true,
                        startDate: true,
                        member: {
                            select: {
                                firstName: true,
                                middleInitial: true,
                                lastName: true,
                                extensionName: true,
                                user: { select: { avatar: true } },
                            },
                        },
                    },
                },
            },
        });
        const data = offices.map((office) => ({
            id: office.id,
            name: office.name,
            level: office.level,
            description: office.description,
            sections: office.sections,
            sortOrder: office.sortOrder,
            reportsToId: office.reportsToId,
            officers: office.assignments.map((assignment) => ({
                id: assignment.id,
                memberId: assignment.memberId,
                name: [
                    assignment.member.firstName,
                    assignment.member.middleInitial,
                    assignment.member.lastName,
                    assignment.member.extensionName,
                ].filter(Boolean).join(' '),
                avatar: assignment.member.user.avatar,
                jurisdiction: [
                    assignment.department,
                    assignment.region,
                    assignment.province,
                    assignment.cityMunicipality,
                    assignment.barangay,
                ].filter(Boolean).join(' · ') || null,
                startDate: assignment.startDate,
            })),
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public organizational structure retrieved successfully',
            data,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while fetching public organizational structure', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicOrganizationalStructure = getPublicOrganizationalStructure;
