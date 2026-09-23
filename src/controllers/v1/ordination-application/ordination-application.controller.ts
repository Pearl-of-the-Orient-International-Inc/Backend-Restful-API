import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus, MemberType, OrdinationApplicationStatus, OrdinationReviewAction } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const memberSelect = { id: true, memberType: true, status: true, isActive: true, firstName: true, middleInitial: true, lastName: true, user: { select: { email: true, avatar: true } } } as const;
const applicationInclude = { member: { select: memberSelect }, reviews: { orderBy: { createdAt: 'desc' as const }, include: { reviewer: { select: { id: true, name: true, email: true } } } } } as const;

const currentMember = (userId?: string) => prisma.member.findUnique({ where: { userId: userId ?? '' }, select: memberSelect });
const eligible = (member: Awaited<ReturnType<typeof currentMember>>) => Boolean(member && member.isActive && member.status === MemberStatus.APPROVED && member.memberType === MemberType.PROFESSIONAL_CHAPLAIN);

export const getCurrentOrdinationApplication = async (req: Request, res: Response) => {
  try {
    const member = await currentMember(req.userId);
    if (!member) { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Member profile not found' }); return; }
    const application = await prisma.ordinationApplication.findUnique({ where: { memberId: member.id }, include: applicationInclude });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination eligibility retrieved', data: { eligible: eligible(member), eligibilityReason: eligible(member) ? 'Professional Chaplain membership verified' : 'Only active, approved Professional Chaplains may apply', memberType: member.memberType, application } });
  } catch (err) { logger.error('Error fetching ordination application', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); }
};

const editableStatuses: OrdinationApplicationStatus[] = [OrdinationApplicationStatus.DRAFT, OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, OrdinationApplicationStatus.RETURNED_FOR_CORRECTION];

export const saveCurrentOrdinationApplication = async (req: Request, res: Response) => {
  try {
    const member = await currentMember(req.userId);
    if (!eligible(member)) { res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Professional Chaplains may apply for ordination' }); return; }
    const existing = await prisma.ordinationApplication.findUnique({ where: { memberId: member!.id } });
    if (existing && !editableStatuses.includes(existing.status)) { res.status(HTTPSTATUS.CONFLICT).json({ code: 'NOT_EDITABLE', message: 'This application cannot be edited in its current status' }); return; }
    const body = req.body as Record<string, unknown>;
    const application = await prisma.ordinationApplication.upsert({
      where: { memberId: member!.id },
      create: { memberId: member!.id, eligibilityMemberType: member!.memberType, ministryBackground: String(body.ministryBackground ?? ''), callingStatement: String(body.callingStatement ?? ''), proposedMinistry: String(body.proposedMinistry ?? ''), additionalInformation: body.additionalInformation as string | null | undefined, documents: (body.documents ?? []) as object[], informationAccurate: Boolean(body.informationAccurate), codeOfConductAccepted: Boolean(body.codeOfConductAccepted), backgroundCheckConsent: Boolean(body.backgroundCheckConsent) },
      update: { ...body, eligibilityMemberType: member!.memberType },
      include: applicationInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application draft saved', data: application });
  } catch (err) { logger.error('Error saving ordination application', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); }
};

export const submitCurrentOrdinationApplication = async (req: Request, res: Response) => {
  try {
    const member = await currentMember(req.userId);
    if (!eligible(member)) { res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'NOT_ELIGIBLE', message: 'Only active, approved Professional Chaplains may apply for ordination' }); return; }
    const existing = await prisma.ordinationApplication.findUnique({ where: { memberId: member!.id } });
    if (existing && !editableStatuses.includes(existing.status)) { res.status(HTTPSTATUS.CONFLICT).json({ code: 'ALREADY_SUBMITTED', message: 'This application has already been submitted' }); return; }
    const application = await prisma.ordinationApplication.upsert({
      where: { memberId: member!.id },
      create: { ...req.body, memberId: member!.id, eligibilityMemberType: member!.memberType, status: OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null },
      update: { ...req.body, eligibilityMemberType: member!.memberType, status: OrdinationApplicationStatus.SUBMITTED, submittedAt: new Date(), requestedInformation: null, reviewedAt: null, decidedAt: null },
      include: applicationInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application submitted successfully', data: application });
  } catch (err) { logger.error('Error submitting ordination application', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); }
};

export const getAllOrdinationApplications = async (_req: Request, res: Response) => {
  try { const data = await prisma.ordinationApplication.findMany({ orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }], include: applicationInclude }); res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination applications retrieved', data }); }
  catch (err) { logger.error('Error fetching ordination applications', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); }
};

export const reviewOrdinationApplication = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id); const { action, notes } = req.body as { action: OrdinationReviewAction; notes?: string };
    const current = await prisma.ordinationApplication.findUnique({ where: { id }, include: { member: { select: { memberType: true, status: true, isActive: true } } } });
    if (!current) { res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Ordination application not found' }); return; }
    const allowedActions: Partial<Record<OrdinationApplicationStatus, OrdinationReviewAction[]>> = {
      SUBMITTED: [OrdinationReviewAction.START_REVIEW, OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, OrdinationReviewAction.RETURN_FOR_CORRECTION, OrdinationReviewAction.APPROVE, OrdinationReviewAction.REJECT],
      UNDER_REVIEW: [OrdinationReviewAction.REQUEST_ADDITIONAL_INFORMATION, OrdinationReviewAction.RETURN_FOR_CORRECTION, OrdinationReviewAction.APPROVE, OrdinationReviewAction.REJECT],
    };
    if (!allowedActions[current.status]?.includes(action)) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'INVALID_TRANSITION', message: `The ${action.toLowerCase().split('_').join(' ')} action is not allowed while the application is ${current.status.toLowerCase().split('_').join(' ')}` });
      return;
    }
    if (action === OrdinationReviewAction.APPROVE && (!current.member.isActive || current.member.status !== MemberStatus.APPROVED || current.member.memberType !== MemberType.PROFESSIONAL_CHAPLAIN)) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'ELIGIBILITY_CHANGED', message: 'The applicant is no longer an active, approved Professional Chaplain' });
      return;
    }
    const statusMap: Record<OrdinationReviewAction, OrdinationApplicationStatus> = { START_REVIEW: OrdinationApplicationStatus.UNDER_REVIEW, REQUEST_ADDITIONAL_INFORMATION: OrdinationApplicationStatus.ADDITIONAL_INFORMATION_REQUIRED, RETURN_FOR_CORRECTION: OrdinationApplicationStatus.RETURNED_FOR_CORRECTION, APPROVE: OrdinationApplicationStatus.APPROVED, REJECT: OrdinationApplicationStatus.REJECTED };
    const status = statusMap[action]; const now = new Date();
    const application = await prisma.$transaction(async (tx) => {
      await tx.ordinationApplicationReview.create({ data: { applicationId: id, reviewerId: req.userId!, action, notes: notes || null } });
      return tx.ordinationApplication.update({ where: { id }, data: { status, adminNotes: notes ?? current.adminNotes, requestedInformation: ['REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION'].includes(action) ? notes : null, reviewedAt: now, decidedAt: ['APPROVE', 'REJECT'].includes(action) ? now : null }, include: applicationInclude });
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Ordination application review updated', data: application });
  } catch (err) { logger.error('Error reviewing ordination application', { err }); res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }); }
};
