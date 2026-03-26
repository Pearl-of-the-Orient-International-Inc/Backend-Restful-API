export const welcomeMemberTemplate = (
  name: string,
  email: string,
  temporaryPassword: string,
) => ({
  subject: 'Your Pearl of the Orient Member Account',
  text: `Hello ${name},\n\nYour Pearl of the Orient member account has been created.\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nPlease sign in and change your password immediately. You may then continue completing any remaining membership requirements in the portal.\n`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 8px;">Welcome to Pearl of the Orient</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your Pearl of the Orient member account has been created successfully.</p>
      <div style="background:#f3f4f6; border-radius:8px; padding:12px; margin:16px 0;">
        <p style="margin:0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:8px 0 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p>Please sign in and change your password immediately after your first login.</p>
      <p>You may then continue completing any remaining membership requirements in the portal.</p>
    </div>
  `,
});
