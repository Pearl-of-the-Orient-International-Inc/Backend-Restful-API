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
exports.acceptSeminaryInstructorInvite = exports.inviteSeminaryInstructor = exports.sendInstructorInvitation = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const helpers_1 = require("@/lib/helpers");
const password_hash_1 = require("@/lib/password-hash");
const prisma_1 = require("@/lib/prisma");
const verification_redirect_1 = require("@/lib/verification-redirect");
const winston_1 = require("@/lib/winston");
const mailers_1 = require("@/mailers");
const seminary_instructor_account_1 = require("@/mailers/templates/seminary-instructor-account");
const instructor_shared_1 = require("./instructor-shared");
const INVITE_EXPIRES_IN = '30d';
const sendInstructorInvitation = (instructor) => __awaiter(void 0, void 0, void 0, function* () {
    if (!instructor.userId) {
        throw new Error('Instructor has no portal user account.');
    }
    const existingInviteCode = yield prisma_1.prisma.verificationCode.findFirst({
        where: {
            expiresAt: { gt: new Date() },
            type: enums_1.VerificationType.INSTRUCTOR_INVITATION,
            userId: instructor.userId,
        },
    });
    const verificationCode = existingInviteCode !== null && existingInviteCode !== void 0 ? existingInviteCode : (yield prisma_1.prisma.verificationCode.upsert({
        where: { userId: instructor.userId },
        update: {
            code: (0, helpers_1.generateUniqueCode)(),
            expiresAt: (0, helpers_1.calculateExpirationDate)(INVITE_EXPIRES_IN),
            type: enums_1.VerificationType.INSTRUCTOR_INVITATION,
        },
        create: {
            code: (0, helpers_1.generateUniqueCode)(),
            expiresAt: (0, helpers_1.calculateExpirationDate)(INVITE_EXPIRES_IN),
            type: enums_1.VerificationType.INSTRUCTOR_INVITATION,
            userId: instructor.userId,
        },
    }));
    yield prisma_1.prisma.seminaryInstructor.update({
        where: { id: instructor.id },
        data: { inviteAcceptedAt: null, inviteTokenSentAt: new Date() },
    });
    const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: instructor.email }, (0, seminary_instructor_account_1.seminaryInstructorAccountTemplate)({
        instructorId: instructor.facultyId,
        invitationUrl: (0, verification_redirect_1.buildInstructorInvitationUrl)(verificationCode.code),
        name: instructor.name,
    })));
    if (!emailResult.success) {
        winston_1.logger.warn('Instructor invitation email failed to send', {
            email: instructor.email,
            instructorId: instructor.facultyId,
        });
    }
    return emailResult.success;
});
exports.sendInstructorInvitation = sendInstructorInvitation;
const inviteSeminaryInstructor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const instructor = yield prisma_1.prisma.seminaryInstructor.findUnique({
            where: { id },
            select: {
                email: true,
                facultyId: true,
                id: true,
                inviteAcceptedAt: true,
                name: true,
                userId: true,
            },
        });
        if (!instructor) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary instructor not found',
            });
            return;
        }
        if (instructor.inviteAcceptedAt) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Instructor invitation has already been accepted',
            });
            return;
        }
        const success = yield (0, exports.sendInstructorInvitation)(instructor);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: success
                ? 'Instructor invitation sent successfully'
                : 'Instructor invitation saved, but email failed to send',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while inviting seminary instructor', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.inviteSeminaryInstructor = inviteSeminaryInstructor;
const acceptSeminaryInstructorInvite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid or missing invitation token',
            });
            return;
        }
        const verificationCode = yield prisma_1.prisma.verificationCode.findFirst({
            where: {
                code: token,
                expiresAt: { gt: new Date() },
                type: enums_1.VerificationType.INSTRUCTOR_INVITATION,
            },
            include: {
                user: {
                    include: {
                        seminaryInstructor: true,
                    },
                },
            },
        });
        const instructor = verificationCode === null || verificationCode === void 0 ? void 0 : verificationCode.user.seminaryInstructor;
        if (!verificationCode || !instructor) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid or expired invitation token',
            });
            return;
        }
        const body = req.body;
        const hashedPassword = yield (0, password_hash_1.hashValue)(body.password);
        const updatedInstructor = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.user.update({
                where: { id: verificationCode.userId },
                data: {
                    accountStatus: 'ACTIVE',
                    isEmailVerified: true,
                    password: hashedPassword,
                },
            });
            yield tx.verificationCode.delete({
                where: { id: verificationCode.id },
            });
            return tx.seminaryInstructor.update({
                where: { id: instructor.id },
                data: { inviteAcceptedAt: new Date() },
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Instructor invitation accepted successfully',
            data: (0, instructor_shared_1.toInstructorResponse)(updatedInstructor),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while accepting seminary instructor invitation', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.acceptSeminaryInstructorInvite = acceptSeminaryInstructorInvite;
