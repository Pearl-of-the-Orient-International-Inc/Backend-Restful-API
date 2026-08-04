"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminaryApplicationStatusTemplate = void 0;
const enums_1 = require("../../generated/prisma/enums");
const statusCopy = {
    [enums_1.SeminaryApplicationStatus.UNDER_REVIEW]: {
        subject: 'Your Seminary Application Is Under Review',
        heading: 'Your application is now under review',
    },
    [enums_1.SeminaryApplicationStatus.APPROVED]: {
        subject: 'Your Seminary Application Has Been Approved',
        heading: 'Congratulations, your application has been approved',
    },
    [enums_1.SeminaryApplicationStatus.ENROLLED]: {
        subject: 'Your Seminary Enrollment Is Active',
        heading: 'Your enrollment is now active',
    },
    [enums_1.SeminaryApplicationStatus.REJECTED]: {
        subject: 'Your Seminary Application Update',
        heading: 'Your application has been reviewed',
    },
    [enums_1.SeminaryApplicationStatus.CANCELLED]: {
        subject: 'Your Seminary Application Was Cancelled',
        heading: 'Your application has been cancelled',
    },
};
const seminaryApplicationStatusTemplate = ({ name, programCourse, reason, status, studentId, }) => {
    const copy = statusCopy[status];
    const studentIdLine = (status === enums_1.SeminaryApplicationStatus.APPROVED ||
        status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
        studentId
        ? `\nStudent ID: ${studentId}\n`
        : '';
    const reasonLine = status === enums_1.SeminaryApplicationStatus.REJECTED && reason
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
          ${(status === enums_1.SeminaryApplicationStatus.APPROVED ||
            status === enums_1.SeminaryApplicationStatus.ENROLLED) &&
            studentId
            ? `<p style="margin:0;"><strong>Student ID:</strong> ${studentId}</p>`
            : ''}
          ${status === enums_1.SeminaryApplicationStatus.REJECTED && reason
            ? `<p style="margin:8px 0 0;"><strong>Reason:</strong> ${reason}</p>`
            : ''}
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
exports.seminaryApplicationStatusTemplate = seminaryApplicationStatusTemplate;
