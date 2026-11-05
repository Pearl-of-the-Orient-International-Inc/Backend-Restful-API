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
exports.createSeminaryAcademicYear = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const academic_year_shared_1 = require("./academic-year-shared");
const createSeminaryAcademicYear = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const academicYear = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const sortOrder = (_a = body.sortOrder) !== null && _a !== void 0 ? _a : ((_b = (yield tx.seminaryAcademicYear.aggregate({
                _max: { sortOrder: true },
            }))._max.sortOrder) !== null && _b !== void 0 ? _b : 0) + 1;
            const createdAcademicYear = yield tx.seminaryAcademicYear.create({
                data: Object.assign(Object.assign({}, (0, academic_year_shared_1.buildSeminaryAcademicYearData)(Object.assign(Object.assign({}, body), { sortOrder }))), { sortOrder }),
            });
            yield (0, academic_year_shared_1.ensureSingleCurrentAcademicYear)(tx, createdAcademicYear.id, createdAcademicYear.session);
            return createdAcademicYear;
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Seminary academic year created successfully',
            data: academicYear,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Academic year already exists',
            });
            return;
        }
        winston_1.logger.error('Error while creating seminary academic year', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createSeminaryAcademicYear = createSeminaryAcademicYear;
