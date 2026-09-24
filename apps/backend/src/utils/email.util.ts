import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Production-ready email template definitions.
 * Add new templates here as your app grows.
 */
export const EmailTemplates = {
  VerificationOTP: (otp: string): EmailTemplate => ({
    subject: "Verify Your Email - Easy Food",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ea580c; margin: 0;">Easy Food</h1>
        </div>
        <h2 style="color: #333;">Verify Your Email</h2>
        <p style="color: #555; line-height: 1.5;">Thank you for registering! Please use the following 6-digit code to verify your email address. This code will expire in 10 minutes.</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0; color: #111;">
          ${otp}
        </div>
        <p style="color: #777; font-size: 13px; line-height: 1.5;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    `
  }),
  
  PasswordResetOTP: (otp: string): EmailTemplate => ({
    subject: "Reset Your Password - Easy Food",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ea580c; margin: 0;">Easy Food</h1>
        </div>
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #555; line-height: 1.5;">We received a request to reset your password. Use the following 6-digit code to proceed. This code will expire in 10 minutes.</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0; color: #111;">
          ${otp}
        </div>
        <p style="color: #777; font-size: 13px; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  }),

  OrderConfirmation: (orderId: string, total: number, customerName: string): EmailTemplate => ({
    subject: `Order Confirmed - #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ea580c; margin: 0;">Easy Food</h1>
        </div>
        <h2 style="color: #333;">Order Received, ${customerName}!</h2>
        <p style="color: #555; line-height: 1.5;">Your order <strong>#${orderId}</strong> has been successfully placed and sent to the vendor for preparation.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
          <p style="margin: 0; color: #333; font-weight: bold;">Order Total: ₹${total.toFixed(2)}</p>
        </div>
        <p style="color: #555; line-height: 1.5;">You can track the live status of your order on your dashboard.</p>
      </div>
    `
  })
};

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

/**
 * Core Email Service for sending templates
 */
export const EmailService = {
  /**
   * Send an email using a predefined template.
   */
  async send(to: string, template: EmailTemplate): Promise<void> {
    if (!env.smtpUser) {
      console.warn(`[EmailService] SMTP not configured. Skipping email to ${to}. Subject: "${template.subject}"`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Easy Food" <${env.smtpUser}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      console.log(`[EmailService] Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
      // In production, you might want to report this to an error tracking service (e.g. Sentry)
      throw new Error("Failed to send email");
    }
  }
};
