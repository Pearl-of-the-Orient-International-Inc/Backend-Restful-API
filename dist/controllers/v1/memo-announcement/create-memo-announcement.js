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
exports.createMemoAnnouncement = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const createMemoAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const body = req.body;
        const recipients = yield (0, memo_announcement_shared_1.resolveMemoRecipients)({
            scope: body.recipientScope,
            targets: (_a = body.recipientTargets) !== null && _a !== void 0 ? _a : [],
        });
        const referenceNumber = yield (0, memo_announcement_shared_1.generateReferenceNumber)();
        const memo = yield prisma_1.prisma.memoAnnouncement.create({
            data: {
                referenceNumber,
                title: body.title.trim(),
                category: body.category,
                customCategory: ((_b = body.customCategory) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                summary: ((_c = body.summary) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                documentName: body.documentName.trim(),
                authorUserId: (_d = req.userId) !== null && _d !== void 0 ? _d : null,
                recipients: {
                    create: recipients,
                },
            },
            include: memo_announcement_shared_1.memoInclude,
        });
        if (body.docxBase64) {
            const docx = yield (0, memo_announcement_shared_1.writeMemoDocx)({
                memoId: memo.id,
                documentName: body.documentName,
                docxBase64: body.docxBase64,
            });
            yield (0, memo_announcement_shared_1.upsertMemoAttachments)({ memoId: memo.id, docx });
            yield prisma_1.prisma.memoAnnouncement.update({
                where: { id: memo.id },
                data: { docxFilePath: docx.filePath },
            });
        }
        const savedMemo = yield prisma_1.prisma.memoAnnouncement.findUniqueOrThrow({
            where: { id: memo.id },
            include: memo_announcement_shared_1.memoInclude,
        });
        winston_1.logger.info('Memo announcement created', {
            memoId: savedMemo.id,
            referenceNumber: savedMemo.referenceNumber,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Memo announcement created successfully',
            data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(savedMemo),
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('recipients') || message.includes('reference')
            ? http_codes_1.HTTPSTATUS.BAD_REQUEST
            : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            code: status === http_codes_1.HTTPSTATUS.BAD_REQUEST ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message,
        });
        winston_1.logger.error('Error during memo announcement creation', err);
    }
});
exports.createMemoAnnouncement = createMemoAnnouncement;
