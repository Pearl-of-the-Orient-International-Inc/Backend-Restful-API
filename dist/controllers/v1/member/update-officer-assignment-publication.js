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
exports.updateOfficerAssignmentPublication = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const updateOfficerAssignmentPublication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const assignmentId = Array.isArray(req.params.assignmentId)
            ? req.params.assignmentId[0]
            : req.params.assignmentId;
        const assignment = yield prisma_1.prisma.officerAssignment.findFirst({
            where: { id: assignmentId, memberId },
            select: { id: true, isActive: true, officeTitle: { select: { isPublic: true } } },
        });
        if (!assignment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Officer assignment not found' });
            return;
        }
        if (!assignment.isActive && req.body.isPublic) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'Inactive assignments cannot be published' });
            return;
        }
        if (!assignment.officeTitle.isPublic && req.body.isPublic) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'Publish the office title before publishing its officer' });
            return;
        }
        const updated = yield prisma_1.prisma.officerAssignment.update({
            where: { id: assignment.id },
            data: { isPublic: req.body.isPublic },
            include: { officeTitle: true },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: req.body.isPublic ? 'Officer published successfully' : 'Officer hidden successfully', data: updated });
    }
    catch (err) {
        winston_1.logger.error('Error while updating officer publication', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.updateOfficerAssignmentPublication = updateOfficerAssignmentPublication;
