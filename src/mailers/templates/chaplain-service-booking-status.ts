type BookingEmailStatus =
  | 'PENDING'
  | 'AWAITING_CHAPLAIN_APPROVAL'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

type BookingStatusEmailInput = {
  requesterName: string;
  serviceName: string;
  chaplainName: string;
  preferredAt: Date;
  status: BookingEmailStatus;
  reason?: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const statusCopy: Record<
  BookingEmailStatus,
  { subject: string; heading: string; message: (chaplain: string) => string }
> = {
  PENDING: {
    subject: 'Booking request received',
    heading: 'Your booking request was received',
    message: () => 'Your request is awaiting review by the administration.',
  },
  AWAITING_CHAPLAIN_APPROVAL: {
    subject: 'Booking confirmed by administration',
    heading: 'Your booking passed administrative review',
    message: (chaplain) =>
      `Please wait for ${chaplain} to approve the appointment before considering it final.`,
  },
  CONFIRMED: {
    subject: 'Booking approved by your chaplain',
    heading: 'Your booking is confirmed',
    message: (chaplain) => `${chaplain} approved your appointment request.`,
  },
  RESCHEDULED: {
    subject: 'Booking schedule updated',
    heading: 'Your booking was rescheduled',
    message: (chaplain) => `The requested appointment schedule has been updated. Please wait for ${chaplain} to approve the new schedule.`,
  },
  REJECTED: {
    subject: 'Booking request rejected',
    heading: 'Your booking request was not approved',
    message: () => 'The booking request has been rejected.',
  },
  COMPLETED: {
    subject: 'Booking marked completed',
    heading: 'Your service appointment is complete',
    message: () => 'The service appointment has been marked as completed.',
  },
  CANCELLED: {
    subject: 'Booking cancelled',
    heading: 'Your booking was cancelled',
    message: () => 'The service appointment has been cancelled.',
  },
};

export function chaplainServiceBookingStatusEmail({
  requesterName,
  serviceName,
  chaplainName,
  preferredAt,
  status,
  reason,
}: BookingStatusEmailInput) {
  const copy = statusCopy[status];
  const schedule = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(preferredAt);
  const reasonLine = reason?.trim() ? `\nReason: ${reason.trim()}` : '';
  const text = `Hello ${requesterName},\n\n${copy.message(chaplainName)}\n\nService: ${serviceName}\nChaplain: ${chaplainName}\nSchedule: ${schedule}${reasonLine}\n\nPearl of the Orient International Auxiliary Chaplain Values Educators Inc.`;
  const reasonHtml = reason?.trim()
    ? `<p><strong>Reason:</strong> ${escapeHtml(reason.trim())}</p>`
    : '';

  return {
    subject: `${copy.subject} - ${serviceName}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="color:#032a0d">${escapeHtml(copy.heading)}</h2><p>Hello ${escapeHtml(requesterName)},</p><p>${escapeHtml(copy.message(chaplainName))}</p><p><strong>Service:</strong> ${escapeHtml(serviceName)}<br><strong>Chaplain:</strong> ${escapeHtml(chaplainName)}<br><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>${reasonHtml}<p>Pearl of the Orient International Auxiliary Chaplain Values Educators Inc.</p></div>`,
  };
}
