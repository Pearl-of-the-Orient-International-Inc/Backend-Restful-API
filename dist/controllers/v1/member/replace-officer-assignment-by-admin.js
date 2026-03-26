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
exports.replaceOfficerAssignmentByAdmin = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const replaceOfficerAssignmentByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const body = req.body;
        if (body.replacementMemberId === memberId) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Replacement member must be different from the current holder',
            });
            return;
        }
        const currentAssignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: {
                id: assignmentId,
                memberId,
            },
            select: {
                id: true,
                officeTitleId: true,
                department: true,
                region: true,
                province: true,
                cityMunicipality: true,
                barangay: true,
                isActive: true,
                member: {
                    select: {
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
        if (!currentAssignment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Officer assignment not found',
            });
            return;
        }
        if (!currentAssignment.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Only active officer assignments can be replaced',
            });
            return;
        }
        const replacementMember = yield prisma_1.prisma.member.findUnique({
            where: { id: body.replacementMemberId },
            select: {
                id: true,
                isActive: true,
                userId: true,
                user: {
                    select: {
                        role: true,
                    },
                },
            },
        });
        if (!replacementMember) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Replacement member not found',
            });
            return;
        }
        if (!replacementMember.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Archived members cannot receive office assignments',
            });
            return;
        }
        const duplicateAssignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: {
                memberId: replacementMember.id,
                officeTitleId: currentAssignment.officeTitleId,
                department: currentAssignment.department,
                region: currentAssignment.region,
                province: currentAssignment.province,
                cityMunicipality: currentAssignment.cityMunicipality,
                barangay: currentAssignment.barangay,
            },
        });
        const replacementAssignment = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.officerAssignment.update({
                where: { id: currentAssignment.id },
                data: {
                    isActive: false,
                    endDate: new Date(),
                },
            });
            const savedAssignment = duplicateAssignment
                ? yield tx.officerAssignment.update({
                    where: { id: duplicateAssignment.id },
                    data: {
                        isActive: true,
                        startDate: body.startDate ? new Date(body.startDate) : new Date(),
                        endDate: null,
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
                })
                : yield tx.officerAssignment.create({
                    data: {
                        member: { connect: { id: replacementMember.id } },
                        officeTitle: { connect: { id: currentAssignment.officeTitleId } },
                        department: currentAssignment.department,
                        region: currentAssignment.region,
                        province: currentAssignment.province,
                        cityMunicipality: currentAssignment.cityMunicipality,
                        barangay: currentAssignment.barangay,
                        isActive: true,
                        startDate: body.startDate ? new Date(body.startDate) : new Date(),
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
            const currentMemberRemainingAssignments = yield tx.officerAssignment.count({
                where: {
                    memberId,
                    isActive: true,
                },
            });
            if (currentMemberRemainingAssignments === 0) {
                yield tx.user.update({
                    where: { id: currentAssignment.member.userId },
                    data: { role: enums_1.UserType.MEMBER },
                });
            }
            if (replacementMember.user.role === enums_1.UserType.MEMBER) {
                yield tx.user.update({
                    where: { id: replacementMember.userId },
                    data: { role: enums_1.UserType.OFFICER },
                });
            }
            return savedAssignment;
        }));
        winston_1.logger.info('Officer assignment replaced by admin', {
            memberId,
            replacementMemberId: replacementMember.id,
            assignmentId,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Officer assignment replaced successfully',
            data: replacementAssignment,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while replacing officer assignment by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.replaceOfficerAssignmentByAdmin = replaceOfficerAssignmentByAdmin;
