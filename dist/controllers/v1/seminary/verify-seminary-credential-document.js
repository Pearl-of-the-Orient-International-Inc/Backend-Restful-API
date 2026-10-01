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
exports.verifySeminaryCredentialDocument = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const verifySeminaryCredentialDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.params;
        const document = yield prisma_1.prisma.seminaryCredentialDocument.findUnique({
            where: { verificationToken: params.token },
            include: credential_document_shared_1.seminaryCredentialDocumentInclude,
        });
        if (!document || document.status !== enums_1.SeminaryCredentialDocumentStatus.ACTIVE) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary credential document could not be verified',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary credential document verified successfully',
            data: document,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while verifying seminary credential document', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.verifySeminaryCredentialDocument = verifySeminaryCredentialDocument;
