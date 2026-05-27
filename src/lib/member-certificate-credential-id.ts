import { prisma } from '@/lib/prisma';

const SERIES_WIDTH = 5;

const buildInitials = (
  firstName: string,
  middleInitial: string | null,
  lastName: string,
) => {
  const first = firstName.trim().charAt(0) || 'X';
  const middle = middleInitial?.trim().charAt(0) || 'X';
  const last = lastName.trim().charAt(0) || 'X';

  return `${first}${middle}${last}`.toUpperCase();
};

export async function generateNextMemberCertificateCredentialId(input: {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
}) {
  const initials = buildInitials(
    input.firstName,
    input.middleInitial,
    input.lastName,
  );
  const prefix = `CERT-${initials}-`;

  const latestCertificate = await prisma.memberCertificate.findFirst({
    where: {
      credentialId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      credentialId: 'desc',
    },
    select: {
      credentialId: true,
    },
  });

  const currentSeries = latestCertificate?.credentialId
    ? Number.parseInt(
        latestCertificate.credentialId.slice(prefix.length),
        10,
      ) || 0
    : 0;

  const nextSeries = (currentSeries + 1).toString().padStart(SERIES_WIDTH, '0');

  return `${prefix}${nextSeries}`;
}
