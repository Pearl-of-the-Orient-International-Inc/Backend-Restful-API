import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryDocumentDeliveryMethod,
  SeminaryDocumentPaymentStatus,
  SeminaryDocumentRequestStatus,
  UserType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

const requestInclude = {
  documentType: true,
  studentApplication: {
    select: {
      id: true,
      studentId: true,
      givenName: true,
      middleName: true,
      surname: true,
      emailAddress: true,
      mobilePhone: true,
      programLevel: true,
      programCourse: true,
    },
  },
  reviewedByUser: { select: { id: true, name: true } },
  releasedByUser: { select: { id: true, name: true } },
} as const;

const fullName = (student: {
  givenName: string | null;
  middleName: string | null;
  surname: string | null;
}) => [student.givenName, student.middleName, student.surname].filter(Boolean).join(' ') || 'Student';

const allowedTransitions: Partial<Record<SeminaryDocumentRequestStatus, SeminaryDocumentRequestStatus[]>> = {
  [SeminaryDocumentRequestStatus.PENDING]: [
    SeminaryDocumentRequestStatus.APPROVED,
    SeminaryDocumentRequestStatus.REJECTED,
  ],
  [SeminaryDocumentRequestStatus.APPROVED]: [SeminaryDocumentRequestStatus.PROCESSING],
  [SeminaryDocumentRequestStatus.PROCESSING]: [SeminaryDocumentRequestStatus.READY_FOR_RELEASE],
  [SeminaryDocumentRequestStatus.READY_FOR_RELEASE]: [SeminaryDocumentRequestStatus.RELEASED],
};

const getStudentApplicationForUser = async (userId: string) =>
  prisma.seminaryApplication.findFirst({
    where: {
      studentId: { not: null },
      OR: [{ portalUserId: userId }, { member: { userId } }],
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

export const getSeminaryDocumentRequestTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
    const includeInactive = user?.role === UserType.ADMIN && req.query.includeInactive === 'true';
    const data = await prisma.seminaryDocumentRequestType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Document request types retrieved successfully', data });
  } catch (err) {
    logger.error('Error while retrieving Seminary document request types', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve document request types' });
  }
};

export const createSeminaryDocumentRequestType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await prisma.seminaryDocumentRequestType.create({ data: req.body });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Document request type created successfully', data: type });
  } catch (err) {
    logger.error('Error while creating Seminary document request type', { err });
    res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'DOCUMENT_TYPE_CREATE_FAILED', message: 'Unable to create the document type. Its name may already be in use.' });
  }
};

export const updateSeminaryDocumentRequestType = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const type = await prisma.seminaryDocumentRequestType.update({ where: { id }, data: req.body });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Document request type updated successfully', data: type });
  } catch (err) {
    logger.error('Error while updating Seminary document request type', { err });
    res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'DOCUMENT_TYPE_UPDATE_FAILED', message: 'Unable to update the document type.' });
  }
};

export const getSeminaryDocumentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as SeminaryDocumentRequestStatus | undefined;
    const documentTypeId = req.query.documentTypeId as string | undefined;
    const where = {
      ...(status ? { status } : {}),
      ...(documentTypeId ? { documentTypeId } : {}),
    };

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
    if (user?.role === UserType.MEMBER) {
      const student = await getStudentApplicationForUser(req.userId!);
      if (!student) {
        res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'No student document requests found', data: [] });
        return;
      }
      const data = await prisma.seminaryDocumentRequest.findMany({
        where: { ...where, studentApplicationId: student.id },
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
      });
      res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Document requests retrieved successfully', data });
      return;
    }

    const data = await prisma.seminaryDocumentRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Document requests retrieved successfully', data });
  } catch (err) {
    logger.error('Error while retrieving Seminary document requests', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve document requests' });
  }
};

export const createSeminaryDocumentRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await getStudentApplicationForUser(req.userId!);
    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'STUDENT_NOT_FOUND', message: 'An active Seminary student record is required before requesting a document.' });
      return;
    }
    const body = req.body as { documentTypeId: string; purpose: string; deliveryMethod: string; supportingDetails?: string };
    const documentType = await prisma.seminaryDocumentRequestType.findFirst({
      where: { id: body.documentTypeId, isActive: true },
    });
    if (!documentType) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'DOCUMENT_TYPE_NOT_FOUND', message: 'The selected document type is no longer available.' });
      return;
    }
    if (documentType.requiresSupportingDetails && !body.supportingDetails?.trim()) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'SUPPORTING_DETAILS_REQUIRED', message: `Supporting details are required for ${documentType.name}.` });
      return;
    }

    const requestCount = await prisma.seminaryDocumentRequest.count();
    const referenceNumber = `POTSC-DOC-${new Date().getFullYear()}-${String(requestCount + 1).padStart(5, '0')}`;
    const request = await prisma.seminaryDocumentRequest.create({
      data: {
        referenceNumber,
        documentTypeId: documentType.id,
        studentApplicationId: student.id,
        purpose: body.purpose,
        deliveryMethod: body.deliveryMethod as SeminaryDocumentDeliveryMethod,
        supportingDetails: body.supportingDetails,
        fee: documentType.fee,
        paymentStatus: documentType.fee ? SeminaryDocumentPaymentStatus.PENDING : SeminaryDocumentPaymentStatus.NOT_APPLICABLE,
      },
      include: requestInclude,
    });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: `Document request ${referenceNumber} submitted successfully`, data: request });
  } catch (err) {
    logger.error('Error while creating Seminary document request', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DOCUMENT_REQUEST_CREATE_FAILED', message: 'Unable to submit the document request.' });
  }
};

export const updateSeminaryDocumentRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.seminaryDocumentRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Document request not found.' });
      return;
    }
    const body = req.body as {
      status: SeminaryDocumentRequestStatus;
      reviewRemarks?: string;
      paymentStatus?: SeminaryDocumentPaymentStatus;
      releaseReference?: string;
      receivedBy?: string;
    };
    const canMove = body.status === existing.status || allowedTransitions[existing.status]?.includes(body.status);
    if (!canMove) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'INVALID_STATUS_TRANSITION', message: `This request cannot move directly from ${existing.status.replace(/_/g, ' ')} to ${body.status.replace(/_/g, ' ')}.` });
      return;
    }

    const now = new Date();
    const request = await prisma.seminaryDocumentRequest.update({
      where: { id },
      data: {
        status: body.status,
        paymentStatus: body.paymentStatus ?? existing.paymentStatus,
        reviewRemarks: body.reviewRemarks,
        ...(body.status === SeminaryDocumentRequestStatus.APPROVED || body.status === SeminaryDocumentRequestStatus.REJECTED
          ? { reviewedAt: now, reviewedByUserId: req.userId }
          : {}),
        ...(body.status === SeminaryDocumentRequestStatus.PROCESSING ? { processedAt: now } : {}),
        ...(body.status === SeminaryDocumentRequestStatus.READY_FOR_RELEASE ? { readyAt: now } : {}),
        ...(body.status === SeminaryDocumentRequestStatus.RELEASED
          ? {
              releasedAt: now,
              releasedByUserId: req.userId,
              releaseReference: body.releaseReference,
              receivedBy: body.receivedBy,
            }
          : {}),
      },
      include: requestInclude,
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: `${request.documentType.name} request for ${fullName(request.studentApplication)} updated successfully`,
      data: request,
    });
  } catch (err) {
    logger.error('Error while updating Seminary document request', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DOCUMENT_REQUEST_UPDATE_FAILED', message: 'Unable to update the document request.' });
  }
};
