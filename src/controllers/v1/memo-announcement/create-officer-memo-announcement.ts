import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { requireOfficerScope } from '@/lib/officer-scope';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  generateReferenceNumber,
  memoInclude,
  resolveMemoRecipientsByMemberWhere,
  serializeMemoAnnouncement,
  upsertMemoAttachments,
  writeOfficerMemoDocument,
  writeMemoDocx,
} from './memo-announcement-shared';

export const createOfficerMemoAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = await requireOfficerScope(req.userId!);
    const body = req.body as { title: string; category: any; customCategory?: string | null; summary?: string | null; content?: string; documentName?: string; docxBase64?: string };
    const recipients = await resolveMemoRecipientsByMemberWhere(scope.memberWhere);
    if (!recipients.length) throw new Error('There are no active approved members in your current scope');

    let memo: any;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const referenceNumber = await generateReferenceNumber();
        memo = await prisma.memoAnnouncement.create({
          data: { referenceNumber, title: body.title.trim(), category: body.category, customCategory: body.customCategory?.trim() || null, summary: body.summary?.trim() || null, documentName: body.documentName?.trim() || `${referenceNumber}.docx`, authorUserId: req.userId!, recipients: { create: recipients } },
          include: memoInclude,
        });
        break;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002' || attempt === 4) throw error;
      }
    }
    if (!memo) throw new Error('Unable to generate a unique memo reference number');

    const docx = body.docxBase64
      ? await writeMemoDocx({ memoId: memo.id, documentName: memo.documentName, docxBase64: body.docxBase64 })
      : await writeOfficerMemoDocument({
          memoId: memo.id,
          documentName: memo.documentName,
          title: body.title.trim(),
          content: body.content ?? '',
        });
    await upsertMemoAttachments({ memoId: memo.id, docx });
    await prisma.memoAnnouncement.update({ where: { id: memo.id }, data: { docxFilePath: docx.filePath } });
    const savedMemo = await prisma.memoAnnouncement.findUniqueOrThrow({ where: { id: memo.id }, include: memoInclude });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Memo draft created and submitted for administrator review', data: serializeMemoAnnouncement(savedMemo) });
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? Number((error as { statusCode: number }).statusCode) : HTTPSTATUS.BAD_REQUEST;
    res.status(status).json({ code: status === HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Unable to create memo draft' });
    logger.error('Error creating officer memo announcement', { error, userId: req.userId });
  }
};
