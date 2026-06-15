import { SeminaryApplicationStatus } from '@/generated/prisma/enums';

type SeminaryDecisionStatus =
  | (typeof SeminaryApplicationStatus)['UNDER_REVIEW']
  | (typeof SeminaryApplicationStatus)['APPROVED']
  | (typeof SeminaryApplicationStatus)['REJECTED'];

const statusCopy: Record<
  SeminaryDecisionStatus,
  { heading: string; subject: string }
> = {
  [SeminaryApplicationStatus.UNDER_REVIEW]: {
    subject: 'Your Seminary Application Is Under Review',
    heading: 'Your application is now under review',
  },
  [SeminaryApplicationStatus.APPROVED]: {
    subject: 'Your Seminary Application Has Been Approved',
    heading: 'Congratulations, your application has been approved',
  },
  [SeminaryApplicationStatus.REJECTED]: {
    subject: 'Your Seminary Application Update',
    heading: 'Your application has been reviewed',
  },
};

export const seminaryApplicationStatusTemplate = ({
  name,
  programCourse,
  reason,
  status,
  studentId,
}: {
  name: string;
  programCourse: string;
  reason?: string | null;
  status: SeminaryDecisionStatus;
  studentId?: string | null;
}) => {
  const copy = statusCopy[status];
  const studentIdLine =
    status === SeminaryApplicationStatus.APPROVED && studentId
      ? `\nStudent ID: ${studentId}\n`
      : '';
  const reasonLine =
    status === SeminaryApplicationStatus.REJECTED && reason
      ? `\nReason: ${reason}\n`
      : '';

  return {
    subject: copy.subject,
    text: `Hello ${name},

${copy.heading}.

Program/Course: ${programCourse}${studentIdLine}${reasonLine}
Please check your email regularly for further instructions from the Admissions Office.

Thank you,
Pearl of the Orient Theological Seminary and Colleges
`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#0b3327;">
        <h2 style="margin:0 0 8px;">${copy.heading}</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your seminary admission application status has been updated.</p>
        <div style="background:#f3f7f5;border:1px solid #dfe8e3;border-radius:8px;padding:14px;margin:18px 0;">
          <p style="margin:0 0 8px;"><strong>Status:</strong> ${status.replace(/_/g, ' ')}</p>
          <p style="margin:0 0 8px;"><strong>Program/Course:</strong> ${programCourse}</p>
          ${
            status === SeminaryApplicationStatus.APPROVED && studentId
              ? `<p style="margin:0;"><strong>Student ID:</strong> ${studentId}</p>`
              : ''
          }
          ${
            status === SeminaryApplicationStatus.REJECTED && reason
              ? `<p style="margin:8px 0 0;"><strong>Reason:</strong> ${reason}</p>`
              : ''
          }
        </div>
        <p>
          Please check your email regularly for further instructions from the
          Admissions Office.
        </p>
        <p>Thank you,<br />Pearl of the Orient Theological Seminary and Colleges</p>
      </div>
    `,
  };
};
