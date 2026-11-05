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
exports.changeSeminaryStudentPassword = void 0;
const http_codes_1 = require("../../../common/http-codes");
const password_hash_1 = require("../../../lib/password-hash");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const student_portal_account_1 = require("./student-portal-account");
const changeSeminaryStudentPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = String(req.params.studentId);
        const { password } = req.body;
        const student = yield prisma_1.prisma.seminaryApplication.findUnique({
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
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: `No Seminary student record was found for student ID ${studentId}.`,
            });
            return;
        }
        const createdPortalAccount = !student.portalUserId;
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const portalAccount = student.portalUserId
                ? { id: student.portalUserId }
                : yield (0, student_portal_account_1.createSeminaryStudentPortalAccount)(tx, {
                    studentId: (_a = student.studentId) !== null && _a !== void 0 ? _a : studentId,
                    givenName: student.givenName,
                    middleName: student.middleName,
                    surname: student.surname,
                }, password);
            if (!student.portalUserId) {
                yield tx.seminaryApplication.update({
                    where: { id: student.id },
                    data: { portalUserId: portalAccount.id },
                });
            }
            else {
                yield tx.user.update({
                    where: { id: portalAccount.id },
                    data: { password: yield (0, password_hash_1.hashValue)(password) },
                });
            }
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: createdPortalAccount
                ? 'Student portal account created and password saved successfully.'
                : 'Student password changed successfully.',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while changing seminary student password', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to change student password',
        });
    }
});
exports.changeSeminaryStudentPassword = changeSeminaryStudentPassword;
