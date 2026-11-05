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
exports.generateMemberCredentialDocument = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const generateMemberCredentialDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = String(req.params.id);
        const body = req.body;
        const document = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const member = yield tx.member.findUnique({
                where: { id: memberId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            });
            if (!member)
                return null;
            const existing = yield tx.memberCredentialDocument.findUnique({
                where: {
                    memberId_type: {
                        memberId,
                        type: body.type,
                    },
                },
                include: credential_document_shared_1.memberCredentialDocumentInclude,
            });
            if (existing) {
                if (existing.barcodeNumber)
                    return existing;
                return tx.memberCredentialDocument.update({
                    where: { id: existing.id },
                    data: {
                        barcodeNumber: yield (0, credential_document_shared_1.buildNextMemberCredentialBarcodeNumber)(tx, body.type),
                    },
                    include: credential_document_shared_1.memberCredentialDocumentInclude,
                });
            }
            const title = body.type === 'CERTIFICATE'
                ? 'Certificate'
                : 'Recognition';
            return tx.memberCredentialDocument.create({
                data: {
                    barcodeNumber: yield (0, credential_document_shared_1.buildNextMemberCredentialBarcodeNumber)(tx, body.type),
                    documentNumber: yield (0, credential_document_shared_1.buildNextMemberCredentialDocumentNumber)(tx, body.type),
                    memberId,
                    status: enums_1.MemberCredentialDocumentStatus.ACTIVE,
                    title,
                    type: body.type,
                    verificationToken: (0, credential_document_shared_1.buildMemberCredentialVerificationToken)(),
                },
                include: credential_document_shared_1.memberCredentialDocumentInclude,
            });
        }));
        if (!document) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Member credential document generated successfully',
            data: document,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while generating member credential document', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.generateMemberCredentialDocument = generateMemberCredentialDocument;
