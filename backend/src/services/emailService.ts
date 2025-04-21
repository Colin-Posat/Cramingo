import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fliply.com';
const DOMAIN = process.env.DOMAIN || 'fliply.com';

// Create reusable transporter with improved configuration
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // Adding DKIM configuration if available
  ...(process.env.DKIM_PRIVATE_KEY && {
    dkim: {
      domainName: DOMAIN,
      keySelector: 'default', // Your DKIM selector
      privateKey: process.env.DKIM_PRIVATE_KEY,
    }
  }),
  // Adding connection pool for better performance
  pool: true,
  maxConnections: 5,
  // Set rate limits to avoid triggering spam filters
  rateDelta: 1000,
  rateLimit: 5,
});

// Email templates with both HTML and plain text versions
const templates = {
  passwordReset: (resetLink: string, userName: string = 'Valued Customer'): { subject: string; html: string; text: string } => {
    const currentYear = new Date().getFullYear();
    
    return {
      subject: 'Reset Your Fliply Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(to right, #004a74, #001f3f); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Fliply</h1>
          </div>
          <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #004a74;">Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #004a74; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can ignore this email. Your account is still secure.</p>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">${resetLink}</p>
            <p>Thank you for choosing Fliply,</p>
            <p>The Fliply Team</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${currentYear} Fliply. All rights reserved.</p>
            <p>123 Tech Street, San Francisco, CA 94103</p>
            <p>
              <a href="https://${DOMAIN}/preferences" style="color: #004a74; text-decoration: none;">Email Preferences</a> | 
              <a href="https://${DOMAIN}/unsubscribe" style="color: #004a74; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
      // Plain text version is important for spam prevention
      text: `
FLIPLY

Password Reset Request

Hello ${userName},

We received a request to reset your password. To create a new password, visit the following link:

${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can ignore this email. Your account is still secure.

Thank you for choosing Fliply,
The Fliply Team

© ${currentYear} Fliply. All rights reserved.
123 Tech Street, San Francisco, CA 94103

Email Preferences: https://${DOMAIN}/preferences
Unsubscribe: https://${DOMAIN}/unsubscribe
      `,
    };
  },
};

// Email service
export const emailService = {
  /**
   * Send a password reset email with improved deliverability
   * @param email - Recipient email address
   * @param resetLink - Password reset link
   * @param userName - Optional user name for personalization
   * @returns Promise resolving to the nodemailer info object
   */
  sendPasswordResetEmail: async (email: string, resetLink: string, userName?: string) => {
    const template = templates.passwordReset(resetLink, userName);
    
    const mailOptions = {
      from: `"Fliply" <${EMAIL_FROM}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text, // Plain text version
      headers: {
        'X-Entity-Ref-ID': `reset-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // Unique ID to prevent duplicate filtering
        'List-Unsubscribe': `<https://${DOMAIN}/unsubscribe?email=${encodeURIComponent(email)}>`,
        'Precedence': 'transactional',
      },
      // Set high priority
      priority: "high" as "high",
      dsn: {
        id: `reset-${Date.now()}`,
        return: 'headers',
        notify: ['failure', 'delay'],
        recipient: EMAIL_FROM
      }
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },
  
  /**
   * Verify the email configuration is correct
   * @returns Promise resolving to true if verification is successful
   */
  verifyConnection: async () => {
    try {
      await transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      throw error;
    }
  },
  
  /**
   * Track and log email bounces and spam reports
   * Implement if your ESP provides webhooks
   */
  trackEmailEvents: async (event: any) => {
    // Implementation depends on your email provider's webhook structure
    console.log('Email event tracked:', event.type, event.email);
    
    // Store bounce and spam complaint data to improve future deliverability
    if (event.type === 'bounce' || event.type === 'complaint') {
      // Add code to store these emails in a suppression list
      console.warn(`Email issue detected: ${event.type} for ${event.email}`);
    }
    
    return event;
  }
};

// Export the default emailService
export default emailService;