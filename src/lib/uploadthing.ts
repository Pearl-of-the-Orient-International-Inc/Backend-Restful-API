import { createRouteHandler, createUploadthing, type FileRouter } from 'uploadthing/express';
import { UTApi } from 'uploadthing/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';
import { UserType } from '@/generated/prisma/enums';

type UploadFileSize = '512KB' | '1MB' | '2MB' | '4MB' | '8MB' | '16MB' | '32MB' | '64MB';

export interface UploadLimitOptions {
  maxFileSize?: UploadFileSize;
  maxFileCount?: number;
}

const f = createUploadthing();
const utapi = new UTApi();

const defaultUploadLimits: Required<UploadLimitOptions> = {
  maxFileSize: '4MB',
  maxFileCount: 1,
};

const sanitizeMaxFileCount = (value?: number): number => {
  if (!value || !Number.isFinite(value)) return defaultUploadLimits.maxFileCount;
  return Math.min(Math.max(Math.floor(value), 1), 10);
};

const createAvatarUploaderRoute = (options: UploadLimitOptions = {}) => {
  const maxFileSize = options.maxFileSize ?? defaultUploadLimits.maxFileSize;
  const maxFileCount = sanitizeMaxFileCount(options.maxFileCount);

  return f({
    image: {
      maxFileSize,
      maxFileCount,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

      if (!bearerToken) {
        throw new Error('Unauthorized upload attempt');
      }

      const decoded = verifyAccessToken(bearerToken) as { userId?: string } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          avatar: file.ufsUrl,
        },
      });

      return {
        userId: metadata.userId,
        avatarUrl: file.ufsUrl,
      };
    });
};

const createMemberRequirementUploaderRoute = () =>
  f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: '16MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

      if (!bearerToken) {
        throw new Error('Unauthorized upload attempt');
      }

      const decoded = verifyAccessToken(bearerToken) as { userId?: string } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, memberProfile: { select: { id: true } } },
      });

      if (!user || user.role !== UserType.MEMBER || !user.memberProfile) {
        throw new Error('Member profile not found');
      }

      return { userId, memberId: user.memberProfile.id };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      userId: metadata.userId,
      memberId: metadata.memberId,
      fileUrl: file.ufsUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }));

const createEventThumbnailUploaderRoute = (options: UploadLimitOptions = {}) => {
  const maxFileSize = options.maxFileSize ?? defaultUploadLimits.maxFileSize;
  const maxFileCount = sanitizeMaxFileCount(options.maxFileCount);

  return f({
    image: {
      maxFileSize,
      maxFileCount,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

      if (!bearerToken) {
        throw new Error('Unauthorized upload attempt');
      }

      const decoded = verifyAccessToken(bearerToken) as { userId?: string } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== UserType.ADMIN) {
        throw new Error('Only admins can upload event thumbnails');
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      userId: metadata.userId,
      fileUrl: file.ufsUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }));
};

const createNewsBlogMediaUploaderRoute = (options: UploadLimitOptions = {}) => {
  const maxFileSize = options.maxFileSize ?? defaultUploadLimits.maxFileSize;
  const maxFileCount = sanitizeMaxFileCount(options.maxFileCount);

  return f({
    image: {
      maxFileSize,
      maxFileCount,
    },
    video: {
      maxFileSize: '32MB',
      maxFileCount,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

      if (!bearerToken) {
        throw new Error('Unauthorized upload attempt');
      }

      const decoded = verifyAccessToken(bearerToken) as { userId?: string } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== UserType.ADMIN) {
        throw new Error('Only admins can upload news blog media');
      }

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => ({
      userId: metadata.userId,
      fileUrl: file.ufsUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }));
};

export const createUploadRouter = (options: UploadLimitOptions = {}) =>
  ({
    avatarUploader: createAvatarUploaderRoute(options),
    requirementUploader: createMemberRequirementUploaderRoute(),
    eventThumbnailUploader: createEventThumbnailUploaderRoute(options),
    newsBlogMediaUploader: createNewsBlogMediaUploaderRoute(options),
  }) satisfies FileRouter;

export const uploadRouter = createUploadRouter();

export const createUploadthingExpressHandler = (
  options: UploadLimitOptions = {},
) => createRouteHandler({ router: createUploadRouter(options) });

export type OurFileRouter = typeof uploadRouter;
export { utapi };
