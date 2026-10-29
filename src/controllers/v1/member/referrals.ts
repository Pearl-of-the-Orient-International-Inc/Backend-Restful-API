import { randomBytes } from 'node:crypto';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Prisma } from '@/generated/prisma/client';
import type { Request, Response } from 'express';

const DEFAULT_CRITERIA = [
  { key: 'APPLICATION_SUBMITTED', label: 'Membership application submitted', description: 'A referred applicant successfully submits a membership application.', points: 3, sortOrder: 1 },
  { key: 'MEMBER_APPROVED', label: 'Referred member approved', description: 'The referred applicant is approved as an active member.', points: 5, sortOrder: 2 },
];

const periodKeyFor = (date = new Date()) => {
  const values = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const get = (type: string) => values.find((value) => value.type === type)?.value;
  return `${get('year')}-${get('month')}`;
};

const periodBounds = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number);
  return {
    startsAt: new Date(Date.UTC(year, month - 1, 1)),
    endsAt: new Date(Date.UTC(year, month, 1)),
  };
};

const ensureCriteria = async (tx: Prisma.TransactionClient) => {
  await Promise.all(DEFAULT_CRITERIA.map((criterion) => tx.referralPointCriterion.upsert({
    where: { key: criterion.key }, update: {}, create: criterion,
  })));
};

const createCode = () => `POI-${randomBytes(5).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')}`;

export const ensureReferralCode = async (tx: Prisma.TransactionClient, memberId: string) => {
  const member = await tx.member.findUnique({ where: { id: memberId }, select: { referralCode: true, status: true, isActive: true } });
  if (!member || member.status !== MemberStatus.APPROVED || !member.isActive) return null;
  if (member.referralCode) return member.referralCode;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = createCode();
    try {
      const updated = await tx.member.update({ where: { id: memberId }, data: { referralCode, referralCodeCreatedAt: new Date() }, select: { referralCode: true } });
      return updated.referralCode;
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002')) throw error;
    }
  }
  throw new Error('Unable to create a unique referral code');
};

export const awardReferralPoints = async (tx: Prisma.TransactionClient, input: { referredMemberId: string; criterionKey: string; sourceType: string; sourceId: string; occurredAt?: Date; createdByUserId?: string }) => {
  const referred = await tx.member.findUnique({ where: { id: input.referredMemberId }, select: { referredByMemberId: true } });
  if (!referred?.referredByMemberId) return null;
  const referrer = await tx.member.findUnique({ where: { id: referred.referredByMemberId }, select: { status: true, isActive: true } });
  if (!referrer || referrer.status !== MemberStatus.APPROVED || !referrer.isActive) return null;
  await ensureCriteria(tx);
  const criterion = await tx.referralPointCriterion.findUnique({ where: { key: input.criterionKey } });
  if (!criterion?.isActive) return null;
  if (criterion.oncePerReferred) {
    const existingAward = await tx.referralPointLedgerEntry.findFirst({
      where: {
        referredMemberId: input.referredMemberId,
        criterionId: criterion.id,
        status: 'EARNED',
      },
      select: { id: true },
    });
    if (existingAward) return null;
  }
  const occurredAt = input.occurredAt ?? new Date();
  const periodKey = periodKeyFor(occurredAt);
  if (criterion.monthlyCap) {
    const existingPoints = await tx.referralPointLedgerEntry.aggregate({ where: { referrerMemberId: referred.referredByMemberId, criterionId: criterion.id, periodKey, status: 'EARNED' }, _sum: { points: true } });
    if ((existingPoints._sum.points ?? 0) >= criterion.monthlyCap) return null;
  }
  try {
    return await tx.referralPointLedgerEntry.create({ data: { referrerMemberId: referred.referredByMemberId, referredMemberId: input.referredMemberId, criterionId: criterion.id, points: criterion.points, occurredAt, periodKey, sourceType: input.sourceType, sourceId: input.sourceId, createdByUserId: input.createdByUserId } });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') return null;
    throw error;
  }
};

