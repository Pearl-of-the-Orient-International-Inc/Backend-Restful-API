import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { requireOfficerScope } from '@/lib/officer-scope';
import { prisma } from '@/lib/prisma';

export const getCurrentOfficerMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = await requireOfficerScope(req.userId!);
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20));
    const search = String(req.query.search ?? '').trim();
    const where = {
      ...scope.memberWhere,
      ...(search ? { OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { uniqueId: { contains: search, mode: 'insensitive' as const } },
      ] } : {}),
    };
    const [totalCount, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, memberType: true, region: true, province: true, municipalityCity: true, barangay: true, user: { select: { avatar: true } } },
      }),
    ]);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Scoped members retrieved successfully', data: members, pagination: { currentPage: page, totalPages: Math.ceil(totalCount / limit), totalCount, limit } });
  } catch (error) {
    const status = error instanceof Error && 'statusCode' in error ? Number((error as { statusCode: number }).statusCode) : HTTPSTATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({ code: status === HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Internal server error' });
  }
};
