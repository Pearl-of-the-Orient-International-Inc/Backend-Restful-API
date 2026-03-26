import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import {
  EventMeetingPlatform,
  EventStatus,
  EventType,
  type Event,
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

export const serializeEvent = (event: Event) => ({
  ...event,
  status: resolveEventStatus(event),
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
