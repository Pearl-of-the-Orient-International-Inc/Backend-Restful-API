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
exports.getAllSeminaryCredentialDocuments = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const credential_document_shared_1 = require("./credential-document-shared");
const getAllSeminaryCredentialDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const limit = (_b = query.limit) !== null && _b !== void 0 ? _b : 20;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign(Object.assign({}, (query.type ? { type: query.type } : {})), (search ? { OR: [
                { documentNumber: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { application: { is: { OR: [
                                { studentId: { contains: search, mode: 'insensitive' } },
                                { givenName: { contains: search, mode: 'insensitive' } },
                                { surname: { contains: search, mode: 'insensitive' } },
                                { programCourse: { contains: search, mode: 'insensitive' } },
                            ] } } },
            ] } : {}));
        const [data, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryCredentialDocument.findMany({ where, include: credential_document_shared_1.seminaryCredentialDocumentInclude, orderBy: { issuedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            prisma_1.prisma.seminaryCredentialDocument.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Seminary credential documents retrieved successfully', data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary credential documents', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAllSeminaryCredentialDocuments = getAllSeminaryCredentialDocuments;
