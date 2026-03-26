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
exports.getMemberOfficerAssignments = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getMemberOfficerAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!memberId || typeof memberId !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid member ID is required',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true, firstName: true, lastName: true },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        const assignments = yield prisma_1.prisma.officerAssignment.findMany({
            where: { memberId },
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
            message: 'Member officer assignments retrieved successfully',
            data: assignments,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while fetching member officer assignments', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getMemberOfficerAssignments = getMemberOfficerAssignments;
