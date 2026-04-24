import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  NewsBlogPlatform,
  NewsBlogStatus,
  type NewsBlog,
  type Prisma,
} from '@/generated/prisma/client';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_CAPTION_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'code',
  'pre',
  'hr',
];

const ALLOWED_CAPTION_ATTR = ['href', 'target', 'rel'];

export const sanitizePlainText = (text: string) =>
  DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });

export const sanitizeCaptionHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_CAPTION_TAGS,
    ALLOWED_ATTR: ALLOWED_CAPTION_ATTR,
  }).trim();

export const newsBlogInclude = {
  media: {
    orderBy: { sortOrder: 'asc' },
  },
  taggedMembers: {
    orderBy: { taggedAt: 'asc' },
    include: {
      member: {
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
              avatar: true,
            },
          },
        },
      },
    },
  },
} as const;

export type NewsBlogWithRelations = Prisma.NewsBlogGetPayload<{
  include: typeof newsBlogInclude;
}>;

export const resolveNewsBlogStatus = (
  newsBlog: Pick<NewsBlog, 'status' | 'scheduledAt' | 'publishedAt'>,
): NewsBlogStatus => {
  if (newsBlog.status === NewsBlogStatus.PUBLISHED) {
    return NewsBlogStatus.PUBLISHED;
  }

  if (newsBlog.scheduledAt) {
    return NewsBlogStatus.SCHEDULED;
  }

  return NewsBlogStatus.DRAFT;
};

export const serializeNewsBlogTaggedMember = (
  taggedMember: NewsBlogWithRelations['taggedMembers'][number],
) => ({
  id: taggedMember.id,
  memberId: taggedMember.memberId,
  taggedAt: taggedMember.taggedAt,
  member: {
    id: taggedMember.member.id,
    firstName: taggedMember.member.firstName,
    middleInitial: taggedMember.member.middleInitial,
    lastName: taggedMember.member.lastName,
    extensionName: taggedMember.member.extensionName,
    fullName:
      [
        taggedMember.member.firstName,
        taggedMember.member.middleInitial
          ? `${taggedMember.member.middleInitial.replace(/\.$/, '')}.`
          : null,
        taggedMember.member.lastName,
        taggedMember.member.extensionName,
      ]
        .filter(Boolean)
        .join(' ') || taggedMember.member.user.name,
    user: taggedMember.member.user,
  },
});

type BuildNewsBlogWriteInputArgs = {
  title: string;
  caption: string;
  status?: NewsBlogStatus;
  platform?: NewsBlog['platform'];
  hashtags: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

export const buildNewsBlogWriteInput = ({
  title,
  caption,
  status,
  platform,
  hashtags,
  scheduledAt,
  publishedAt,
}: BuildNewsBlogWriteInputArgs) => {
  const normalizedHashtags = [...new Set(
    hashtags
      .map((tag) => sanitizePlainText(tag).trim().replace(/\s+/g, ''))
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
  )];

  return {
    title: sanitizePlainText(title).trim(),
    caption: sanitizeCaptionHtml(caption),
    status:
    status ??
      (publishedAt
        ? NewsBlogStatus.PUBLISHED
        : scheduledAt
          ? NewsBlogStatus.SCHEDULED
          : NewsBlogStatus.DRAFT),
    platform: platform ?? NewsBlogPlatform.FACEBOOK,
    hashtags: normalizedHashtags,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
  };
};

export const serializeNewsBlog = (newsBlog: NewsBlogWithRelations | NewsBlog) => ({
  ...newsBlog,
  status: resolveNewsBlogStatus(newsBlog),
  media:
    'media' in newsBlog && Array.isArray(newsBlog.media)
      ? newsBlog.media.map((mediaItem) => ({
          id: mediaItem.id,
          kind: mediaItem.kind,
          fileUrl: mediaItem.fileUrl,
          fileName: mediaItem.fileName,
          sortOrder: mediaItem.sortOrder,
          createdAt: mediaItem.createdAt,
        }))
      : [],
  taggedMembers:
    'taggedMembers' in newsBlog && Array.isArray(newsBlog.taggedMembers)
      ? newsBlog.taggedMembers.map(serializeNewsBlogTaggedMember)
      : [],
});
