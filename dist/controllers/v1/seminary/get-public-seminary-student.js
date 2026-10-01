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
exports.getPublicSeminaryStudent = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getPublicSeminaryStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = String(req.params.studentId);
        const student = yield prisma_1.prisma.seminaryApplication.findFirst({
            where: {
                studentId,
                status: {
                    in: [
                        enums_1.SeminaryApplicationStatus.APPROVED,
                        enums_1.SeminaryApplicationStatus.ENROLLED,
                    ],
                },
                studentStatus: {
                    in: [
                        enums_1.SeminaryStudentStatus.ACTIVE,
                        enums_1.SeminaryStudentStatus.GRADUATING,
                    ],
                },
            },
            select: {
                studentId: true,
                surname: true,
                givenName: true,
                middleName: true,
                programLevel: true,
                programCourse: true,
                academicYear: true,
                yearLevel: true,
                studentStatus: true,
                enrollmentType: true,
                schoolAffiliation: true,
            },
        });
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Active seminary student not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public seminary student profile retrieved successfully',
            data: student,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting public seminary student', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicSeminaryStudent = getPublicSeminaryStudent;
