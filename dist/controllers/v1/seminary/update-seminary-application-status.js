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
exports.updateSeminaryApplicationStatus = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const mailers_1 = require("@/mailers");
const seminary_application_status_1 = require("@/mailers/templates/seminary-application-status");
const seminary_shared_1 = require("./seminary-shared");
const student_shared_1 = require("./student-shared");
const student_portal_account_1 = require("./student-portal-account");
const fee_collection_account_1 = require("./fee-collection-account");
const getApplicantName = ({ givenName, middleName, surname, }) => [givenName, middleName, surname]
    .filter(Boolean)
    .join(' ')
    .trim();
const updateSeminaryApplicationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        const applicationId = String(req.params.id);
        const existingApplication = yield prisma_1.prisma.seminaryApplication.findUnique({
            where: { id: applicationId },
            select: {
                id: true,
                memberId: true,
                studentId: true,
                portalUserId: true,
                givenName: true,
                middleName: true,
                surname: true,
                emailAddress: true,
                programCourse: true,
                programLevel: true,
            },
        });
        if (!existingApplication) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary application not found',
            });
            return;
        }
        const existingPayment = yield prisma_1.prisma.seminaryPayment.findUnique({
            where: { applicationId: existingApplication.id },
            select: { id: true },
        });
        const application = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const studentId = (body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                body.status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
                !existingApplication.studentId
                ? yield (0, student_shared_1.buildNextStudentId)(tx)
                : undefined;
            const effectiveStudentId = studentId !== null && studentId !== void 0 ? studentId : existingApplication.studentId;
            let portalUserId;
            if ((body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                body.status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
                !existingApplication.portalUserId &&
                effectiveStudentId) {
                const existingPortalAccount = yield tx.user.findUnique({
                    where: { email: (0, student_portal_account_1.getSeminaryStudentPortalEmail)(effectiveStudentId) },
                    select: { id: true },
                });
                portalUserId = (_a = existingPortalAccount === null || existingPortalAccount === void 0 ? void 0 : existingPortalAccount.id) !== null && _a !== void 0 ? _a : (yield (0, student_portal_account_1.createSeminaryStudentPortalAccount)(tx, {
                    studentId: effectiveStudentId,
                    givenName: existingApplication.givenName,
                    middleName: existingApplication.middleName,
                    surname: existingApplication.surname,
                })).id;
            }
            const reviewedApplication = yield tx.seminaryApplication.update({
                where: { id: existingApplication.id },
                data: Object.assign({ status: body.status, reviewRemarks: (_b = body.reviewRemarks) !== null && _b !== void 0 ? _b : null, reviewedAt: body.status === enums_1.SeminaryApplicationStatus.UNDER_REVIEW
                        ? null
                        : new Date(), studentId }, (portalUserId ? { portalUserId } : {})),
                select: {
                    id: true,
                },
            });
            if (existingPayment === null || existingPayment === void 0 ? void 0 : existingPayment.id) {
                yield tx.seminaryPayment.update({
                    where: { id: existingPayment.id },
                    data: {
                        status: body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                            body.status === enums_1.SeminaryApplicationStatus.ENROLLED
                            ? enums_1.SeminaryPaymentStatus.VERIFIED
                            : body.status === enums_1.SeminaryApplicationStatus.REJECTED
                                ? enums_1.SeminaryPaymentStatus.REJECTED
                                : enums_1.SeminaryPaymentStatus.PENDING,
                        verifiedAt: body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                            body.status === enums_1.SeminaryApplicationStatus.ENROLLED
                            ? new Date()
                            : null,
                        reviewRemarks: (_c = body.reviewRemarks) !== null && _c !== void 0 ? _c : null,
                    },
                });
            }
            if ((body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                body.status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
                existingApplication.memberId) {
                yield tx.member.update({
                    where: { id: existingApplication.memberId },
                    data: {
                        memberType: enums_1.MemberType.PROFESSIONAL_CHAPLAIN,
                    },
                });
            }
            if ((body.status === enums_1.SeminaryApplicationStatus.APPROVED ||
                body.status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
                effectiveStudentId &&
                existingApplication.programLevel) {
                yield (0, fee_collection_account_1.ensureSeminaryFeeCollectionAccount)(tx, {
                    studentId: effectiveStudentId,
                    givenName: existingApplication.givenName,
                    middleName: existingApplication.middleName,
                    surname: existingApplication.surname,
                    programCourse: existingApplication.programCourse,
                    programLevel: existingApplication.programLevel,
                });
            }
            return tx.seminaryApplication.findUnique({
                where: { id: reviewedApplication.id },
                include: seminary_shared_1.seminaryApplicationInclude,
            });
        }));
        if (existingApplication.emailAddress) {
            const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: existingApplication.emailAddress }, (0, seminary_application_status_1.seminaryApplicationStatusTemplate)({
                name: getApplicantName(existingApplication) ||
                    existingApplication.emailAddress,
                programCourse: (_a = existingApplication.programCourse) !== null && _a !== void 0 ? _a : 'Selected program',
                reason: body.reviewRemarks,
                status: body.status,
                studentId: application === null || application === void 0 ? void 0 : application.studentId,
            })));
            if (!emailResult.success) {
                winston_1.logger.warn('Seminary application status email failed to send', {
                    applicationId: existingApplication.id,
                    email: existingApplication.emailAddress,
                    status: body.status,
                });
            }
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: `Seminary application marked as ${body.status.toLowerCase().replace(/_/g, ' ')} successfully`,
            data: application,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary application status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryApplicationStatus = updateSeminaryApplicationStatus;
