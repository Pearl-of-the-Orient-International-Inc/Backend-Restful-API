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
exports.createSeminaryCourse = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getCourseSummary = (subjects) => ({
    units: subjects.reduce((total, subject) => total + subject.units, 0),
    modality: subjects[0].modality,
});
const createSeminaryCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const body = req.body;
        const sortOrder = (_a = body.sortOrder) !== null && _a !== void 0 ? _a : ((_b = (yield prisma_1.prisma.seminaryCourse.aggregate({
            _max: { sortOrder: true },
        }))._max.sortOrder) !== null && _b !== void 0 ? _b : 0) + 1;
        const summary = getCourseSummary(body.subjects);
        const course = yield prisma_1.prisma.seminaryCourse.create({
            data: {
                courseName: body.courseName,
                courseCode: body.courseCode,
                program: body.program,
                units: summary.units,
                modality: summary.modality,
                subjects: body.subjects,
                status: (_c = body.status) !== null && _c !== void 0 ? _c : enums_1.SeminaryCourseStatus.ACTIVE,
                sortOrder,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Seminary course created successfully',
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
        winston_1.logger.error('Error while creating seminary course', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createSeminaryCourse = createSeminaryCourse;
