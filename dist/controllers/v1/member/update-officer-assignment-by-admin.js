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
exports.updateOfficerAssignmentByAdmin = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const optionalText = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized || null;
};
const requiredFieldsForLevel = (level) => {
    switch (level) {
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
        default:
            return [];
    }
};
const fieldLabel = (field) => field === 'cityMunicipality' ? 'city / municipality' : field;
const updateOfficerAssignmentByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const assignmentId = Array.isArray(req.params.assignmentId)
            ? req.params.assignmentId[0]
            : req.params.assignmentId;
        if (!memberId || !assignmentId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid member and assignment IDs are required' });
            return;
        }
        const assignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: { id: assignmentId, memberId },
            include: { officeTitle: { select: { id: true, name: true, level: true } } },
        });
        if (!assignment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Office assignment not found for this member' });
            return;
        }
        const body = req.body;
        const values = {
            department: optionalText(body.department),
            region: optionalText(body.region),
            province: optionalText(body.province),
            cityMunicipality: optionalText(body.cityMunicipality),
            barangay: optionalText(body.barangay),
        };
        const missing = requiredFieldsForLevel(assignment.officeTitle.level).find((field) => !values[field]);
        if (missing) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: `${fieldLabel(missing)} is required for ${assignment.officeTitle.name}`,
            });
            return;
        }
        const startDate = body.startDate ? new Date(body.startDate) : assignment.startDate;
        const endDate = body.endDate ? new Date(body.endDate) : null;
        if (endDate && endDate < startDate) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'End date cannot be before the assignment start date',
            });
            return;
        }
        const updated = yield prisma_1.prisma.officerAssignment.update({
            where: { id: assignment.id },
            data: Object.assign(Object.assign({}, values), { startDate, endDate }),
            include: { officeTitle: true },
        });
        winston_1.logger.info('Officer assignment corrected by admin', {
            memberId,
            assignmentId,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Office assignment updated successfully',
            data: updated,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating officer assignment by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update office assignment' });
    }
});
exports.updateOfficerAssignmentByAdmin = updateOfficerAssignmentByAdmin;
