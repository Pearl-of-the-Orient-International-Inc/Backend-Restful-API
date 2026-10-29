import { HTTPSTATUS } from '@/common/http-codes';
import { OfficeTitleLevel, type Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export type OfficerScope = {
  memberId: string;
  assignments: Array<{
    id: string;
    officeTitle: { id: string; name: string; level: OfficeTitleLevel };
    department: string | null;
    region: string | null;
    province: string | null;
    cityMunicipality: string | null;
    barangay: string | null;
  }>;
  memberWhere: Prisma.MemberWhereInput;
};

const nationwideLevels = new Set<OfficeTitleLevel>([
  OfficeTitleLevel.CHIEF_CHAPLAIN,
  OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR,
]);

const requiredLocationFields: Partial<Record<OfficeTitleLevel, Array<'region' | 'province' | 'cityMunicipality' | 'barangay'>>> = {
  [OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR]: ['region'],
  [OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR]: ['region'],
  [OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR]: ['region', 'province'],
  [OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR]: ['region', 'province'],
  [OfficeTitleLevel.CITY_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
  [OfficeTitleLevel.MUNICIPAL_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
  [OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN]: ['region', 'province', 'cityMunicipality'],
  [OfficeTitleLevel.BARANGAY_CHAPLAIN]: ['region', 'province', 'cityMunicipality', 'barangay'],
  [OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN]: ['region', 'province', 'cityMunicipality', 'barangay'],
};

const locationWhere = (assignment: OfficerScope['assignments'][number]): Prisma.MemberWhereInput | null => {
  if (nationwideLevels.has(assignment.officeTitle.level)) return {};

  const required = requiredLocationFields[assignment.officeTitle.level] ?? [];
  if (!required.length || required.some((field) => !assignment[field]?.trim())) return null;

  const fields = {
    ...(assignment.region ? { region: assignment.region } : {}),
    ...(assignment.province ? { province: assignment.province } : {}),
    ...(assignment.cityMunicipality ? { municipalityCity: assignment.cityMunicipality } : {}),
    ...(assignment.barangay ? { barangay: assignment.barangay } : {}),
  };

  return Object.keys(fields).length ? fields : null;
};

export const getOfficerScope = async (userId: string): Promise<OfficerScope | null> => {
  const member = await prisma.member.findUnique({
    where: { userId },
    select: {
      id: true,
      isActive: true,
      status: true,
      officerAssignments: {
        where: { isActive: true },
        select: {
          id: true,
          department: true,
          region: true,
          province: true,
          cityMunicipality: true,
          barangay: true,
          officeTitle: { select: { id: true, name: true, level: true, isActive: true } },
        },
      },
    },
  });

  if (!member?.isActive || member.status !== 'APPROVED') return null;

  const assignments = member.officerAssignments
    .filter((assignment) => assignment.officeTitle.isActive)
    .map(({ officeTitle, ...assignment }) => ({
      ...assignment,
      officeTitle: { id: officeTitle.id, name: officeTitle.name, level: officeTitle.level },
    }));
  const scopes = assignments.map(locationWhere).filter((scope): scope is Prisma.MemberWhereInput => scope !== null);

  if (!scopes.length) return null;

  return {
    memberId: member.id,
    assignments,
    memberWhere: {
      isActive: true,
      status: 'APPROVED',
      OR: scopes,
    },
  };
};

export const requireOfficerScope = async (userId: string) => {
  const scope = await getOfficerScope(userId);
  if (!scope) {
    const error = new Error('An active officer assignment is required to access scoped members');
    Object.assign(error, { statusCode: HTTPSTATUS.FORBIDDEN });
    throw error;
  }
  return scope;
};

