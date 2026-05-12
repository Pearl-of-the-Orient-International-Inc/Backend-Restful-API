import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';

import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

type LocationGranularity = 'province' | 'municipality' | 'barangay';

type BreakdownItem = {
  label: string;
  value: number;
  percentage: number;
  fill: string;
};

type LocationTrendSeries = {
  key: string;
  label: string;
  total: number;
  color: string;
};

type LocationTrendPoint = {
  month: string;
  [key: string]: number | string;
};

type MemberLocationReportData = {
  summary: {
    totalActiveMembers: number;
    membersWithLocation: number;
    membersWithoutLocation: number;
    granularity: LocationGranularity;
    scopeLabel: string;
  };
  regionBreakdown: BreakdownItem[];
  locationTrend: {
    granularity: LocationGranularity;
    series: LocationTrendSeries[];
    data: LocationTrendPoint[];
  };
};

type ReportMemberLocation = {
  isActive: boolean;
  createdAt: Date;
  region: string | null;
  province: string | null;
  municipalityCity: string | null;
  barangay: string | null;
};

const regionColors = [
  '#2563eb',
  '#16a34a',
  '#8b5cf6',
  '#f59e0b',
  '#0f766e',
  '#ea580c',
  '#ec4899',
  '#14b8a6',
  '#64748b',
];

const trendColors = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#0f766e', '#ea580c'];

export const getMemberLocationReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsedMonths = parseInt(req.query.months as string, 10);
    const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;
    const granularity = (req.query.granularity as LocationGranularity | undefined) ?? 'province';
    const region = normalizeOptional(req.query.region as string | undefined);
    const province = normalizeOptional(req.query.province as string | undefined);
    const municipalityCity = normalizeOptional(req.query.municipalityCity as string | undefined);

    const members = await prisma.member.findMany({
      select: {
        isActive: true,
        createdAt: true,
        region: true,
        province: true,
        municipalityCity: true,
        barangay: true,
      },
    });

    const report = buildMemberLocationReport({
      members,
      monthsToShow,
      granularity,
      region,
      province,
      municipalityCity,
    });

    logger.info('Member location report retrieved', {
      granularity,
      region,
      province,
      municipalityCity,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member location report retrieved successfully',
      data: report,
    });
  } catch (err) {
    logger.error('Error while getting member location report', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

function buildMemberLocationReport({
  members,
  monthsToShow,
  granularity,
  region,
  province,
  municipalityCity,
}: {
  members: ReportMemberLocation[];
  monthsToShow: number;
  granularity: LocationGranularity;
  region: string | null;
  province: string | null;
  municipalityCity: string | null;
}): MemberLocationReportData {
  const now = new Date();
  const activeMembers = members.filter((member) => member.isActive);
  const membersWithLocation = activeMembers.filter(
    (member) => Boolean(member.region && member.province && member.municipalityCity && member.barangay),
  );

  const regionCounts = new Map<string, number>();
  activeMembers.forEach((member) => {
    const label = member.region?.trim();

    if (!label) {
      return;
    }

    regionCounts.set(label, (regionCounts.get(label) ?? 0) + 1);
  });

  const regionBreakdown = Array.from(regionCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([label, value], index) => ({
      label,
      value,
      percentage: activeMembers.length
        ? Math.round((value / activeMembers.length) * 100)
        : 0,
      fill: regionColors[index % regionColors.length],
    }));

  const scopedMembers = activeMembers.filter((member) => {
    if (region && member.region?.trim() !== region) {
      return false;
    }

    if (province && member.province?.trim() !== province) {
      return false;
    }

    if (municipalityCity && member.municipalityCity?.trim() !== municipalityCity) {
      return false;
    }

    return true;
  });

  const locationAccessor = getLocationAccessor(granularity);
  const totalsByLocation = new Map<string, number>();

  scopedMembers.forEach((member) => {
    const label = locationAccessor(member)?.trim();

    if (!label) {
      return;
    }

    totalsByLocation.set(label, (totalsByLocation.get(label) ?? 0) + 1);
  });

  const series = Array.from(totalsByLocation.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([label, total], index) => ({
      key: `series_${index + 1}`,
      label,
      total,
      color: trendColors[index % trendColors.length],
    }));

  const monthStarts = eachMonthOfInterval({
    start: startOfMonth(subMonths(now, monthsToShow - 1)),
    end: startOfMonth(now),
  });

  const locationTrendData = monthStarts.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const point: LocationTrendPoint = {
      month: format(monthStart, 'MMM'),
    };

    series.forEach((item) => {
      point[item.key] = scopedMembers.filter((member) => {
        const label = locationAccessor(member)?.trim();

        return (
          label === item.label &&
          isWithinInterval(member.createdAt, { start: monthStart, end: monthEnd })
        );
      }).length;
    });

    return point;
  });

  return {
    summary: {
      totalActiveMembers: activeMembers.length,
      membersWithLocation: membersWithLocation.length,
      membersWithoutLocation: activeMembers.length - membersWithLocation.length,
      granularity,
      scopeLabel: buildScopeLabel(granularity, region, province, municipalityCity),
    },
    regionBreakdown,
    locationTrend: {
      granularity,
      series,
      data: locationTrendData,
    },
  };
}

function getLocationAccessor(granularity: LocationGranularity) {
  if (granularity === 'province') {
    return (member: ReportMemberLocation) => member.province;
  }

  if (granularity === 'municipality') {
    return (member: ReportMemberLocation) => member.municipalityCity;
  }

  return (member: ReportMemberLocation) => member.barangay;
}

function buildScopeLabel(
  granularity: LocationGranularity,
  region: string | null,
  province: string | null,
  municipalityCity: string | null,
) {
  if (granularity === 'province') {
    return region ? `Province trends in ${region}` : 'Province trends nationwide';
  }

  if (granularity === 'municipality') {
    if (province) {
      return `Municipality / city trends in ${province}`;
    }

    if (region) {
      return `Municipality / city trends in ${region}`;
    }

    return 'Municipality / city trends nationwide';
  }

  if (municipalityCity) {
    return `Barangay trends in ${municipalityCity}`;
  }

  if (province) {
    return `Barangay trends in ${province}`;
  }

  if (region) {
    return `Barangay trends in ${region}`;
  }

  return 'Barangay trends nationwide';
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
