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
exports.generateSeminaryTranscriptBatch = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const generateSeminaryTranscriptBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentIds } = req.body;
        const documents = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const students = yield tx.seminaryApplication.findMany({ where: { studentId: { in: studentIds } }, select: { id: true, studentId: true, programCourse: true } });
            if (students.length !== new Set(studentIds).size)
                throw new Error('STUDENT_NOT_FOUND');
            const result = [];
            for (const studentId of studentIds) {
                const student = students.find((item) => item.studentId === studentId);
                const existing = yield (0, credential_document_shared_1.findActiveCredentialDocument)(tx, student.id, enums_1.SeminaryCredentialDocumentType.TRANSCRIPT);
                if (existing) {
                    result.push(existing);
                    continue;
                }
                result.push(yield tx.seminaryCredentialDocument.create({ data: { applicationId: student.id, type: enums_1.SeminaryCredentialDocumentType.TRANSCRIPT, status: enums_1.SeminaryCredentialDocumentStatus.ACTIVE, title: 'Official Transcript of Records', documentNumber: yield (0, credential_document_shared_1.buildNextDocumentNumber)(tx, enums_1.SeminaryCredentialDocumentType.TRANSCRIPT), barcodeNumber: yield (0, credential_document_shared_1.buildNextBarcodeNumber)(tx, enums_1.SeminaryCredentialDocumentType.TRANSCRIPT), verificationToken: (0, credential_document_shared_1.buildVerificationToken)() }, include: credential_document_shared_1.seminaryCredentialDocumentInclude }));
            }
            return result;
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Transcript batch generated successfully', data: documents });
    }
    catch (err) {
        if (err instanceof Error && err.message === 'STUDENT_NOT_FOUND') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'One or more seminary students were not found' });
            return;
        }
        winston_1.logger.error('Error while generating seminary transcript batch', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.generateSeminaryTranscriptBatch = generateSeminaryTranscriptBatch;
