import { randomBytes } from 'node:crypto';
import {
  SeminaryCredentialDocumentStatus,
  SeminaryCredentialDocumentType,
} from '@/generated/prisma/enums';

import type { Prisma } from '@/generated/prisma/client';

const documentPrefixMap: Record<SeminaryCredentialDocumentType, string> = {
  [SeminaryCredentialDocumentType.DIPLOMA]: 'DIP',
  [SeminaryCredentialDocumentType.CERTIFICATE]: 'CERT',
  [SeminaryCredentialDocumentType.TRANSCRIPT]: 'TOR',
};

const barcodeTypeCodeMap: Record<SeminaryCredentialDocumentType, string> = {
  [SeminaryCredentialDocumentType.DIPLOMA]: '2',
  [SeminaryCredentialDocumentType.CERTIFICATE]: '1',
  [SeminaryCredentialDocumentType.TRANSCRIPT]: '3',
};

export const seminaryCredentialDocumentInclude = {
  application: {
    select: {
      id: true,
      studentId: true,
      surname: true,
      givenName: true,
      middleName: true,
      programLevel: true,
      programCourse: true,
      academicYear: true,
    },
  },
} satisfies Prisma.SeminaryCredentialDocumentInclude;

export const buildNextDocumentNumber = async (
  tx: Prisma.TransactionClient,
  type: SeminaryCredentialDocumentType,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `POTSC-${documentPrefixMap[type]}-${yearSuffix}-`;
  const latestDocument = await tx.seminaryCredentialDocument.findFirst({
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

export const buildNextBarcodeNumber = async (
  tx: Prisma.TransactionClient,
  type: SeminaryCredentialDocumentType,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `978${barcodeTypeCodeMap[type]}${yearSuffix}`;
  const latestDocument = await tx.seminaryCredentialDocument.findFirst({
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

export const buildVerificationToken = () => randomBytes(24).toString('hex');

export const findActiveCredentialDocument = (
  tx: Prisma.TransactionClient,
  applicationId: string,
  type: SeminaryCredentialDocumentType,
) =>
  tx.seminaryCredentialDocument.findFirst({
    where: {
      applicationId,
      type,
      status: SeminaryCredentialDocumentStatus.ACTIVE,
    },
    include: seminaryCredentialDocumentInclude,
    orderBy: { issuedAt: 'desc' },
  });
