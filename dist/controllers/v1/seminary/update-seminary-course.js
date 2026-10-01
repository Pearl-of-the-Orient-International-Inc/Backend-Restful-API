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
exports.updateSeminaryCourse = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getCourseSummary = (subjects) => ({
    units: subjects.reduce((total, subject) => total + subject.units, 0),
    modality: subjects[0].modality,
});
const updateSeminaryCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params.id;
        const body = req.body;
        const existingCourse = yield prisma_1.prisma.seminaryCourse.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingCourse) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary course not found',
            });
            return;
        }
        const summary = getCourseSummary(body.subjects);
        const course = yield prisma_1.prisma.seminaryCourse.update({
            where: { id },
            data: Object.assign({ courseName: body.courseName, courseCode: body.courseCode, program: body.program, units: summary.units, modality: summary.modality, subjects: body.subjects, status: (_a = body.status) !== null && _a !== void 0 ? _a : enums_1.SeminaryCourseStatus.ACTIVE }, (body.sortOrder === undefined ? {} : { sortOrder: body.sortOrder })),
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary course updated successfully',
            data: course,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Course code already exists',
            });
            return;
        }
        winston_1.logger.error('Error while updating seminary course', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryCourse = updateSeminaryCourse;
