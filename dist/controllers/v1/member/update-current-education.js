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
exports.updateCurrentEducation = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const normalizeOptional = (value) => {
    const trimmed = value === null || value === void 0 ? void 0 : value.trim();
    return trimmed ? trimmed : null;
};
const normalizeEntryList = (entries) => {
    const cleaned = (entries !== null && entries !== void 0 ? entries : [])
        .map((entry) => entry.trim())
        .filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(' | ') : null;
};
const updateCurrentEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { userId },
            select: {
                id: true,
                uniqueId: true,
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const { elementarySchool, secondarySchool, tertiaryCollegeEntries, postGraduateStudiesEntries, } = req.body;
        const updatedMember = yield prisma_1.prisma.member.update({
            where: { id: member.id },
            data: {
                elementarySchool: normalizeOptional(elementarySchool),
                secondarySchool: normalizeOptional(secondarySchool),
                tertiaryCollege: normalizeEntryList(tertiaryCollegeEntries),
                postGraduateStudies: normalizeEntryList(postGraduateStudiesEntries),
            },
            select: {
                id: true,
                uniqueId: true,
                elementarySchool: true,
                secondarySchool: true,
                tertiaryCollege: true,
                postGraduateStudies: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Education updated successfully',
            data: updatedMember,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating current education', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateCurrentEducation = updateCurrentEducation;
