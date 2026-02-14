/**
 * Node Modules
 */
import nodemailer from 'nodemailer';

/**
 * Custom Modules
 */
import config from '@/config';
import { logger } from '@/lib/winston';

const userEmail = config.SMTP_EMAIL;
const appPassword = config.SMTP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: userEmail,
    pass: appPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendMail({
  sendTo,
  subject,
  text,
  html,
}: {
  sendTo?: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    // Verify transporter connection
    await transporter.verify();

    // Send the email
    const info = await transporter.sendMail({
      from: userEmail,
      to: sendTo,
      subject: subject,
      text: text,
      html: html ? html : '',
    });

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: sendTo,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', {
      to: sendTo,
      subject,
      error,
    });

    // Return error info instead of throwing
    return { success: false, error };
  }
}
