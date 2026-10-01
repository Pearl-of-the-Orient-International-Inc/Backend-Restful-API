import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus, MemberType, OrdinationApplicationStatus, OrdinationReviewAction } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const memberSelect = { id: true, memberType: true, status: true, isActive: true, firstName: true, middleInitial: true, lastName: true, user: { select: { email: true, avatar: true } } } as const;
const applicationInclude = { member: { select: memberSelect }, reviews: { orderBy: { createdAt: 'desc' as const }, include: { reviewer: { select: { id: true, name: true, email: true } } } } } as const;
const member = (userId?: string) => prisma.member.findUnique({ where: { userId: userId ?? '' }, select: memberSelect });
const eligible = (profile: Awaited<ReturnType<typeof member>>) => Boolean(profile?.isActive && profile.status === MemberStatus.APPROVED && profile.memberType === MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER);
const editable: OrdinationApplicationStatus[] = [OrdinationApplicationStatus.DRAFT, OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, OrdinationApplicationStatus.RETURNED_FOR_CORRECTION];

export const getCurrentCrasmApplication = async (req: Request, res: Response) => { try { const profile = await member(req.userId); if (!profile) { res.status(404).json({ code: 'NOT_FOUND', message: 'Member profile not found' }); return; } const application = await prisma.crasmApplication.findUnique({ where: { memberId: profile.id } }); res.status(200).json({ code: 'OK', data: { eligible: eligible(profile), eligibilityReason: eligible(profile) ? 'Ordained and Commissioned Practitioner membership verified' : 'Only active, approved Ordained and Commissioned Practitioners may apply for CRASM', application } }); } catch (err) { logger.error('Error fetching CRASM application', { err }); res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); } };

const persist = async (req: Request, res: Response, submit: boolean) => { try { const profile = await member(req.userId); if (!eligible(profile)) { res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Ordained and Commissioned Practitioners may apply for CRASM' }); return; } const existing = await prisma.crasmApplication.findUnique({ where: { memberId: profile!.id } }); if (existing && !editable.includes(existing.status)) { res.status(HTTPSTATUS.CONFLICT).json({ code: 'NOT_EDITABLE', message: 'This application cannot be edited in its current status' }); return; } const body = req.body as Record<string, unknown>; const required = { appointmentTitle: String(body.appointmentTitle ?? ''), appointingOfficer: String(body.appointingOfficer ?? ''), recommendingOfficer: String(body.recommendingOfficer ?? ''), territorialJurisdiction: String(body.territorialJurisdiction ?? ''), churchName: String(body.churchName ?? ''), churchAddress: String(body.churchAddress ?? ''), documents: (body.documents ?? []) as object[], informationAccurate: Boolean(body.informationAccurate), backgroundCheckConsent: Boolean(body.backgroundCheckConsent) }; const application = await prisma.crasmApplication.upsert({ where: { memberId: profile!.id }, create: { memberId: profile!.id, ...required, ...(submit ? { status: OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date() } : {}) }, update: { ...required, ...(submit ? { status: OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null } : {}) } }); res.status(200).json({ code: 'OK', data: application }); } catch (err) { logger.error('Error saving CRASM application', { err }); res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); } };
export const saveCurrentCrasmApplication = (req: Request, res: Response) => persist(req, res, false);
export const submitCurrentCrasmApplication = (req: Request, res: Response) => persist(req, res, true);

export const getAllCrasmApplications = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.crasmApplication.findMany({ orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }], include: applicationInclude });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'CRASM applications retrieved', data });
  } catch (err) {
    logger.error('Error fetching CRASM applications', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const reviewCrasmApplication = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { action, notes } = req.body as { action: OrdinationReviewAction; notes?: string };
    const current = await prisma.crasmApplication.findUnique({ where: { id }, include: { member: { select: { memberType: true, status: true, isActive: true } } } });
    if (!current) { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'CRASM application not found' }); return; }
    const allowedActions: Partial<Record<OrdinationApplicationStatus, OrdinationReviewAction[]>> = {
      SUBMITTED: [OrdinationReviewAction.START_REVIEW, OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, OrdinationReviewAction.RETURN_FOR_CORRECTION, OrdinationReviewAction.APPROVE, OrdinationReviewAction.REJECT],
      UNDER_REVIEW: [OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, OrdinationReviewAction.RETURN_FOR_CORRECTION, OrdinationReviewAction.APPROVE, OrdinationReviewAction.REJECT],
    };
    if (!allowedActions[current.status]?.includes(action)) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'INVALID_TRANSITION', message: `The ${action.toLowerCase().split('_').join(' ')} action is not allowed while the application is ${current.status.toLowerCase().split('_').join(' ')}` });
      return;
    }
    if (action === OrdinationReviewAction.APPROVE && (!current.member.isActive || current.member.status !== MemberStatus.APPROVED || current.member.memberType !== MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER)) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'ELIGIBILITY_CHANGED', message: 'The applicant is no longer an active, approved Ordained and Commissioned Practitioner' });
      return;
    }
    const statusMap: Record<OrdinationReviewAction, OrdinationApplicationStatus> = { START_REVIEW: OrdinationApplicationStatus.UNDER_REVIEW, REQUEST_ADDITIONAL_INFORMATION: OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, RETURN_FOR_CORRECTION: OrdinationApplicationStatus.RETURNED_FOR_CORRECTION, APPROVE: OrdinationApplicationStatus.APPROVED, REJECT: OrdinationApplicationStatus.REJECTED };
    const status = statusMap[action];
    const now = new Date();
    const application = await prisma.$transaction(async (tx) => {
      await tx.crasmApplicationReview.create({ data: { applicationId: id, reviewerId: req.userId!, action, notes: notes || null } });
      return tx.crasmApplication.update({ where: { id }, data: { status, adminNotes: notes ?? current.adminNotes, requestedInformation: ['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION'].includes(action) ? notes : null, reviewedAt: now, decidedAt: ['APPROVE', 'REJECT'].includes(action) ? now : null }, include: applicationInclude });
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'CRASM application review updated', data: application });
  } catch (err) {
    logger.error('Error reviewing CRASM application', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
