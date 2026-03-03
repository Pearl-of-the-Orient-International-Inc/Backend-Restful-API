import { createRouteHandler, createUploadthing, type FileRouter } from 'uploadthing/express';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

type ImageFileSize = '512KB' | '1MB' | '2MB' | '4MB' | '8MB' | '16MB' | '32MB' | '64MB';

export interface UploadLimitOptions {
  maxFileSize?: ImageFileSize;
  maxFileCount?: number;
}

const f = createUploadthing();

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

export const createUploadRouter = (options: UploadLimitOptions = {}) =>
  ({
    avatarUploader: createAvatarUploaderRoute(options),
  }) satisfies FileRouter;

export const uploadRouter = createUploadRouter();

export const createUploadthingExpressHandler = (
  options: UploadLimitOptions = {},
) => createRouteHandler({ router: createUploadRouter(options) });

export type OurFileRouter = typeof uploadRouter;
