import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { UpdateNewsBlogSchema } from '@/validators/news-blog';
import {
  buildNewsBlogWriteInput,
  newsBlogInclude,
  serializeNewsBlog,
} from './news-blog-shared';

export const updateNewsBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid News Blog ID is required',
      });
      return;
    }

    const existingNewsBlog = await prisma.newsBlog.findUnique({
      where: { id },
    });

    if (!existingNewsBlog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'News blog not found',
      });
      return;
    }

    const payload = req.body as UpdateNewsBlogSchema;
    const taggedMemberIds = [...new Set(payload.taggedMemberIds ?? [])];

    if (taggedMemberIds.length) {
      const members = await prisma.member.findMany({
        where: {
          id: { in: taggedMemberIds },
          isActive: true,
          status: MemberStatus.APPROVED,
        },
        select: { id: true },
      });

      if (members.length !== taggedMemberIds.length) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Tagged members must be active approved members',
        });
        return;
      }
    }

    const newsBlog = await prisma.$transaction(async (tx) => {
      await tx.newsBlog.update({
        where: { id },
        data: buildNewsBlogWriteInput(payload),
      });

      await tx.newsBlogMedia.deleteMany({
        where: { newsBlogId: id },
      });

      await tx.newsBlogMedia.createMany({
        data: payload.media.map((mediaItem, index) => ({
          newsBlogId: id,
          kind: mediaItem.kind,
          fileUrl: mediaItem.fileUrl.trim(),
          fileName: mediaItem.fileName.trim(),
          sortOrder: index,
        })),
      });

      await tx.newsBlogTaggedMember.deleteMany({
        where: { newsBlogId: id },
      });

      if (taggedMemberIds.length) {
        await tx.newsBlogTaggedMember.createMany({
          data: taggedMemberIds.map((memberId) => ({
            newsBlogId: id,
            memberId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.newsBlog.findUniqueOrThrow({
        where: { id },
        include: newsBlogInclude,
      });
    });

    logger.info('News blog updated successfully', {
      newsBlogId: newsBlog.id,
      title: newsBlog.title,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'News blog updated successfully',
      data: serializeNewsBlog(newsBlog),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during news blog update', err);
  }
};