export const resolvePublicReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code ?? '').trim().toUpperCase();
    const member = await prisma.member.findFirst({ where: { referralCode: code, status: MemberStatus.APPROVED, isActive: true }, select: { uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, currentPositionRole: true, currentPositionRoleOther: true } });
    if (!member) { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'REFERRAL_NOT_FOUND', message: 'This referral link is invalid or is no longer active.' }); return; }
    const name = [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' ');
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral verified', data: { name, memberNumber: member.uniqueId, title: member.currentPositionRoleOther ?? member.currentPositionRole ?? 'Pearl Chaplain Member' } });
  } catch (err) { logger.error('Error resolving referral', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_RESOLVE_FAILED', message: 'Unable to verify this referral link.' }); }
};

export const getCurrentReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId }, select: { id: true } });
    if (!member) { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'MEMBER_NOT_FOUND', message: 'A member profile is required to use referrals.' }); return; }
    const referralCode = await prisma.$transaction((tx) => ensureReferralCode(tx, member.id));
    if (!referralCode) { res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'REFERRAL_NOT_ELIGIBLE', message: 'Only active, approved members can share a referral link.' }); return; }
    const periodKey = periodKeyFor();
    const [points, referrals] = await Promise.all([prisma.referralPointLedgerEntry.aggregate({ where: { referrerMemberId: member.id, periodKey, status: 'EARNED' }, _sum: { points: true } }), prisma.member.count({ where: { referredByMemberId: member.id } })]);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral link retrieved', data: { referralCode, referralCount: referrals, monthPoints: points._sum.points ?? 0, periodKey } });
  } catch (err) { logger.error('Error getting current referral', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_READ_FAILED', message: 'Unable to load your referral link.' }); }
};

export const rotateCurrentReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({ where: { userId: req.userId }, select: { id: true, status: true, isActive: true } });
    if (!member || member.status !== MemberStatus.APPROVED || !member.isActive) { res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'REFERRAL_NOT_ELIGIBLE', message: 'Only active, approved members can rotate a referral link.' }); return; }
    const referralCode = await prisma.$transaction(async (tx) => { await tx.member.update({ where: { id: member.id }, data: { referralCode: null } }); return ensureReferralCode(tx, member.id); });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral link rotated', data: { referralCode } });
  } catch (err) { logger.error('Error rotating referral', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_ROTATE_FAILED', message: 'Unable to rotate the referral link.' }); }
};

export const getPublicHonorRoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const isAllTime = req.query.scope === 'all';
    const periodKey = typeof req.query.period === 'string' && /^\d{4}-\d{2}$/.test(req.query.period) ? req.query.period : periodKeyFor();
    const lockedPeriod = isAllTime ? null : await prisma.referralRecognitionPeriod.findUnique({ where: { periodKey } });
    const rows = await prisma.referralPointLedgerEntry.groupBy({ by: ['referrerMemberId'], where: { ...(isAllTime ? {} : { periodKey }), status: 'EARNED' }, _sum: { points: true }, _count: { _all: true }, orderBy: { _sum: { points: 'desc' } }, take: 3 });
    const members = await prisma.member.findMany({ where: { id: { in: rows.map((row) => row.referrerMemberId) }, status: MemberStatus.APPROVED, isActive: true }, select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, user: { select: { avatar: true } } } });
    const byId = new Map(members.map((member) => [member.id, member]));
    const provisionalRankings = rows.flatMap((row, index) => { const member = byId.get(row.referrerMemberId); return member ? [{ memberId: member.id, rank: index + 1, memberNumber: member.uniqueId, name: [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' '), avatar: member.user.avatar, points: row._sum.points ?? 0, milestones: row._count._all }] : []; });
    const lockedRankings = lockedPeriod?.isLocked && Array.isArray(lockedPeriod.winners)
      ? lockedPeriod.winners as typeof provisionalRankings
      : null;
    const rankings = (lockedRankings ?? provisionalRankings).map(({ memberId: _memberId, ...ranking }) => ranking);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Membership Builders Honor Roll retrieved', data: { periodKey: isAllTime ? 'all-time' : periodKey, rankings, isProvisional: isAllTime || !lockedPeriod?.isLocked } });
  } catch (err) { logger.error('Error getting honor roll', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'HONOR_ROLL_READ_FAILED', message: 'Unable to load the Membership Builders Honor Roll.' }); }
};

