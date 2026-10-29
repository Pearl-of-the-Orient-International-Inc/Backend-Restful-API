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
exports.updateSeminaryStudent = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const seminary_shared_1 = require("./seminary-shared");
const student_shared_1 = require("./student-shared");
const student_portal_account_1 = require("./student-portal-account");
const updateSeminaryStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const studentId = String(req.params.studentId);
        const existingStudent = yield prisma_1.prisma.seminaryApplication.findUnique({
            where: { studentId },
            select: {
                id: true,
                studentId: true,
                portalUserId: true,
                givenName: true,
                middleName: true,
                surname: true,
            },
        });
        if (!existingStudent) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary student not found',
            });
            return;
        }
        const studentData = (0, student_shared_1.buildSeminaryStudentData)(body);
        const student = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const updated = yield tx.seminaryApplication.update({
                where: { studentId },
                data: studentData,
                include: seminary_shared_1.seminaryApplicationInclude,
            });
            if (existingStudent.portalUserId && existingStudent.studentId) {
                yield tx.user.update({
                    where: { id: existingStudent.portalUserId },
                    data: {
                        name: (0, student_portal_account_1.getSeminaryStudentName)({
                            studentId: existingStudent.studentId,
                            givenName: (_a = studentData.givenName) !== null && _a !== void 0 ? _a : existingStudent.givenName,
                            middleName: (_b = studentData.middleName) !== null && _b !== void 0 ? _b : existingStudent.middleName,
                            surname: (_c = studentData.surname) !== null && _c !== void 0 ? _c : existingStudent.surname,
                        }),
                    },
                });
            }
            return updated;
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary student updated successfully',
            data: student,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary student', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryStudent = updateSeminaryStudent;
