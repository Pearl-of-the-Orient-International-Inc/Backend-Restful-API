import { randomBytes } from 'node:crypto';
import { MemberCredentialDocumentType } from '@/generated/prisma/enums';

import type { Prisma } from '@/generated/prisma/client';

const documentPrefixMap: Record<MemberCredentialDocumentType, string> = {
  [MemberCredentialDocumentType.CERTIFICATE]: 'CHAP-CERT',
  [MemberCredentialDocumentType.RECOGNITION]: 'CHAP-REC',
};

const barcodeTypeCodeMap: Record<MemberCredentialDocumentType, string> = {
  [MemberCredentialDocumentType.CERTIFICATE]: '4',
  [MemberCredentialDocumentType.RECOGNITION]: '5',
};

export const memberCredentialDocumentInclude = {
  member: {
    select: {
      id: true,
      uniqueId: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  },
} satisfies Prisma.MemberCredentialDocumentInclude;

export const buildNextMemberCredentialDocumentNumber = async (
  tx: Prisma.TransactionClient,
  type: MemberCredentialDocumentType,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `${documentPrefixMap[type]}-${yearSuffix}-`;
  const latestDocument = await tx.memberCredentialDocument.findFirst({
    where: {
      documentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      documentNumber: 'desc',
    },
    select: {
      documentNumber: true,
    },
  });
  const latestSeries = latestDocument?.documentNumber
    ? Number.parseInt(latestDocument.documentNumber.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;

  return `${prefix}${String(nextSeries).padStart(6, '0')}`;
};

const calculateEan13CheckDigit = (twelveDigits: string) => {
  const sum = twelveDigits
    .split('')
    .reduce((total, digit, index) => {
      const value = Number.parseInt(digit, 10);
      return total + value * (index % 2 === 0 ? 1 : 3);
    }, 0);

  return String((10 - (sum % 10)) % 10);
};

export const buildNextMemberCredentialBarcodeNumber = async (
  tx: Prisma.TransactionClient,
  type: MemberCredentialDocumentType,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `978${barcodeTypeCodeMap[type]}${yearSuffix}`;
  const latestDocument = await tx.memberCredentialDocument.findFirst({
    where: {
      barcodeNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      barcodeNumber: 'desc',
    },
    select: {
      barcodeNumber: true,
    },
  });
  const latestSeries = latestDocument?.barcodeNumber
    ? Number.parseInt(latestDocument.barcodeNumber.slice(prefix.length, 12), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
  const payload = `${prefix}${String(nextSeries).padStart(6, '0')}`;

  return `${payload}${calculateEan13CheckDigit(payload)}`;
};

export const buildMemberCredentialVerificationToken = () =>
  randomBytes(24).toString('hex');
