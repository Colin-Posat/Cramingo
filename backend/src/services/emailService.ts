import nodemailer, { SentMessageInfo } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Load configuration from environment
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fliply.com';
const DOMAIN = process.env.DOMAIN || 'fliply.com';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  ...(process.env.DKIM_PRIVATE_KEY && {
    dkim: {
      domainName: DOMAIN,
      keySelector: 'default',
      privateKey: process.env.DKIM_PRIVATE_KEY,
    }
  }),
  pool: true,
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 5,
});

// EmailService interface
export interface EmailService {
  sendPasswordResetEmail: (email: string, resetLink: string, userName?: string) => Promise<SentMessageInfo>;
  sendFeedbackEmail: (email: string, subject: string, feedbackContent: string) => Promise<SentMessageInfo>;
  verifyConnection: () => Promise<boolean>;
  trackEmailEvents: (event: any) => Promise<any>;
}

// Templates
const templates = {
  passwordReset: (resetLink: string, userName = 'Valued Customer') => {
    const year = new Date().getFullYear();
    return {
      subject: 'Reset Your Fliply Password',
      html: `<div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background: linear-gradient(to right, #004a74, #001f3f); padding:20px; text-align:center; border-radius:10px 10px 0 0;">
    <h1 style="color:white; margin:0;">Fliply</h1>
  </div>
  <div style="border:1px solid #ddd; border-top:none; padding:20px; border-radius:0 0 10px 10px;">
    <h2 style="color:#004a74;">Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align:center; margin:30px 0;">
      <a href="${resetLink}" style="background-color:#004a74;color:white;padding:12px 20px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you didn't request this password reset, you can ignore this email. Your account is still secure.</p>
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all;background-color:#f5f5f5;padding:10px;border-radius:5px;font-size:12px;">${resetLink}</p>
    <p>Thank you for choosing Fliply,</p>
    <p>The Fliply Team</p>
  </div>
  <div style="text-align:center; margin-top:20px; font-size:12px; color:#666;">
    <p>© ${year} Fliply. All rights reserved.</p>
    <p>123 Tech Street, San Francisco, CA 94103</p>
    <p><a href="https://${DOMAIN}/preferences" style="color:#004a74;text-decoration:none;">Email Preferences</a> | <a href="https://${DOMAIN}/unsubscribe" style="color:#004a74;text-decoration:none;">Unsubscribe</a></p>
  </div>
</div>`,
      text: `FLIPLY\n\nPassword Reset Request\n\nHello ${userName},\n\nWe received a request to reset your password. To create a new password, visit the following link:\n\n${resetLink}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request this password reset, you can ignore this email. Your account is still secure.\n\nThank you for choosing Fliply,\nThe Fliply Team\n\n© ${year} Fliply. All rights reserved.\n123 Tech Street, San Francisco, CA 94103\n\nEmail Preferences: https://${DOMAIN}/preferences\nUnsubscribe: https://${DOMAIN}/unsubscribe`,
    };
  },
  feedback: (feedbackContent: string) => ({
    subject: 'New User Feedback',
    html: `<div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <h2>User Feedback</h2>
  <p>${feedbackContent}</p>
</div>`,
    text: `User Feedback:\n\n${feedbackContent}`,
  }),
};

// Implementation
export const emailService: EmailService = {
  sendPasswordResetEmail: async (email, resetLink, userName) => {
    const { subject, html, text } = templates.passwordReset(resetLink, userName);
    const mailOptions = {
      from: `"Fliply" <${EMAIL_FROM}>`,
      to: email,
      subject,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        'List-Unsubscribe': `<https://${DOMAIN}/unsubscribe?email=${encodeURIComponent(email)}>`,
        Precedence: 'transactional',
      },
      priority: 'high' as const,
      dsn: { id: `reset-${Date.now()}`, return: 'headers', notify: ['failure', 'delay'], recipient: EMAIL_FROM },
    };
    return transporter.sendMail(mailOptions);
  },

  sendFeedbackEmail: async (
    userEmail: string,          // ← the email the user typed in
    subject: string,
    feedbackContent: string
  ) => {
    const { html, text } = templates.feedback(feedbackContent);

    const mailOptions = {
      from: `"Fliply" <${EMAIL_FROM}>`,  // your no-reply/sender address
      to: 'fliply.help@gmail.com',                    // your support inbox
      subject,
      html,
      text,
      replyTo: userEmail || undefined,   // if they left it blank, nodemailer will ignore this
      headers: {
        Precedence: 'bulk',
      },
    };

    return transporter.sendMail(mailOptions);
  },

  verifyConnection: async () => {
    await transporter.verify();
    return true;
  },

  trackEmailEvents: async (event) => {
    console.log('Email event:', event.type, event.email);
    if (['bounce', 'complaint'].includes(event.type)) {
      console.warn(`Suppression: ${event.type} for ${event.email}`);
    }
    return event;
  },
};

export default emailService;
