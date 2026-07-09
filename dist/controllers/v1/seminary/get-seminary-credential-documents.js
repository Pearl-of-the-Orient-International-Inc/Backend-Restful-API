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
exports.getSeminaryCredentialDocuments = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const getSeminaryCredentialDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = String(req.params.studentId);
        const query = req.query;
        const student = yield prisma_1.prisma.seminaryApplication.findUnique({
            where: { studentId },
            select: { id: true },
        });
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary student not found',
            });
            return;
        }
        const documents = yield prisma_1.prisma.seminaryCredentialDocument.findMany({
            where: Object.assign({ applicationId: student.id }, (query.type ? { type: query.type } : {})),
            include: credential_document_shared_1.seminaryCredentialDocumentInclude,
            orderBy: { issuedAt: 'desc' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary credential documents retrieved successfully',
            data: documents,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary credential documents', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getSeminaryCredentialDocuments = getSeminaryCredentialDocuments;
