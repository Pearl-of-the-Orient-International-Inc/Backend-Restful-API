export const seminaryAdmissionSubmittedTemplate = ({
  name,
  programLevel,
  programCourse,
}: {
  name: string;
  programLevel: string;
  programCourse: string;
}) => ({
  subject: 'Your Seminary Admission Application Has Been Received',
  text: `Hello ${name},

Thank you for submitting your admission application to Pearl of the Orient Theological Seminary and Colleges.

Application status: Waiting for approval
Program level: ${programLevel}
Program/course: ${programCourse}

Our Admissions Office will review your application, payment details, and submitted documents. Documents marked to follow may be submitted to the Admissions Office when available.

Please wait for the approval update that will be sent to this email address. If we need more information, our Admissions Office will contact you.

Thank you for choosing Pearl of the Orient Theological Seminary and Colleges.
`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#0b3327;">
      <h2 style="margin:0 0 8px;">Thank you for your admission application</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>
        We have received your application to Pearl of the Orient Theological
        Seminary and Colleges.
      </p>
      <div style="background:#f3f7f5;border:1px solid #dfe8e3;border-radius:8px;padding:14px;margin:18px 0;">
        <p style="margin:0 0 8px;"><strong>Status:</strong> Waiting for approval</p>
        <p style="margin:0 0 8px;"><strong>Program Level:</strong> ${programLevel}</p>
        <p style="margin:0;"><strong>Program/Course:</strong> ${programCourse}</p>
      </div>
      <p>
        Our Admissions Office will review your application, payment details, and
        submitted documents. Documents marked to follow may be submitted to the
        Admissions Office when available.
      </p>
      <p>
        Please wait for the approval update that will be sent to this email
        address. If we need more information, our Admissions Office will contact
        you.
      </p>
      <p style="margin-top:20px;">
        Thank you for choosing Pearl of the Orient Theological Seminary and
        Colleges.
      </p>
    </div>
  `,
});
