"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeMemberTemplate = void 0;
const welcomeMemberTemplate = (name, email, temporaryPassword, verificationUrl) => ({
    subject: 'Your Pearl of the Orient Member Account',
    text: `Hello ${name},\n\nYour Pearl of the Orient member account has been created.\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n${verificationUrl
        ? `\nBefore you can access your account, please verify your email here: ${verificationUrl}\n`
        : '\n'}\nPlease sign in and change your password immediately after your first login.\n`,
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 8px;">Welcome to Pearl of the Orient</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your Pearl of the Orient member account has been created successfully.</p>
      <div style="background:#f3f4f6; border-radius:8px; padding:12px; margin:16px 0;">
        <p style="margin:0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:8px 0 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      ${verificationUrl
        ? `<p>Please verify your email address first before accessing your account.</p>
      <p><a href="${verificationUrl}" style="display:inline-block;background:#032a0d;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify your account</a></p>
      <p>Your account will remain pending until the admin approves your membership application.</p>`
        : ""}
      <p>Please sign in and change your password immediately after your first login.</p>
    </div>
  `,
});
exports.welcomeMemberTemplate = welcomeMemberTemplate;
