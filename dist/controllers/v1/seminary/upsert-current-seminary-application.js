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
exports.upsertCurrentSeminaryApplication = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const mailers_1 = require("../../../mailers");
const seminary_admission_submitted_1 = require("../../../mailers/templates/seminary-admission-submitted");
const seminary_shared_1 = require("./seminary-shared");
const upsertCurrentSeminaryApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const member = userId
            ? yield prisma_1.prisma.member.findUnique({
                where: { userId },
                select: {
                    id: true,
                    memberType: true,
                    status: true,
                },
            })
            : null;
        if (member && member.memberType !== enums_1.MemberType.ASSOCIATE_CHAPLAIN) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Only associate chaplains can submit a seminary application for professional chaplain status',
            });
            return;
        }
        const body = req.body;
        const applicationData = (0, seminary_shared_1.buildSeminaryApplicationData)(body);
        const requirementsData = (0, seminary_shared_1.buildSeminaryRequirementsData)(body);
        const paymentData = (0, seminary_shared_1.buildSeminaryPaymentData)(body);
        const application = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicIdentifiers = [];
            if (applicationData.emailAddress) {
                publicIdentifiers.push({ emailAddress: applicationData.emailAddress });
            }
            if (applicationData.mobilePhone) {
                publicIdentifiers.push({ mobilePhone: applicationData.mobilePhone });
            }
            const existingApplication = member
                ? yield tx.seminaryApplication.findFirst({
                    where: {
                        memberId: member.id,
                        status: {
                            in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'],
                        },
                    },
                    select: { id: true },
                    orderBy: { createdAt: 'desc' },
                })
                : publicIdentifiers.length
                    ? yield tx.seminaryApplication.findFirst({
                        where: {
                            OR: publicIdentifiers,
                            status: {
                                in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'],
                            },
                        },
                        select: { id: true },
                        orderBy: { createdAt: 'desc' },
                    })
                    : null;
            const applicationDataWithMember = Object.assign(Object.assign({}, applicationData), { memberId: (_a = member === null || member === void 0 ? void 0 : member.id) !== null && _a !== void 0 ? _a : null });
            const savedApplication = existingApplication
                ? yield tx.seminaryApplication.update({
                    where: { id: existingApplication.id },
                    data: applicationDataWithMember,
                    select: { id: true },
                })
                : yield tx.seminaryApplication.create({
                    data: applicationDataWithMember,
                    select: { id: true },
                });
            yield tx.seminaryRequirements.upsert({
                where: { applicationId: savedApplication.id },
                create: Object.assign(Object.assign({}, requirementsData), { application: { connect: { id: savedApplication.id } } }),
                update: requirementsData,
            });
            yield tx.seminaryPayment.upsert({
                where: { applicationId: savedApplication.id },
                create: Object.assign(Object.assign({}, paymentData), { application: { connect: { id: savedApplication.id } } }),
                update: paymentData,
            });
            return tx.seminaryApplication.findUnique({
                where: { id: savedApplication.id },
                include: seminary_shared_1.seminaryApplicationInclude,
            });
        }));
        if (applicationData.emailAddress) {
            const applicantName = [
                applicationData.givenName,
                applicationData.middleName,
                applicationData.surname,
            ]
                .filter(Boolean)
                .join(' ');
            const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: applicationData.emailAddress }, (0, seminary_admission_submitted_1.seminaryAdmissionSubmittedTemplate)({
                name: applicantName,
                programLevel: applicationData.programLevel,
                programCourse: applicationData.programCourse,
            })));
            if (!emailResult.success) {
                winston_1.logger.warn('Seminary admission confirmation email failed to send', {
                    applicationId: application === null || application === void 0 ? void 0 : application.id,
                    email: applicationData.emailAddress,
                });
            }
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Application submitted successfully. Please check your email for confirmation and wait for the Admissions Office approval update.',
            data: application,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving current seminary application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.upsertCurrentSeminaryApplication = upsertCurrentSeminaryApplication;
