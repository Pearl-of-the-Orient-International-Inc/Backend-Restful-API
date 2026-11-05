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
exports.createCurrentMemberCertificate = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const member_certificate_credential_id_1 = require("../../../lib/member-certificate-credential-id");
const createCurrentMemberCertificate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { userId },
            select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const { type, title, issuer, referenceNumber, certificateUrl, issuedAt, expiresAt, } = req.body;
        const credentialId = yield (0, member_certificate_credential_id_1.generateNextMemberCertificateCredentialId)({
            firstName: member.firstName,
            middleInitial: member.middleInitial,
            lastName: member.lastName,
        });
        const certificate = yield prisma_1.prisma.memberCertificate.create({
            data: {
                memberId: member.id,
                credentialId,
                type,
                title,
                issuer,
                referenceNumber,
                certificateUrl,
                dateReceived: new Date(issuedAt),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            select: {
                id: true,
                credentialId: true,
                type: true,
                title: true,
                issuer: true,
                referenceNumber: true,
                certificateUrl: true,
                dateReceived: true,
                expiresAt: true,
                createdAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Certificate created successfully',
            data: certificate,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating current member certificate', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createCurrentMemberCertificate = createCurrentMemberCertificate;
