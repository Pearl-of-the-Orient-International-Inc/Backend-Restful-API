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
exports.createOfficerAssignmentByAdmin = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const getOptional = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const getRequiredJurisdictionFields = (level) => {
    switch (level) {
        case enums_1.OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR:
            return [];
        case enums_1.OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR:
        case enums_1.OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR:
            return ['region'];
        case enums_1.OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR:
        case enums_1.OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR:
            return ['region', 'province'];
        case enums_1.OfficeTitleLevel.CITY_CHAPLAIN:
        case enums_1.OfficeTitleLevel.MUNICIPAL_CHAPLAIN:
        case enums_1.OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN:
            return ['region', 'province', 'cityMunicipality'];
        case enums_1.OfficeTitleLevel.BARANGAY_CHAPLAIN:
        case enums_1.OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN:
            return ['region', 'province', 'cityMunicipality', 'barangay'];
        case enums_1.OfficeTitleLevel.CHIEF_CHAPLAIN:
        default:
            return [];
    }
};
const getJurisdictionLabel = (field) => {
    switch (field) {
        case 'department':
            return 'department';
        case 'region':
            return 'region';
        case 'province':
            return 'province';
        case 'cityMunicipality':
            return 'city / municipality';
        case 'barangay':
            return 'barangay';
        default:
            return field;
    }
};
const createOfficerAssignmentByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!memberId || typeof memberId !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid member ID is required',
            });
            return;
        }
        const body = req.body;
        const member = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                isActive: true,
                userId: true,
                user: {
                    select: {
                        role: true,
                    },
                },
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        if (!member.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Archived members cannot receive office assignments',
            });
            return;
        }
        const officeTitle = yield prisma_1.prisma.officeTitle.findUnique({
            where: { id: body.officeTitleId },
            select: {
                id: true,
                name: true,
                level: true,
                maxSlots: true,
                isActive: true,
            },
        });
        if (!officeTitle) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Office title not found',
            });
            return;
        }
        if (!officeTitle.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Inactive office titles cannot be assigned',
            });
            return;
        }
        const assignmentData = {
            department: getOptional(body.department),
            region: getOptional(body.region),
            province: getOptional(body.province),
            cityMunicipality: getOptional(body.cityMunicipality),
            barangay: getOptional(body.barangay),
        };
        const requiredFields = getRequiredJurisdictionFields(officeTitle.level);
        const requiredField = requiredFields.find((field) => !assignmentData[field]);
        if (requiredField) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: `${getJurisdictionLabel(requiredField)} is required for ${officeTitle.name}`,
            });
            return;
        }
        const duplicateAssignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: {
                memberId,
                officeTitleId: officeTitle.id,
                department: assignmentData.department,
                region: assignmentData.region,
                province: assignmentData.province,
                cityMunicipality: assignmentData.cityMunicipality,
                barangay: assignmentData.barangay,
            },
        });
        if (officeTitle.maxSlots !== null) {
            const activeOccupancy = yield prisma_1.prisma.officerAssignment.count({
                where: Object.assign({ officeTitleId: officeTitle.id, isActive: true, department: assignmentData.department, region: assignmentData.region, province: assignmentData.province, cityMunicipality: assignmentData.cityMunicipality, barangay: assignmentData.barangay }, (duplicateAssignment
                    ? { id: { not: duplicateAssignment.id } }
                    : {})),
            });
            if (activeOccupancy >= officeTitle.maxSlots) {
                res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                    code: 'CONFLICT',
                    message: `${officeTitle.name} has already reached its assignment limit for this jurisdiction`,
                });
                return;
            }
        }
        const assignment = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const savedAssignment = duplicateAssignment
                ? yield tx.officerAssignment.update({
                    where: { id: duplicateAssignment.id },
                    data: {
                        isActive: true,
                        startDate: body.startDate ? new Date(body.startDate) : new Date(),
                        endDate: null,
                    },
                    include: {
                        officeTitle: true,
                    },
                })
                : yield tx.officerAssignment.create({
                    data: Object.assign(Object.assign({ member: { connect: { id: memberId } }, officeTitle: { connect: { id: officeTitle.id } } }, assignmentData), { isActive: true, startDate: body.startDate ? new Date(body.startDate) : new Date() }),
                    include: {
                        officeTitle: true,
                    },
                });
            if (member.user.role === enums_1.UserType.MEMBER) {
                yield tx.user.update({
                    where: { id: member.userId },
                    data: { role: enums_1.UserType.OFFICER },
                });
            }
            return savedAssignment;
        }));
        winston_1.logger.info('Officer assignment created by admin', {
            memberId,
            officeTitleId: officeTitle.id,
            assignmentId: assignment.id,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Officer assignment created successfully',
            data: assignment,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating officer assignment by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createOfficerAssignmentByAdmin = createOfficerAssignmentByAdmin;
