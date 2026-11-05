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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMemoAnnouncement = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const mailers_1 = require("../../../mailers");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const officer_scope_1 = require("../../../lib/officer-scope");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const buildMemoEmail = ({ referenceNumber, title, }) => ({
    subject: `Ref. No. ${referenceNumber} - ${title}`,
    text: [
        `Ref. No. ${referenceNumber}`,
        '',
        'You are listed as a recipient of this memo.',
        'Attached is the official soft copy for your reference.',
    ].join('\n'),
    html: `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <p style="margin:0 0 12px"><strong>Ref. No. ${referenceNumber}</strong></p>
      <p style="margin:0 0 12px">You are listed as a recipient of this memo.</p>
      <p style="margin:0">Attached is the official soft copy for your reference.</p>
    </div>
  `,
});
const publishMemoAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const body = req.body;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        let memo = yield prisma_1.prisma.memoAnnouncement.findUnique({
            where: { id },
            include: memo_announcement_shared_1.memoInclude,
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
                message: 'Memo announcement is already published',
            });
            return;
        }
        if (memo.status === client_1.MemoStatus.REJECTED) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'A rejected memo must be revised and submitted again before publication',
            });
            return;
        }
        if (memo.authorUserId) {
            const author = yield prisma_1.prisma.user.findUnique({
                where: { id: memo.authorUserId },
                select: { role: true },
            });
            if ((author === null || author === void 0 ? void 0 : author.role) !== 'ADMIN') {
                const scope = yield (0, officer_scope_1.getOfficerScope)(memo.authorUserId);
                if (!scope) {
                    res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                        code: 'CONFLICT',
                        message: 'This officer no longer has an active assignment; the memo cannot be published',
                    });
                    return;
                }
                const recipients = yield (0, memo_announcement_shared_1.resolveMemoRecipientsByMemberWhere)(scope.memberWhere);
                if (!recipients.length) {
                    res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                        code: 'BAD_REQUEST',
                        message: 'There are no active approved members in the officer’s current scope',
                    });
                    return;
                }
                yield prisma_1.prisma.$transaction([
                    prisma_1.prisma.memoRecipient.deleteMany({ where: { memoId: memo.id } }),
                    prisma_1.prisma.memoAnnouncement.update({
                        where: { id: memo.id },
                        data: { recipients: { create: recipients } },
                    }),
                ]);
                memo = (yield prisma_1.prisma.memoAnnouncement.findUniqueOrThrow({
                    where: { id: memo.id },
                    include: memo_announcement_shared_1.memoInclude,
                }));
            }
        }
        if (!memo.recipients.length) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Add at least one TO recipient before publishing',
            });
            return;
        }
        yield prisma_1.prisma.memoAnnouncement.update({
            where: { id: memo.id },
            data: Object.assign({ status: client_1.MemoStatus.PUBLISHING }, (memo.authorUserId
                ? {
                    reviewedAt: new Date(),
                    reviewedByUserId: (_a = req.userId) !== null && _a !== void 0 ? _a : null,
                    reviewNotes: null,
                }
                : {})),
        });
        let docxPath = memo.docxFilePath;
        let docxFileName = memo.documentName;
        if (body.docxBase64 && body.documentName) {
            const docx = yield (0, memo_announcement_shared_1.writeMemoDocx)({
                memoId: memo.id,
                documentName: body.documentName,
                docxBase64: body.docxBase64,
            });
            docxPath = docx.filePath;
            docxFileName = docx.fileName;
            yield (0, memo_announcement_shared_1.upsertMemoAttachments)({ memoId: memo.id, docx });
            yield prisma_1.prisma.memoAnnouncement.update({
                where: { id: memo.id },
                data: {
                    documentName: body.documentName,
                    docxFilePath: docx.filePath,
                },
            });
        }
        if (!docxPath) {
            throw new Error('Save the memo document before publishing');
        }
        const pdf = yield (0, memo_announcement_shared_1.convertDocxToPdf)(docxPath);
        if (pdf) {
            yield (0, memo_announcement_shared_1.upsertMemoAttachments)({ memoId: memo.id, pdf });
            yield prisma_1.prisma.memoAnnouncement.update({
                where: { id: memo.id },
                data: { pdfFilePath: pdf.filePath },
            });
        }
        const attachmentPath = (_b = pdf === null || pdf === void 0 ? void 0 : pdf.filePath) !== null && _b !== void 0 ? _b : docxPath;
        const attachmentFileName = (_c = pdf === null || pdf === void 0 ? void 0 : pdf.fileName) !== null && _c !== void 0 ? _c : docxFileName;
        const attachmentMimeType = pdf
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        yield (0, promises_1.stat)(attachmentPath);
        const deliveryLogs = yield prisma_1.prisma.memoDeliveryLog.createManyAndReturn({
            data: memo.recipients.map((recipient) => ({
                memoId: memo.id,
                recipientId: recipient.id,
                email: recipient.email,
            })),
        });
        const template = buildMemoEmail({
            referenceNumber: memo.referenceNumber,
            title: memo.title,
        });
        for (const log of deliveryLogs) {
            const result = yield (0, mailers_1.sendMail)(Object.assign(Object.assign({ sendTo: log.email }, template), { attachments: [
                    {
                        filename: node_path_1.default.basename(attachmentFileName),
                        path: attachmentPath,
                        contentType: attachmentMimeType,
                    },
                ] }));
            yield (0, memo_announcement_shared_1.markMemoDelivery)({
                deliveryLogId: log.id,
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            });
        }
        const failedCount = yield prisma_1.prisma.memoDeliveryLog.count({
            where: { memoId: memo.id, status: 'FAILED' },
        });
        const publishedMemo = yield prisma_1.prisma.memoAnnouncement.update({
            where: { id: memo.id },
            data: {
                status: failedCount > 0 ? client_1.MemoStatus.FAILED : client_1.MemoStatus.PUBLISHED,
                publishedAt: failedCount > 0 ? null : new Date(),
            },
            include: memo_announcement_shared_1.memoInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: failedCount > 0
                ? 'Memo published, but one or more emails failed'
                : 'Memo published and emailed successfully',
            data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(publishedMemo),
        });
    }
    catch (err) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        yield prisma_1.prisma.memoAnnouncement.updateMany({
            where: { id },
            data: { status: client_1.MemoStatus.FAILED },
        });
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message,
        });
        winston_1.logger.error('Error during memo announcement publishing', err);
    }
});
exports.publishMemoAnnouncement = publishMemoAnnouncement;
