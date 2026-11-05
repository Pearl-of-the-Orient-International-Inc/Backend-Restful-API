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
exports.updateSeminaryAcademicYearSession = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const academic_year_shared_1 = require("./academic-year-shared");
const updateSeminaryAcademicYearSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const body = req.body;
        const academicYear = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const existingAcademicYear = yield tx.seminaryAcademicYear.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!existingAcademicYear)
                return null;
            const updatedAcademicYear = yield tx.seminaryAcademicYear.update({
                where: { id },
                data: { session: body.session },
            });
            yield (0, academic_year_shared_1.ensureSingleCurrentAcademicYear)(tx, updatedAcademicYear.id, updatedAcademicYear.session);
            return updatedAcademicYear;
        }));
        if (!academicYear) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary academic year not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary academic year session updated successfully',
            data: academicYear,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary academic year session', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryAcademicYearSession = updateSeminaryAcademicYearSession;
