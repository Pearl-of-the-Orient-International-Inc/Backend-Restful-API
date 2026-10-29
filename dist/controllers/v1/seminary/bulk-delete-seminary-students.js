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
exports.bulkDeleteSeminaryStudents = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const bulkDeleteSeminaryStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentIds } = req.body;
        const uniqueStudentIds = Array.from(new Set(studentIds));
        const students = yield prisma_1.prisma.seminaryApplication.findMany({
            where: { studentId: { in: uniqueStudentIds } },
            select: { id: true, portalUserId: true },
        });
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const deleted = yield tx.seminaryApplication.deleteMany({
                where: { id: { in: students.map((student) => student.id) } },
            });
            const portalUserIds = students.flatMap((student) => student.portalUserId ? [student.portalUserId] : []);
            if (portalUserIds.length) {
                yield tx.user.deleteMany({ where: { id: { in: portalUserIds } } });
            }
            return deleted;
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: `${result.count} seminary students deleted successfully`,
            data: { count: result.count },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while bulk deleting seminary students', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.bulkDeleteSeminaryStudents = bulkDeleteSeminaryStudents;
