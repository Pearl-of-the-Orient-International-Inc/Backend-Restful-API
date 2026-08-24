import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemoStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { UpdateMemoAnnouncementSchema } from '@/validators/memo-announcement';
import {
  memoInclude,
  resolveMemoRecipients,
  serializeMemoAnnouncement,
  upsertMemoAttachments,
  writeMemoDocx,
} from './memo-announcement-shared';

export const updateMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body as UpdateMemoAnnouncementSchema;
    const memo = await prisma.memoAnnouncement.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

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
        message: 'Published memos cannot be edited',
      });
      return;
    }

    const shouldUpdateRecipients =
      body.recipientTargets !== undefined || body.recipientScope !== undefined;
    const recipients = shouldUpdateRecipients
      ? await resolveMemoRecipients({
          scope: body.recipientScope,
          targets: body.recipientTargets ?? [],
        })
      : undefined;

    let docx:
      | { fileName: string; filePath: string; fileSize: number }
      | undefined;

    if (body.docxBase64 && body.documentName) {
      docx = await writeMemoDocx({
        memoId: memo.id,
        documentName: body.documentName,
        docxBase64: body.docxBase64,
      });
    }

    await prisma.$transaction(async (tx) => {
      if (recipients) {
        await tx.memoRecipient.deleteMany({ where: { memoId: memo.id } });
      }

      await tx.memoAnnouncement.update({
        where: { id: memo.id },
        data: {
          ...(body.title !== undefined ? { title: body.title.trim() } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.customCategory !== undefined
            ? { customCategory: body.customCategory?.trim() || null }
            : {}),
          ...(body.summary !== undefined ? { summary: body.summary?.trim() || null } : {}),
          ...(body.documentName !== undefined ? { documentName: body.documentName.trim() } : {}),
          ...(docx ? { docxFilePath: docx.filePath } : {}),
          ...(recipients
            ? {
                recipients: {
                  create: recipients,
                },
              }
            : {}),
        },
      });
    });

    if (docx) {
      await upsertMemoAttachments({ memoId: memo.id, docx });
    }

    const updatedMemo = await prisma.memoAnnouncement.findUniqueOrThrow({
      where: { id: memo.id },
      include: memoInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo announcement updated successfully',
      data: serializeMemoAnnouncement(updatedMemo),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('recipients')
      ? HTTPSTATUS.BAD_REQUEST
      : HTTPSTATUS.INTERNAL_SERVER_ERROR;

    res.status(status).json({
      code: status === HTTPSTATUS.BAD_REQUEST ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message,
    });
    logger.error('Error during memo announcement update', err);
  }
};
