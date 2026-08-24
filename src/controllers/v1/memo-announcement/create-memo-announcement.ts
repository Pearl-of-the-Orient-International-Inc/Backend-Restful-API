import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { CreateMemoAnnouncementSchema } from '@/validators/memo-announcement';
import {
  generateReferenceNumber,
  memoInclude,
  resolveMemoRecipients,
  serializeMemoAnnouncement,
  upsertMemoAttachments,
  writeMemoDocx,
} from './memo-announcement-shared';

export const createMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateMemoAnnouncementSchema;
    const recipients = await resolveMemoRecipients({
      scope: body.recipientScope,
      targets: body.recipientTargets ?? [],
    });
    const referenceNumber = await generateReferenceNumber();

    const memo = await prisma.memoAnnouncement.create({
      data: {
        referenceNumber,
        title: body.title.trim(),
        category: body.category,
        customCategory: body.customCategory?.trim() || null,
        summary: body.summary?.trim() || null,
        documentName: body.documentName.trim(),
        authorUserId: req.userId ?? null,
        recipients: {
          create: recipients,
        },
      },
      include: memoInclude,
    });

    if (body.docxBase64) {
      const docx = await writeMemoDocx({
        memoId: memo.id,
        documentName: body.documentName,
        docxBase64: body.docxBase64,
      });

      await upsertMemoAttachments({ memoId: memo.id, docx });
      await prisma.memoAnnouncement.update({
        where: { id: memo.id },
        data: { docxFilePath: docx.filePath },
      });
    }

    const savedMemo = await prisma.memoAnnouncement.findUniqueOrThrow({
      where: { id: memo.id },
      include: memoInclude,
    });

    logger.info('Memo announcement created', {
      memoId: savedMemo.id,
      referenceNumber: savedMemo.referenceNumber,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Memo announcement created successfully',
      data: serializeMemoAnnouncement(savedMemo),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    const status =
      message.includes('recipients') || message.includes('reference')
        ? HTTPSTATUS.BAD_REQUEST
        : HTTPSTATUS.INTERNAL_SERVER_ERROR;

    res.status(status).json({
      code: status === HTTPSTATUS.BAD_REQUEST ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message,
    });
    logger.error('Error during memo announcement creation', err);
  }
};
