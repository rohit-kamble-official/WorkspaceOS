import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'mail.smtp2go.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"WorkspaceOS" <${process.env.SMTP_FROM || 'noreply@workspaceos.com'}>`,
      to,
      subject,
      html
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Email send error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, firstName, tenantName) => {
  await sendEmail({
    to: email,
    subject: `Welcome to WorkspaceOS — ${tenantName}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">WorkspaceOS</h1>
        </div>
        <h2 style="color: #f1f5f9;">Welcome, ${firstName}! 👋</h2>
        <p style="color: #94a3b8; line-height: 1.6;">Your workspace <strong style="color: #6366f1;">${tenantName}</strong> is ready. Start managing your spaces, bookings, and team from one powerful dashboard.</p>
        <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <p style="color: #94a3b8; margin: 0;">Need help getting started? Check our documentation or reach out to support.</p>
        </div>
        <p style="color: #64748b; font-size: 12px;">WorkspaceOS — Enterprise Workspace Management</p>
      </div>
    `
  });
};

export const sendEmailVerification = async (email, token, tenantSlug) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/${tenantSlug}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your WorkspaceOS account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1;">WorkspaceOS</h1>
        <h2>Verify your email</h2>
        <p style="color: #94a3b8;">Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">Verify Email</a>
        <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async (email, token, tenantSlug) => {
  const resetUrl = `${process.env.FRONTEND_URL}/${tenantSlug}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your WorkspaceOS password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1;">WorkspaceOS</h1>
        <h2>Reset your password</h2>
        <p style="color: #94a3b8;">You requested a password reset. Click below to set a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">Reset Password</a>
        <p style="color: #64748b; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
};

export const sendBookingConfirmation = async (email, booking, userName, roomName) => {
  await sendEmail({
    to: email,
    subject: `Booking Confirmed — ${roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1;">WorkspaceOS</h1>
        <h2>Booking Confirmed ✅</h2>
        <p style="color: #94a3b8;">Hi ${userName}, your booking has been confirmed.</p>
        <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Start:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
          <p><strong>End:</strong> ${new Date(booking.endTime).toLocaleString()}</p>
          <p><strong>Reference:</strong> #${booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    `
  });
};

export const sendSubscriptionReminder = async (email, tenantName, daysLeft, plan) => {
  await sendEmail({
    to: email,
    subject: `Your ${plan} subscription expires in ${daysLeft} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1;">WorkspaceOS</h1>
        <h2>⚠️ Subscription Expiring Soon</h2>
        <p style="color: #94a3b8;">Your <strong style="color: #6366f1;">${plan}</strong> plan for <strong>${tenantName}</strong> expires in <strong>${daysLeft} days</strong>.</p>
        <a href="${process.env.FRONTEND_URL}/billing" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">Renew Now</a>
      </div>
    `
  });
};