export const getReferralCriteria = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$transaction((tx) => ensureCriteria(tx));
    const criteria = await prisma.referralPointCriterion.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral criteria retrieved', data: criteria });
  } catch (err) { logger.error('Error getting referral criteria', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_CRITERIA_READ_FAILED', message: 'Unable to load referral criteria.' }); }
};

export const getPublicReferralCriteria = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$transaction((tx) => ensureCriteria(tx));
    const criteria = await prisma.referralPointCriterion.findMany({
      where: { isActive: true },
      select: { key: true, label: true, description: true, points: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Public referral criteria retrieved', data: criteria });
  } catch (err) { logger.error('Error getting public referral criteria', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_CRITERIA_READ_FAILED', message: 'Unable to load referral point criteria.' }); }
};

export const createReferralCriterion = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { key?: unknown; label?: unknown; description?: unknown; points?: unknown; monthlyCap?: unknown };
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    const requestedKey = typeof body.key === 'string' ? body.key.trim().toUpperCase() : '';
    const generatedKey = label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const key = (requestedKey || generatedKey).replace(/[^A-Z0-9_]/g, '');
    const points = typeof body.points === 'number' ? body.points : Number(body.points);
    const monthlyCap = body.monthlyCap === null || body.monthlyCap === undefined || body.monthlyCap === ''
      ? null
      : Number(body.monthlyCap);

    if (!label || label.length > 120 || !key || key.length > 80 || !Number.isInteger(points) || points < 0 || (monthlyCap !== null && (!Number.isInteger(monthlyCap) || monthlyCap < 0))) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Provide a title, a valid unique key, whole-number points, and an optional whole-number monthly cap.' }); return;
    }

    const criterion = await prisma.$transaction(async (tx) => {
      await ensureCriteria(tx);
      const existing = await tx.referralPointCriterion.findUnique({ where: { key }, select: { id: true } });
      if (existing) return null;
      const last = await tx.referralPointCriterion.aggregate({ _max: { sortOrder: true } });
      return tx.referralPointCriterion.create({
        data: {
          key,
          label,
          description: typeof body.description === 'string' ? body.description.trim() || null : null,
          points,
          monthlyCap,
          isActive: false,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
    });

    if (!criterion) { res.status(HTTPSTATUS.CONFLICT).json({ code: 'REFERRAL_CRITERION_KEY_EXISTS', message: `A referral criterion with the key ${key} already exists.` }); return; }
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Referral criterion created. It is inactive until its verified milestone is connected.', data: criterion });
  } catch (err) { logger.error('Error creating referral criterion', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REFERRAL_CRITERION_CREATE_FAILED', message: 'Unable to create the referral criterion.' }); }
};

export const updateReferralCriterion = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = typeof req.params.key === 'string' ? req.params.key : '';
    const body = req.body as { points?: unknown; isActive?: unknown; monthlyCap?: unknown; label?: unknown; description?: unknown };
    if (!key || (body.points !== undefined && (!Number.isInteger(body.points) || Number(body.points) < 0))) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Provide a valid criterion key and a whole-number point value.' }); return;
    }
    await prisma.$transaction((tx) => ensureCriteria(tx));
    const criterion = await prisma.referralPointCriterion.update({
      where: { key },
      data: {
        ...(body.points !== undefined ? { points: Number(body.points) } : {}),
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        ...(body.monthlyCap === null || (Number.isInteger(body.monthlyCap) && Number(body.monthlyCap) >= 0) ? { monthlyCap: body.monthlyCap as number | null } : {}),
        ...(typeof body.label === 'string' && body.label.trim() ? { label: body.label.trim() } : {}),
        ...(typeof body.description === 'string' ? { description: body.description.trim() || null } : {}),
      },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Referral criterion updated', data: criterion });
  } catch (err) { logger.error('Error updating referral criterion', { err }); res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'REFERRAL_CRITERION_NOT_FOUND', message: 'Referral criterion was not found.' }); }
};

export const lockHonorRoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const periodKey = typeof req.params.period === 'string' && /^\d{4}-\d{2}$/.test(req.params.period) ? req.params.period : '';
    if (!periodKey) { res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Use a period in YYYY-MM format.' }); return; }
    const requestedIds: string[] = Array.isArray(req.body?.winnerMemberIds)
      ? req.body.winnerMemberIds
        .filter((id: unknown): id is string => typeof id === 'string')
        .slice(0, 3)
      : [];
    const rows = await prisma.referralPointLedgerEntry.groupBy({ by: ['referrerMemberId'], where: { periodKey, status: 'EARNED' }, _sum: { points: true }, _count: { _all: true }, orderBy: { _sum: { points: 'desc' } }, take: 25 });
    const rowByMember = new Map(rows.map((row) => [row.referrerMemberId, row]));
    const winnerIds: string[] = requestedIds.length > 0
      ? requestedIds.filter((id: string) => rowByMember.has(id))
      : rows.slice(0, 3).map((row) => row.referrerMemberId);
    const members = await prisma.member.findMany({ where: { id: { in: winnerIds }, status: MemberStatus.APPROVED, isActive: true }, select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, user: { select: { avatar: true } } } });
    const byId = new Map(members.map((member) => [member.id, member]));
    const winners = winnerIds.flatMap((id: string, index: number) => { const member = byId.get(id); const row = rowByMember.get(id); return member && row ? [{ memberId: id, rank: index + 1, memberNumber: member.uniqueId, name: [member.firstName, member.middleInitial, member.lastName, member.extensionName].filter(Boolean).join(' '), avatar: member.user.avatar, points: row._sum.points ?? 0, milestones: row._count._all }] : []; });
    const { startsAt, endsAt } = periodBounds(periodKey);
    const period = await prisma.referralRecognitionPeriod.upsert({ where: { periodKey }, create: { periodKey, startsAt, endsAt, isLocked: true, lockedAt: new Date(), lockedByUserId: req.userId, winners }, update: { isLocked: true, lockedAt: new Date(), lockedByUserId: req.userId, winners } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Honor Roll locked. Recognition issuance remains a separate process.', data: period });
  } catch (err) { logger.error('Error locking honor roll', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'HONOR_ROLL_LOCK_FAILED', message: 'Unable to lock this Honor Roll period.' }); }
};
