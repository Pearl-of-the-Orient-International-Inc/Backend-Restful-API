import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemoStatus } from '@/generated/prisma/client';
import { sendMail } from '@/mailers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { PublishMemoAnnouncementSchema } from '@/validators/memo-announcement';
import {
  convertDocxToPdf,
  markMemoDelivery,
  memoInclude,
  serializeMemoAnnouncement,
  upsertMemoAttachments,
  writeMemoDocx,
} from './memo-announcement-shared';

const buildMemoEmail = ({
  referenceNumber,
  title,
}: {
  referenceNumber: string;
  title: string;
}) => ({
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

export const publishMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const body = req.body as PublishMemoAnnouncementSchema;

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memo = await prisma.memoAnnouncement.findUnique({
      where: { id },
      include: memoInclude,
    }) as any;

    if (!memo) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Memo announcement not found',
      });
      return;
    }

    if (memo.status === MemoStatus.PUBLISHED) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Memo announcement is already published',
      });
      return;
    }

    if (!memo.recipients.length) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Add at least one TO recipient before publishing',
      });
      return;
    }

    await prisma.memoAnnouncement.update({
      where: { id: memo.id },
      data: { status: MemoStatus.PUBLISHING },
    });

    let docxPath = memo.docxFilePath;
    let docxFileName = memo.documentName;

    if (body.docxBase64 && body.documentName) {
      const docx = await writeMemoDocx({
        memoId: memo.id,
        documentName: body.documentName,
        docxBase64: body.docxBase64,
      });
      docxPath = docx.filePath;
      docxFileName = docx.fileName;
      await upsertMemoAttachments({ memoId: memo.id, docx });
      await prisma.memoAnnouncement.update({
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

    const pdf = await convertDocxToPdf(docxPath);

    if (pdf) {
      await upsertMemoAttachments({ memoId: memo.id, pdf });
      await prisma.memoAnnouncement.update({
        where: { id: memo.id },
        data: { pdfFilePath: pdf.filePath },
      });
    }

    const attachmentPath = pdf?.filePath ?? docxPath;
    const attachmentFileName = pdf?.fileName ?? docxFileName;
    const attachmentMimeType = pdf
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    await stat(attachmentPath);

    const deliveryLogs = await prisma.memoDeliveryLog.createManyAndReturn({
      data: memo.recipients.map((recipient: any) => ({
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
      const result = await sendMail({
        sendTo: log.email,
        ...template,
        attachments: [
          {
            filename: path.basename(attachmentFileName),
            path: attachmentPath,
            contentType: attachmentMimeType,
          },
        ],
      });

      await markMemoDelivery({
        deliveryLogId: log.id,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    const failedCount = await prisma.memoDeliveryLog.count({
      where: { memoId: memo.id, status: 'FAILED' },
    });

    const publishedMemo = await prisma.memoAnnouncement.update({
      where: { id: memo.id },
      data: {
        status: failedCount > 0 ? MemoStatus.FAILED : MemoStatus.PUBLISHED,
        publishedAt: failedCount > 0 ? null : new Date(),
      },
      include: memoInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message:
        failedCount > 0
          ? 'Memo published, but one or more emails failed'
          : 'Memo published and emailed successfully',
      data: serializeMemoAnnouncement(publishedMemo),
    });
  } catch (err) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.memoAnnouncement.updateMany({
      where: { id },
      data: { status: MemoStatus.FAILED },
    });

    const message =
      err instanceof Error ? err.message : 'Internal server error';

    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
    logger.error('Error during memo announcement publishing', err);
  }
};
