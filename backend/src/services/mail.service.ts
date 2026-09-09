import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;

  const host = env.SMTP_HOST?.trim();
  const portStr = env.SMTP_PORT?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD?.trim();

  // Only initialize SMTP transporter if all 4 required configurations are provided
  if (host && portStr && user && pass) {
    const port = parseInt(portStr, 10);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    });
  }
  return transporter;
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const frontendUrl = env.FRONTEND_URL || 'https://be11.in';
  const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;
  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: env.EMAIL_FROM || env.SMTP_USER || 'noreply@be11.in',
        to: email,
        subject: 'Verify your BE11 Account',
        text: `Welcome to BE11! Please verify your email using the following code: ${code}\nAlternatively, open this link: ${verifyLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5; text-align: center;">Verify Your BE11 Account</h2>
            <p>Hello,</p>
            <p>Thank you for registering on BE11, the premium sports networking hub. Please verify your email address to activate your account.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">${code}</span>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </p>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">If the button does not work, copy and paste this link into your browser:<br/><a href="${verifyLink}">${verifyLink}</a></p>
            <p>Sincerely,<br/>The BE11 Team</p>
          </div>
        `,
      });
      console.log(`[SMTP] Verification email sent successfully to ${email}`);
    } catch (error: any) {
      console.error(`[SMTP ERROR] Failed to send verification email to ${email}:`, error.message || error);
    }
  } else {
    console.warn(`[MAIL SERVICE] SMTP credentials not fully configured in environment variables. Email to ${email} skipped.`);
    console.log(`[DEV EMAIL CODE] To: ${email} | Code: ${code} | Link: ${verifyLink}`);
  }
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  const frontendUrl = env.FRONTEND_URL || 'https://be11.in';
  const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;
  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: env.EMAIL_FROM || env.SMTP_USER || 'noreply@be11.in',
        to: email,
        subject: 'Reset your BE11 Password',
        text: `We received a request to reset your BE11 password. Use verification code: ${code}\nAlternatively, open this link: ${resetLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5; text-align: center;">Reset Your BE11 Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your BE11 account. Enter the code below or click the button to proceed.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">${code}</span>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">If the button does not work, copy and paste this link into your browser:<br/><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>Sincerely,<br/>The BE11 Team</p>
          </div>
        `,
      });
      console.log(`[SMTP] Password reset email sent successfully to ${email}`);
    } catch (error: any) {
      console.error(`[SMTP ERROR] Failed to send password reset email to ${email}:`, error.message || error);
    }
  } else {
    console.warn(`[MAIL SERVICE] SMTP credentials not fully configured in environment variables. Password reset email to ${email} skipped.`);
    console.log(`[DEV RESET CODE] To: ${email} | Code: ${code} | Link: ${resetLink}`);
  }
};
