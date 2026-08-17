"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seminaryInstructorAccountTemplate = void 0;
const seminaryInstructorAccountTemplate = ({ instructorId, invitationUrl, name, }) => ({
    subject: 'Activate your Seminary Instructor Account',
    text: `Hello ${name},

Your instructor profile has been created.

Instructor ID: ${instructorId}

Accept this invitation and create your password:
${invitationUrl}

This invitation link expires in 30 days.
`,
    html: `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Seminary Instructor Account</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your instructor profile has been created. Accept this invitation to create your password and access the instructor portal.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:12px;margin:16px 0;">
        <p style="margin:0;"><strong>Instructor ID:</strong> ${instructorId}</p>
      </div>
      <p>
        <a href="${invitationUrl}" style="display:inline-block;background:#003f2b;color:#ffffff;text-decoration:none;border-radius:6px;padding:10px 16px;">
          Accept invitation
        </a>
      </p>
      <p style="color:#4b5563;">This invitation link expires in 30 days.</p>
    </div>
  `,
});
exports.seminaryInstructorAccountTemplate = seminaryInstructorAccountTemplate;
