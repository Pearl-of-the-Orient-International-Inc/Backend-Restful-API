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
exports.updateMemoAnnouncement = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const updateMemoAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const body = req.body;
        const memo = yield prisma_1.prisma.memoAnnouncement.findUnique({
            where: { id },
            select: { id: true, status: true },
        });
        if (!memo) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Memo announcement not found',
            });
            return;
        }
        if (memo.status === client_1.MemoStatus.PUBLISHED) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Published memos cannot be edited',
            });
            return;
        }
        const shouldUpdateRecipients = body.recipientTargets !== undefined || body.recipientScope !== undefined;
        const recipients = shouldUpdateRecipients
            ? yield (0, memo_announcement_shared_1.resolveMemoRecipients)({
                scope: body.recipientScope,
                targets: (_a = body.recipientTargets) !== null && _a !== void 0 ? _a : [],
            })
            : undefined;
        let docx;
        if (body.docxBase64 && body.documentName) {
            docx = yield (0, memo_announcement_shared_1.writeMemoDocx)({
                memoId: memo.id,
                documentName: body.documentName,
                docxBase64: body.docxBase64,
            });
        }
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (recipients) {
                yield tx.memoRecipient.deleteMany({ where: { memoId: memo.id } });
            }
            yield tx.memoAnnouncement.update({
                where: { id: memo.id },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (body.title !== undefined ? { title: body.title.trim() } : {})), (body.category !== undefined ? { category: body.category } : {})), (body.customCategory !== undefined
                    ? { customCategory: ((_a = body.customCategory) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                    : {})), (body.summary !== undefined ? { summary: ((_b = body.summary) === null || _b === void 0 ? void 0 : _b.trim()) || null } : {})), (body.documentName !== undefined ? { documentName: body.documentName.trim() } : {})), (docx ? { docxFilePath: docx.filePath } : {})), (recipients
                    ? {
                        recipients: {
                            create: recipients,
                        },
                    }
                    : {})),
            });
        }));
        if (docx) {
            yield (0, memo_announcement_shared_1.upsertMemoAttachments)({ memoId: memo.id, docx });
        }
        const updatedMemo = yield prisma_1.prisma.memoAnnouncement.findUniqueOrThrow({
            where: { id: memo.id },
            include: memo_announcement_shared_1.memoInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Memo announcement updated successfully',
            data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(updatedMemo),
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const status = message.includes('recipients')
            ? http_codes_1.HTTPSTATUS.BAD_REQUEST
            : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({
            code: status === http_codes_1.HTTPSTATUS.BAD_REQUEST ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message,
        });
        winston_1.logger.error('Error during memo announcement update', err);
    }
});
exports.updateMemoAnnouncement = updateMemoAnnouncement;
