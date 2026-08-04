export const seminaryInstructorAccountTemplate = ({
  instructorId,
  name,
  temporaryPassword,
}: {
  instructorId: string;
  name: string;
  temporaryPassword: string;
}) => ({
  subject: 'Your Seminary Instructor Account',
  text: `Hello ${name},

Your instructor profile and portal account have been created.

Instructor ID: ${instructorId}
Temporary password: ${temporaryPassword}

Please change your password after your first sign in.
`,
  html: `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Seminary Instructor Account</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your instructor profile and portal account have been created.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:12px;margin:16px 0;">
        <p style="margin:0;"><strong>Instructor ID:</strong> ${instructorId}</p>
        <p style="margin:8px 0 0;"><strong>Temporary password:</strong> ${temporaryPassword}</p>
      </div>
      <p>Please change your password after your first sign in.</p>
    </div>
  `,
});
