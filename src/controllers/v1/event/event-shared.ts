import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  EventMeetingPlatform,
  EventStatus,
  EventType,
  type Event,
  type Prisma,
} from '@/generated/prisma/client';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const sanitizeText = (text: string) =>
  DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });

export const normalizeOptionalText = (value?: string | null) => {
  const sanitized = value ? sanitizeText(value).trim() : '';
  return sanitized || null;
};

export const inferMeetingPlatform = (
  link?: string | null,
): EventMeetingPlatform | null => {
  const normalizedLink = link?.trim().toLowerCase() ?? '';

  if (!normalizedLink) return null;
  if (normalizedLink.includes('zoom.us')) return EventMeetingPlatform.ZOOM;
  if (normalizedLink.includes('meet.google.com')) {
    return EventMeetingPlatform.GOOGLE_MEET;
  }
  if (
    normalizedLink.includes('teams.microsoft.com') ||
    normalizedLink.includes('teams.live.com')
  ) {
    return EventMeetingPlatform.MICROSOFT_TEAMS;
  }

  return EventMeetingPlatform.OTHER;
};

export const resolveEventStatus = (
  event: Pick<Event, 'startsAt' | 'endsAt' | 'status'>,
): EventStatus => {
  if (event.status === EventStatus.CANCELLED) {
    return EventStatus.CANCELLED;
  }

  const now = new Date();

  if (now >= event.startsAt && now <= event.endsAt) {
    return EventStatus.ONGOING;
  }

  if (now > event.endsAt) {
    return EventStatus.COMPLETED;
  }

  return EventStatus.SCHEDULED;
};

export const eventTaggedMemberInclude = {
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
          memberType: true,
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

type EventWithTaggedMembers = Prisma.EventGetPayload<{
  include: typeof eventTaggedMemberInclude;
}>;

export const serializeTaggedMember = (
  taggedMember: EventWithTaggedMembers['taggedMembers'][number],
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
    memberType: taggedMember.member.memberType,
    user: taggedMember.member.user,
  },
});

export const serializeEvent = (event: Event | EventWithTaggedMembers) => ({
  ...event,
  status: resolveEventStatus(event),
  taggedMembers:
    'taggedMembers' in event && Array.isArray(event.taggedMembers)
      ? event.taggedMembers.map(serializeTaggedMember)
      : [],
});

type BuildEventWriteInputArgs = {
  name: string;
  category: Event['category'];
  type: EventType;
  location?: string;
  onlineLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  description: string;
  thumbnailUrl: string;
  organizer: string;
  startsAt: string;
  endsAt: string;
  visibility: Event['visibility'];
};

export const buildEventWriteInput = ({
  name,
  category,
  type,
  location,
  onlineLink,
  meetingId,
  meetingPassword,
  description,
  thumbnailUrl,
  organizer,
  startsAt,
  endsAt,
  visibility,
}: BuildEventWriteInputArgs) => {
  const normalizedType = type;
  const normalizedOnlineLink =
    normalizedType === EventType.ONLINE ? normalizeOptionalText(onlineLink) : null;

  return {
    name: sanitizeText(name).trim(),
    category,
    type: normalizedType,
    location:
      normalizedType === EventType.ONSITE ? normalizeOptionalText(location) : null,
    onlineLink: normalizedOnlineLink,
    meetingPlatform:
      normalizedType === EventType.ONLINE
        ? inferMeetingPlatform(normalizedOnlineLink)
        : null,
    meetingId:
      normalizedType === EventType.ONLINE
        ? normalizeOptionalText(meetingId)
        : null,
    meetingPassword:
      normalizedType === EventType.ONLINE
        ? normalizeOptionalText(meetingPassword)
        : null,
    description: sanitizeText(description).trim(),
    thumbnailUrl: thumbnailUrl.trim(),
    organizer: sanitizeText(organizer).trim(),
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    visibility,
  };
};
