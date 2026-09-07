import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

// Only initialize SMTP transporter if configurations are provided
if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export const sendVerificationEmail = async (email: string, code: string) => {
  const verifyLink = `${env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || 'noreply@be11.com',
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
    } catch (error) {
      console.error(`[SMTP ERROR] Failed to send verification email to ${email}:`, error);
    }
  } else {
    console.log(`
======================================================================
[DEVELOPMENT MAIL] EMAIL VERIFICATION CODE
To: ${email}
Code: ${code}
Verification Link: ${verifyLink}
(Configure SMTP settings in .env to send real emails)
======================================================================
    `);
  }
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || 'noreply@be11.com',
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
    } catch (error) {
      console.error(`[SMTP ERROR] Failed to send password reset email to ${email}:`, error);
    }
  } else {
    console.log(`
======================================================================
[DEVELOPMENT MAIL] PASSWORD RESET CODE
To: ${email}
Code: ${code}
Reset Link: ${resetLink}
(Configure SMTP settings in .env to send real emails)
======================================================================
    `);
  }
};
