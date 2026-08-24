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
exports.MemoStatus = exports.markMemoDelivery = exports.upsertMemoAttachments = exports.convertDocxToPdf = exports.writeMemoDocx = exports.resolveMemoRecipients = exports.resolveRecipientTargets = exports.generateReferenceNumber = exports.serializeMemoAnnouncement = exports.memoInclude = void 0;
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const client_1 = require("../../../generated/prisma/client");
Object.defineProperty(exports, "MemoStatus", { enumerable: true, get: function () { return client_1.MemoStatus; } });
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.memoInclude = {
    authorUser: {
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
        },
    },
    recipients: {
        orderBy: { createdAt: 'asc' },
    },
    attachments: {
        orderBy: { createdAt: 'asc' },
    },
    deliveryLogs: {
        orderBy: { createdAt: 'asc' },
    },
};
const storageRoot = node_path_1.default.resolve(process.cwd(), 'storage', 'memos');
const serializeMemoAnnouncement = (memo) => ({
    id: memo.id,
    referenceNumber: memo.referenceNumber,
    title: memo.title,
    category: memo.category,
    customCategory: memo.customCategory,
    status: memo.status,
    summary: memo.summary,
    documentName: memo.documentName,
    docxFilePath: memo.docxFilePath,
    pdfFilePath: memo.pdfFilePath,
    pages: memo.pages,
    author: memo.authorUser,
    publishedAt: memo.publishedAt,
    createdAt: memo.createdAt,
    updatedAt: memo.updatedAt,
    recipients: memo.recipients.map((recipient) => ({
        id: recipient.id,
        type: recipient.type,
        userId: recipient.userId,
        memberId: recipient.memberId,
        name: recipient.name,
        email: recipient.email,
        createdAt: recipient.createdAt,
    })),
    attachments: memo.attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
    })),
    deliveryLogs: memo.deliveryLogs.map((log) => ({
        id: log.id,
        recipientId: log.recipientId,
        email: log.email,
        status: log.status,
        messageId: log.messageId,
        error: log.error,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
    })),
});
exports.serializeMemoAnnouncement = serializeMemoAnnouncement;
const generateReferenceNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `R${yy}${mm}`;
    for (let attempt = 0; attempt < 25; attempt += 1) {
        const count = yield prisma_1.prisma.memoAnnouncement.count({
            where: {
                referenceNumber: {
                    startsWith: `${prefix}-`,
                },
            },
        });
        const sequence = String(count + attempt + 1).padStart(4, '0');
        const referenceNumber = `${prefix}-${sequence}`;
        const existing = yield prisma_1.prisma.memoAnnouncement.findUnique({
            where: { referenceNumber },
            select: { id: true },
        });
        if (!existing) {
            return referenceNumber;
        }
    }
    throw new Error('Unable to generate a unique memo reference number');
});
exports.generateReferenceNumber = generateReferenceNumber;
const resolveRecipientTargets = (targets) => __awaiter(void 0, void 0, void 0, function* () {
    const uniqueTargets = Array.from(new Map(targets.map((target) => [`${target.type}:${target.id}`, target])).values());
    const hasUserTargets = uniqueTargets.some((target) => target.type === 'USER');
    if (hasUserTargets) {
        throw new Error('Memo recipients must be approved members only');
    }
    const memberIds = uniqueTargets
        .filter((target) => target.type === 'MEMBER')
        .map((target) => target.id);
    const members = memberIds.length
        ? yield prisma_1.prisma.member.findMany({
            where: {
                id: { in: memberIds },
                isActive: true,
                status: 'APPROVED',
            },
            select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })
        : [];
    if (members.length !== memberIds.length) {
        throw new Error('Memo recipients must be approved members in the database');
    }
    return [
        ...members.map((member) => ({
            type: client_1.MemoRecipientType.MEMBER,
            userId: member.user.id,
            memberId: member.id,
            name: [
                member.firstName,
                member.middleInitial ? `${member.middleInitial.replace(/\.$/, '')}.` : null,
                member.lastName,
                member.extensionName,
            ]
                .filter(Boolean)
                .join(' ') || member.user.name,
            email: member.user.email,
        })),
    ];
});
exports.resolveRecipientTargets = resolveRecipientTargets;
const resolveMemoRecipients = (_a) => __awaiter(void 0, [_a], void 0, function* ({ scope, targets, }) {
    if (scope === 'ALL') {
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                status: 'APPROVED',
            },
            select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return [
            ...members.map((member) => ({
                type: client_1.MemoRecipientType.MEMBER,
                userId: member.user.id,
                memberId: member.id,
                name: [
                    member.firstName,
                    member.middleInitial ? `${member.middleInitial.replace(/\.$/, '')}.` : null,
                    member.lastName,
                    member.extensionName,
                ]
                    .filter(Boolean)
                    .join(' ') || member.user.name,
                email: member.user.email,
            })),
        ];
    }
    if (scope === 'OFFICERS') {
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                status: 'APPROVED',
                officerAssignments: {
                    some: {
                        isActive: true,
                    },
                },
            },
            select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return members.map((member) => ({
            type: client_1.MemoRecipientType.MEMBER,
            userId: member.user.id,
            memberId: member.id,
            name: [
                member.firstName,
                member.middleInitial ? `${member.middleInitial.replace(/\.$/, '')}.` : null,
                member.lastName,
                member.extensionName,
            ]
                .filter(Boolean)
                .join(' ') || member.user.name,
            email: member.user.email,
        }));
    }
    return (0, exports.resolveRecipientTargets)(targets);
});
exports.resolveMemoRecipients = resolveMemoRecipients;
const writeMemoDocx = (_a) => __awaiter(void 0, [_a], void 0, function* ({ memoId, documentName, docxBase64, }) {
    const memoDir = node_path_1.default.join(storageRoot, memoId);
    yield (0, promises_1.mkdir)(memoDir, { recursive: true });
    const safeName = documentName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
    const fileName = safeName.toLowerCase().endsWith('.docx')
        ? safeName
        : `${safeName}.docx`;
    const filePath = node_path_1.default.join(memoDir, fileName);
    const buffer = Buffer.from(docxBase64, 'base64');
    yield (0, promises_1.writeFile)(filePath, buffer);
    return {
        fileName,
        filePath,
        fileSize: buffer.byteLength,
    };
});
exports.writeMemoDocx = writeMemoDocx;
const convertDocxToPdf = (docxPath) => __awaiter(void 0, void 0, void 0, function* () {
    const outputDir = node_path_1.default.dirname(docxPath);
    const baseName = node_path_1.default.basename(docxPath, node_path_1.default.extname(docxPath));
    const pdfPath = node_path_1.default.join(outputDir, `${baseName}.pdf`);
    const commands = ['soffice', 'libreoffice'];
    for (const command of commands) {
        try {
            yield execFileAsync(command, [
                '--headless',
                '--convert-to',
                'pdf',
                '--outdir',
                outputDir,
                docxPath,
            ]);
            const pdfStat = yield (0, promises_1.stat)(pdfPath);
            return {
                fileName: `${baseName}.pdf`,
                filePath: pdfPath,
                fileSize: pdfStat.size,
            };
        }
        catch (error) {
            winston_1.logger.warn('Memo PDF conversion command failed', {
                command,
                error,
            });
        }
    }
    return null;
});
exports.convertDocxToPdf = convertDocxToPdf;
const upsertMemoAttachments = (_a) => __awaiter(void 0, [_a], void 0, function* ({ memoId, docx, pdf, }) {
    if (docx) {
        yield prisma_1.prisma.memoAttachment.create({
            data: {
                memoId,
                kind: client_1.MemoAttachmentKind.DOCX,
                fileName: docx.fileName,
                filePath: docx.filePath,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fileSize: docx.fileSize,
            },
        });
    }
    if (pdf) {
        yield prisma_1.prisma.memoAttachment.create({
            data: {
                memoId,
                kind: client_1.MemoAttachmentKind.PDF,
                fileName: pdf.fileName,
                filePath: pdf.filePath,
                mimeType: 'application/pdf',
                fileSize: pdf.fileSize,
            },
        });
    }
});
exports.upsertMemoAttachments = upsertMemoAttachments;
const markMemoDelivery = (_a) => __awaiter(void 0, [_a], void 0, function* ({ deliveryLogId, success, messageId, error, }) {
    return prisma_1.prisma.memoDeliveryLog.update({
        where: { id: deliveryLogId },
        data: {
            status: success ? client_1.MemoDeliveryStatus.SENT : client_1.MemoDeliveryStatus.FAILED,
            messageId: messageId !== null && messageId !== void 0 ? messageId : null,
            error: success ? null : error instanceof Error ? error.message : String(error !== null && error !== void 0 ? error : 'Email failed'),
            sentAt: success ? new Date() : null,
        },
    });
});
exports.markMemoDelivery = markMemoDelivery;
