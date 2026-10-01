import {
  createRouteHandler,
  createUploadthing,
  type FileRouter,
} from 'uploadthing/express';
import { UTApi } from 'uploadthing/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';
import { UserType } from '@/generated/prisma/enums';

type UploadFileSize =
  | '512KB'
  | '1MB'
  | '2MB'
  | '4MB'
  | '8MB'
  | '16MB'
  | '32MB'
  | '64MB';

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
  if (!value || !Number.isFinite(value))
    return defaultUploadLimits.maxFileCount;
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          memberProfile: { select: { id: true } },
        },
      });

      if (!user || !user.memberProfile) {
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

const createSeminaryDocumentUploaderRoute = () =>
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
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({
      fileUrl: file.ufsUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }));

const createOrdinationDocumentUploaderRoute = () =>
  f({
    image: { maxFileSize: '8MB', maxFileCount: 1 },
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      const decoded = bearerToken ? verifyAccessToken(bearerToken) as { userId?: string } | null : null;
      if (!decoded?.userId) throw new Error('Authentication required');
      const member = await prisma.member.findUnique({ where: { userId: decoded.userId }, select: { id: true, memberType: true, status: true, isActive: true } });
      if (!member || !member.isActive || member.status !== 'APPROVED' || member.memberType !== 'PROFESSIONAL_CHAPLAIN') throw new Error('Only eligible Professional Chaplains may upload ordination documents');
      return { userId: decoded.userId, memberId: member.id };
    })
    .onUploadComplete(async ({ metadata, file }) => ({ memberId: metadata.memberId, fileUrl: file.ufsUrl, fileName: file.name, mimeType: file.type, fileSize: file.size }));

const createCrasmDocumentUploaderRoute = () =>
  f({ image: { maxFileSize: '8MB', maxFileCount: 1 }, pdf: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const bearerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : undefined;
      const decoded = bearerToken ? verifyAccessToken(bearerToken) as { userId?: string } | null : null;
      if (!decoded?.userId) throw new Error('Authentication required');
      const member = await prisma.member.findUnique({ where: { userId: decoded.userId }, select: { id: true, memberType: true, status: true, isActive: true } });
      if (!member || !member.isActive || member.status !== 'APPROVED' || member.memberType !== 'ORDAINED_AND_COMMISSIONED_PRACTITIONER') throw new Error('Only eligible ordained and commissioned practitioners may upload CRASM documents');
      return { memberId: member.id };
    })
    .onUploadComplete(async ({ metadata, file }) => ({ memberId: metadata.memberId, fileUrl: file.ufsUrl, fileName: file.name, mimeType: file.type, fileSize: file.size }));

const createSeminaryStudyMaterialUploaderRoute = () =>
  f({
    blob: {
      maxFileSize: '32MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => ({
      fileUrl: file.ufsUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    }));

const createMemberProfileBannerUploaderRoute = (
  options: UploadLimitOptions = {},
) => {
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          memberProfile: { select: { id: true } },
        },
      });

      if (!user || !user.memberProfile) {
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
};

const createMemberCertificateUploaderRoute = () =>
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, memberProfile: { select: { id: true } } },
      });

      if (!user || !user.memberProfile) {
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

const createMemberServiceLicenseUploaderRoute = () =>
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
      const decoded = bearerToken
        ? (verifyAccessToken(bearerToken) as { userId?: string } | null)
        : null;

      if (!decoded?.userId) {
        throw new Error('Authentication required');
      }

      const member = await prisma.member.findFirst({
        where: {
          userId: decoded.userId,
          isActive: true,
          status: 'APPROVED',
          memberType: 'CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR',
        },
        select: { id: true },
      });

      if (!member) {
        throw new Error('Only eligible service chaplains may upload a license');
      }

      return { userId: decoded.userId, memberId: member.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      if (file.type !== 'image/png' && file.type !== 'application/pdf') {
        throw new Error('Service licenses must be PNG or PDF files');
      }

      return {
        userId: metadata.userId,
        memberId: metadata.memberId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };
    });

const createMemberPublicRecordAttachmentUploaderRoute = (
  options: UploadLimitOptions = {},
) => {
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, memberProfile: { select: { id: true } } },
      });

      if (!user || !user.memberProfile) {
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
};

const createEventThumbnailUploaderRoute = (
  options: UploadLimitOptions = {},
) => {
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
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

const createBulletinFileUploaderRoute = () =>
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

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) {
        throw new Error('Invalid or expired access token');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== UserType.ADMIN) {
        throw new Error('Only admins can upload bulletin files');
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

const createChaplainProductImageUploaderRoute = () =>
  f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

      if (!bearerToken) throw new Error('Unauthorized upload attempt');

      const decoded = verifyAccessToken(bearerToken) as {
        userId?: string;
      } | null;
      const userId = decoded?.userId;

      if (!userId) throw new Error('Invalid or expired access token');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user || user.role !== UserType.ADMIN) {
        throw new Error('Only admins can upload chaplain product images');
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

export const createUploadRouter = (options: UploadLimitOptions = {}) =>
  ({
    avatarUploader: createAvatarUploaderRoute(options),
    requirementUploader: createMemberRequirementUploaderRoute(),
    ordinationDocumentUploader: createOrdinationDocumentUploaderRoute(),
    crasmDocumentUploader: createCrasmDocumentUploaderRoute(),
    seminaryRequirementUploader: createSeminaryDocumentUploaderRoute(),
    seminaryPaymentReceiptUploader: createSeminaryDocumentUploaderRoute(),
    seminaryStudyMaterialUploader: createSeminaryStudyMaterialUploaderRoute(),
    memberProfileBannerUploader:
      createMemberProfileBannerUploaderRoute(options),
    memberCertificateUploader: createMemberCertificateUploaderRoute(),
    memberServiceLicenseUploader: createMemberServiceLicenseUploaderRoute(),
    memberPublicRecordAttachmentUploader:
      createMemberPublicRecordAttachmentUploaderRoute({
        maxFileSize: options.maxFileSize ?? '8MB',
        maxFileCount: options.maxFileCount ?? 6,
      }),
    eventThumbnailUploader: createEventThumbnailUploaderRoute(options),
    newsBlogMediaUploader: createNewsBlogMediaUploaderRoute(options),
    bulletinFileUploader: createBulletinFileUploaderRoute(),
    chaplainProductImageUploader: createChaplainProductImageUploaderRoute(),
  }) satisfies FileRouter;

export const uploadRouter = createUploadRouter();

export const createUploadthingExpressHandler = (
  options: UploadLimitOptions = {},
) => createRouteHandler({ router: createUploadRouter(options) });

export type OurFileRouter = typeof uploadRouter;
export { utapi };
