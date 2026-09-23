"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaplainServiceBookingStatusEmail = chaplainServiceBookingStatusEmail;
const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
const statusCopy = {
    PENDING: {
        subject: 'Booking request received',
        heading: 'Your booking request was received',
        message: () => 'Your request is awaiting review by the administration.',
    },
    AWAITING_CHAPLAIN_APPROVAL: {
        subject: 'Booking confirmed by administration',
        heading: 'Your booking passed administrative review',
        message: (chaplain) => `Please wait for ${chaplain} to approve the appointment before considering it final.`,
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
function chaplainServiceBookingStatusEmail({ requesterName, serviceName, chaplainName, preferredAt, status, reason, }) {
    const copy = statusCopy[status];
    const schedule = new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(preferredAt);
    const reasonLine = (reason === null || reason === void 0 ? void 0 : reason.trim()) ? `\nReason: ${reason.trim()}` : '';
    const text = `Hello ${requesterName},\n\n${copy.message(chaplainName)}\n\nService: ${serviceName}\nChaplain: ${chaplainName}\nSchedule: ${schedule}${reasonLine}\n\nPearl of the Orient International Auxiliary Chaplain Values Educators Inc.`;
    const reasonHtml = (reason === null || reason === void 0 ? void 0 : reason.trim())
        ? `<p><strong>Reason:</strong> ${escapeHtml(reason.trim())}</p>`
        : '';
    return {
        subject: `${copy.subject} - ${serviceName}`,
        text,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="color:#032a0d">${escapeHtml(copy.heading)}</h2><p>Hello ${escapeHtml(requesterName)},</p><p>${escapeHtml(copy.message(chaplainName))}</p><p><strong>Service:</strong> ${escapeHtml(serviceName)}<br><strong>Chaplain:</strong> ${escapeHtml(chaplainName)}<br><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>${reasonHtml}<p>Pearl of the Orient International Auxiliary Chaplain Values Educators Inc.</p></div>`,
    };
}
