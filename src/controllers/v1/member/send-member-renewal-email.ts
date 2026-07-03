import { HTTPSTATUS } from '@/common/http-codes';
import {
  getRenewalEmailMemberById,
  sendMembershipRenewalEmail,
} from '@/lib/member-renewal-email';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const sendMemberRenewalEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const member = await getRenewalEmailMemberById(memberId);

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const result = await sendMembershipRenewalEmail(member);

    if (!result.success) {
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to send renewal email',
      });
      return;
    }

    logger.info('Manual membership renewal email sent', {
      memberId,
      email: member.user.email,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Renewal email sent successfully',
    });
  } catch (err) {
    logger.error('Error while sending member renewal email', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
