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
exports.deactivateOfficerAssignmentByAdmin = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const deactivateOfficerAssignmentByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const assignmentId = Array.isArray(req.params.assignmentId)
            ? req.params.assignmentId[0]
            : req.params.assignmentId;
        if (!memberId ||
            typeof memberId !== 'string' ||
            !assignmentId ||
            typeof assignmentId !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid member and assignment IDs are required',
            });
            return;
        }
        const assignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: {
                id: assignmentId,
                memberId,
            },
            select: {
                id: true,
                isActive: true,
                member: {
                    select: {
                        id: true,
                        userId: true,
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
        if (!assignment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Officer assignment not found',
            });
            return;
        }
        if (!assignment.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'This officer assignment is already inactive',
            });
            return;
        }
        const updatedAssignment = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const savedAssignment = yield tx.officerAssignment.update({
                where: { id: assignmentId },
                data: {
                    isActive: false,
                    endDate: new Date(),
                },
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
            const remainingActiveAssignments = yield tx.officerAssignment.count({
                where: {
                    memberId,
                    isActive: true,
                },
            });
            if (remainingActiveAssignments === 0) {
                yield tx.user.update({
                    where: { id: assignment.member.userId },
                    data: { role: enums_1.UserType.MEMBER },
                });
            }
            return savedAssignment;
        }));
        winston_1.logger.info('Officer assignment deactivated by admin', {
            memberId,
            assignmentId,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Officer assignment deactivated successfully',
            data: updatedAssignment,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while deactivating officer assignment by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deactivateOfficerAssignmentByAdmin = deactivateOfficerAssignmentByAdmin;
