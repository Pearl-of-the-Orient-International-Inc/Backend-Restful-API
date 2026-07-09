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
exports.bulkImportSeminaryStudents = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const student_shared_1 = require("./student-shared");
const bulkImportSeminaryStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const students = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const imported = [];
            for (const row of body.students) {
                const studentId = ((_a = row.studentId) === null || _a === void 0 ? void 0 : _a.trim()) || (yield (0, student_shared_1.buildNextStudentId)(tx));
                const data = (0, student_shared_1.buildSeminaryStudentData)(row);
                const student = ((_b = row.studentId) === null || _b === void 0 ? void 0 : _b.trim())
                    ? yield tx.seminaryApplication.upsert({
                        where: {
                            studentId,
                        },
                        create: Object.assign(Object.assign({}, data), { studentId }),
                        update: data,
                    })
                    : yield tx.seminaryApplication.create({
                        data: Object.assign(Object.assign({}, data), { studentId }),
                    });
                imported.push(student);
            }
            return imported;
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: `${students.length} seminary students imported successfully`,
            data: students,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while bulk importing seminary students', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.bulkImportSeminaryStudents = bulkImportSeminaryStudents;
