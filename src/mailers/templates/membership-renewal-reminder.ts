export const membershipRenewalReminderTemplate = ({
  applicationDate,
  memberName,
  profileUrl,
}: {
  applicationDate: string;
  memberName: string;
  profileUrl: string;
}) => ({
  subject: 'Your Pearl of the Orient membership needs renewal',
  text: `Hello ${memberName},

Your Pearl of the Orient membership has expired because your application date (${applicationDate}) is more than one year old.

Your public membership status is now inactive until renewal is completed. You can still sign in to your account.

Please renew your membership or contact the organization for renewal assistance.

Profile: ${profileUrl}

Thank you,
Pearl of the Orient International Auxiliary Chaplain Values Educators Inc.
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin:0 0 8px;color:#7f1d1d;">Membership renewal required</h2>
      <p>Hello <strong>${memberName}</strong>,</p>
      <p>
        Your Pearl of the Orient membership has expired because your application
        date (<strong>${applicationDate}</strong>) is more than one year old.
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:18px 0;">
        <p style="margin:0;">
          Your public membership status is now <strong>inactive</strong> until
          renewal is completed. You can still sign in to your account.
        </p>
      </div>
      <p>Please renew your membership or contact the organization for renewal assistance.</p>
      <p>
        <a href="${profileUrl}" style="display:inline-block;background:#032a0d;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;">
          Open your public profile
        </a>
      </p>
      <p style="margin-top:24px;">Thank you,<br />Pearl of the Orient International Auxiliary Chaplain Values Educators Inc.</p>
    </div>
  `,
});
