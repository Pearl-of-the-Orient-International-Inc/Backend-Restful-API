import config from '@/config';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/mailers';
import { membershipRenewalReminderTemplate } from '@/mailers/templates/membership-renewal-reminder';

export type RenewalEmailMember = {
  id: string;
  uniqueId: string | null;
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  extensionName: string | null;
  createdAt: Date;
  user: {
    email: string;
  };
};

export const buildRenewalMemberFullName = (member: {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  extensionName: string | null;
}) =>
  [
    member.firstName,
    member.middleInitial,
    member.lastName,
    member.extensionName,
  ]
    .filter(Boolean)
    .join(' ');

export const formatRenewalApplicationDate = (date: Date) =>
  date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export const getRenewalProfileUrl = (member: {
  id: string;
  uniqueId: string | null;
}) => {
  const appUrl = config.APP_URL.replace(/\/$/, '');
  return `${appUrl}/profile/${encodeURIComponent(member.uniqueId ?? member.id)}`;
};

export const getRenewalEmailMemberById = (memberId: string) =>
  prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      uniqueId: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      extensionName: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

export const sendMembershipRenewalEmail = async (
  member: RenewalEmailMember,
) => {
  const memberName = buildRenewalMemberFullName(member);
  const template = membershipRenewalReminderTemplate({
    applicationDate: formatRenewalApplicationDate(member.createdAt),
    memberName,
    profileUrl: getRenewalProfileUrl(member),
  });

  return sendMail({
    sendTo: member.user.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
};
