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
exports.generateSeminaryCredentialDocument = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const generateSeminaryCredentialDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = String(req.params.studentId);
        const body = req.body;
        const document = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const application = yield tx.seminaryApplication.findUnique({
                where: { studentId },
                select: {
                    id: true,
                    programCourse: true,
                },
            });
            if (!application)
                return null;
            const existing = yield (0, credential_document_shared_1.findActiveCredentialDocument)(tx, application.id, body.type);
            if (existing) {
                if (existing.barcodeNumber)
                    return existing;
                return tx.seminaryCredentialDocument.update({
                    where: { id: existing.id },
                    data: {
                        barcodeNumber: yield (0, credential_document_shared_1.buildNextBarcodeNumber)(tx, body.type),
                    },
                    include: credential_document_shared_1.seminaryCredentialDocumentInclude,
                });
            }
            const barcodeNumber = yield (0, credential_document_shared_1.buildNextBarcodeNumber)(tx, body.type);
            const documentNumber = yield (0, credential_document_shared_1.buildNextDocumentNumber)(tx, body.type);
            const title = ((_a = body.title) === null || _a === void 0 ? void 0 : _a.trim()) ||
                (body.type === enums_1.SeminaryCredentialDocumentType.DIPLOMA
                    ? 'Diploma'
                    : body.type === enums_1.SeminaryCredentialDocumentType.TRANSCRIPT
                        ? 'Transcript of Records'
                        : application.programCourse || 'Certificate');
            return tx.seminaryCredentialDocument.create({
                data: {
                    applicationId: application.id,
                    barcodeNumber,
                    documentNumber,
                    remarks: ((_b = body.remarks) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                    status: enums_1.SeminaryCredentialDocumentStatus.ACTIVE,
                    title,
                    type: body.type,
                    verificationToken: (0, credential_document_shared_1.buildVerificationToken)(),
                },
                include: credential_document_shared_1.seminaryCredentialDocumentInclude,
            });
        }));
        if (!document) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary student not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Seminary credential document generated successfully',
            data: document,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while generating seminary credential document', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.generateSeminaryCredentialDocument = generateSeminaryCredentialDocument;
