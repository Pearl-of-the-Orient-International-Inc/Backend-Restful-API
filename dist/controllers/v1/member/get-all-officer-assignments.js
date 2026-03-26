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
exports.getAllOfficerAssignments = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getAllOfficerAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeOnlyQuery = req.query.activeOnly;
        const activeOnly = activeOnlyQuery === 'false' ||
            (Array.isArray(activeOnlyQuery) && activeOnlyQuery.includes('false'))
            ? false
            : true;
        const assignments = yield prisma_1.prisma.officerAssignment.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
            select: {
                id: true,
                memberId: true,
                officeTitleId: true,
                department: true,
                region: true,
                province: true,
                cityMunicipality: true,
                barangay: true,
                isActive: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
                member: {
                    select: {
                        id: true,
                        uniqueId: true,
                        firstName: true,
                        middleInitial: true,
                        lastName: true,
                        extensionName: true,
                        memberType: true,
                        status: true,
                        isActive: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                                role: true,
                            },
                        },
                    },
                },
                officeTitle: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        maxSlots: true,
                        isActive: true,
                    },
                },
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Officer assignments retrieved successfully',
            data: assignments,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while fetching officer assignments', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllOfficerAssignments = getAllOfficerAssignments;
