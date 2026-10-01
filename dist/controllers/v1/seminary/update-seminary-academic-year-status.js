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
exports.updateSeminaryAcademicYearStatus = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const updateSeminaryAcademicYearStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const body = req.body;
        const existingAcademicYear = yield prisma_1.prisma.seminaryAcademicYear.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingAcademicYear) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary academic year not found',
            });
            return;
        }
        const academicYear = yield prisma_1.prisma.seminaryAcademicYear.update({
            where: { id },
            data: { status: body.status },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary academic year status updated successfully',
            data: academicYear,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary academic year status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryAcademicYearStatus = updateSeminaryAcademicYearStatus;
