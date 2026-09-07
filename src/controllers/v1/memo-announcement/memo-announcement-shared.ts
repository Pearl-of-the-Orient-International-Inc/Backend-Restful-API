import { execFile } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Prisma } from '@/generated/prisma/client';
import {
  MemoAttachmentKind,
  MemoDeliveryStatus,
  MemoRecipientType,
  MemoStatus,
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const execFileAsync = promisify(execFile);

export const memoInclude = {
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
} as const;

export type MemoWithRelations = Prisma.MemoAnnouncementGetPayload<{
  include: typeof memoInclude;
}>;

export type RecipientTarget = {
  type: 'USER' | 'MEMBER';
  id: string;
};

export type RecipientScope = 'SPECIFIC' | 'ALL' | 'OFFICERS';

const storageRoot = path.resolve(process.cwd(), 'storage', 'memos');

export const serializeMemoAnnouncement = (memo: MemoWithRelations | any) => ({
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
  recipients: memo.recipients.map((recipient: any) => ({
    id: recipient.id,
    type: recipient.type,
    userId: recipient.userId,
    memberId: recipient.memberId,
    name: recipient.name,
    email: recipient.email,
    createdAt: recipient.createdAt,
  })),
  attachments: memo.attachments.map((attachment: any) => ({
    id: attachment.id,
    kind: attachment.kind,
    fileName: attachment.fileName,
    filePath: attachment.filePath,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    createdAt: attachment.createdAt,
  })),
  deliveryLogs: memo.deliveryLogs.map((log: any) => ({
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

export const generateReferenceNumber = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `R${yy}${mm}`;
  const latestMemo = await prisma.memoAnnouncement.findFirst({
    where: {
      referenceNumber: {
        startsWith: `${prefix}-`,
      },
    },
    orderBy: { referenceNumber: 'desc' },
    select: { referenceNumber: true },
  });
  const latestSequence = latestMemo
    ? Number.parseInt(latestMemo.referenceNumber.slice(prefix.length + 1), 10)
    : 0;

  if (!Number.isSafeInteger(latestSequence) || latestSequence >= 9999) {
    throw new Error('Unable to generate a unique memo reference number');
  }

  return `${prefix}-${String(latestSequence + 1).padStart(4, '0')}`;
};

export const resolveRecipientTargets = async (targets: RecipientTarget[]) => {
  const uniqueTargets = Array.from(
    new Map(targets.map((target) => [`${target.type}:${target.id}`, target])).values(),
  );
  const hasUserTargets = uniqueTargets.some((target) => target.type === 'USER');

  if (hasUserTargets) {
    throw new Error('Memo recipients must be approved members only');
  }

  const memberIds = uniqueTargets
    .filter((target) => target.type === 'MEMBER')
    .map((target) => target.id);

  const members = memberIds.length
    ? await prisma.member.findMany({
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
      type: MemoRecipientType.MEMBER,
      userId: member.user.id,
      memberId: member.id,
      name:
        [
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
};

export const resolveMemoRecipients = async ({
  scope,
  targets,
}: {
  scope?: RecipientScope;
  targets: RecipientTarget[];
}) => {
  if (scope === 'ALL') {
    const members = await prisma.member.findMany({
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
        type: MemoRecipientType.MEMBER,
        userId: member.user.id,
        memberId: member.id,
        name:
          [
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
    const members = await prisma.member.findMany({
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
      type: MemoRecipientType.MEMBER,
      userId: member.user.id,
      memberId: member.id,
      name:
        [
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

  return resolveRecipientTargets(targets);
};

export const writeMemoDocx = async ({
  memoId,
  documentName,
  docxBase64,
}: {
  memoId: string;
  documentName: string;
  docxBase64: string;
}) => {
  const memoDir = path.join(storageRoot, memoId);
  await mkdir(memoDir, { recursive: true });

  const safeName = documentName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
  const fileName = safeName.toLowerCase().endsWith('.docx')
    ? safeName
    : `${safeName}.docx`;
  const filePath = path.join(memoDir, fileName);
  const buffer = Buffer.from(docxBase64, 'base64');

  await writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    fileSize: buffer.byteLength,
  };
};

export const convertDocxToPdf = async (docxPath: string) => {
  const outputDir = path.dirname(docxPath);
  const baseName = path.basename(docxPath, path.extname(docxPath));
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);
  const commands = ['soffice', 'libreoffice'];

  for (const command of commands) {
    try {
      await execFileAsync(command, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        docxPath,
      ]);
      const pdfStat = await stat(pdfPath);

      return {
        fileName: `${baseName}.pdf`,
        filePath: pdfPath,
        fileSize: pdfStat.size,
      };
    } catch (error) {
      logger.warn('Memo PDF conversion command failed', {
        command,
        error,
      });
    }
  }

  return null;
};

export const upsertMemoAttachments = async ({
  memoId,
  docx,
  pdf,
}: {
  memoId: string;
  docx?: { fileName: string; filePath: string; fileSize: number } | null;
  pdf?: { fileName: string; filePath: string; fileSize: number } | null;
}) => {
  if (docx) {
    await prisma.memoAttachment.create({
      data: {
        memoId,
        kind: MemoAttachmentKind.DOCX,
        fileName: docx.fileName,
        filePath: docx.filePath,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: docx.fileSize,
      },
    });
  }

  if (pdf) {
    await prisma.memoAttachment.create({
      data: {
        memoId,
        kind: MemoAttachmentKind.PDF,
        fileName: pdf.fileName,
        filePath: pdf.filePath,
        mimeType: 'application/pdf',
        fileSize: pdf.fileSize,
      },
    });
  }
};

export const markMemoDelivery = async ({
  deliveryLogId,
  success,
  messageId,
  error,
}: {
  deliveryLogId: string;
  success: boolean;
  messageId?: string;
  error?: unknown;
}) =>
  prisma.memoDeliveryLog.update({
    where: { id: deliveryLogId },
    data: {
      status: success ? MemoDeliveryStatus.SENT : MemoDeliveryStatus.FAILED,
      messageId: messageId ?? null,
      error: success ? null : error instanceof Error ? error.message : String(error ?? 'Email failed'),
      sentAt: success ? new Date() : null,
    },
  });

export { MemoStatus };
