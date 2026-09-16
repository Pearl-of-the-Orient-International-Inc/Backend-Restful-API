import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';

export const updateOfficerAssignmentPublication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignmentId = Array.isArray(req.params.assignmentId)
      ? req.params.assignmentId[0]
      : req.params.assignmentId;

    const assignment = await prisma.officerAssignment.findFirst({
      where: { id: assignmentId, memberId },
      select: { id: true, isActive: true, officeTitle: { select: { isPublic: true } } },
    });
    if (!assignment) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Officer assignment not found' });
      return;
    }
    if (!assignment.isActive && req.body.isPublic) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'Inactive assignments cannot be published' });
      return;
    }
    if (!assignment.officeTitle.isPublic && req.body.isPublic) {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'Publish the office title before publishing its officer' });
      return;
    }

    const updated = await prisma.officerAssignment.update({
      where: { id: assignment.id },
      data: { isPublic: req.body.isPublic },
      include: { officeTitle: true },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: req.body.isPublic ? 'Officer published successfully' : 'Officer hidden successfully', data: updated });
  } catch (err) {
    logger.error('Error while updating officer publication', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
