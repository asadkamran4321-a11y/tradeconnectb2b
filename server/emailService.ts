import * as SibApiV3Sdk from '@sendinblue/client';
import crypto from 'crypto';
import { sendEmailWithSendGrid } from './sendgridService';

if (!process.env.BREVO_API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

interface EmailParams {
  to: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  // In development, just log the email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 [DEV MODE] Email would be sent to: ${params.to}`);
    console.log(`📤 From: noreply@gtsmt.com`);
    console.log(`📋 Subject: ${params.subject}`);
    console.log(`📄 HTML Content: ${params.htmlContent.substring(0, 200)}...`);
    return { success: true };
  }

  // Try Brevo first
  try {
    console.log(`📧 Sending email via Brevo to: ${params.to}`);
    console.log(`📤 From: noreply@gtsmt.com`);
    console.log(`📋 Subject: ${params.subject}`);
    
    const sendSmtpEmail = {
      to: [{ email: params.to, name: params.name }],
      sender: { email: "marketing@gtsmt.com", name: "TradeConnect" },
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || params.htmlContent.replace(/<[^>]*>/g, '')
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Brevo email sent successfully:`, result);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Brevo email error:', error);
    
    // Build error message for logging
    let errorMessage = 'Unknown error';
    if (error.response?.body?.code === 'unauthorized' && error.response?.body?.message?.includes('IP address')) {
      errorMessage = 'Email service temporarily unavailable due to server IP restrictions.';
    } else if (error.response?.body?.code === 'invalid_parameter') {
      errorMessage = 'Invalid email address format.';
    } else if (error.response?.body?.message) {
      errorMessage = error.response.body.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // If Brevo fails, try SendGrid as fallback
    console.log('Brevo failed, trying SendGrid as fallback...');
    
    try {
      const sendGridResult = await sendEmailWithSendGrid({
        to: params.to,
        subject: params.subject,
        html: params.htmlContent,
        text: params.textContent || params.htmlContent.replace(/<[^>]*>/g, '')
      });

      if (sendGridResult.success) {
        console.log('Email sent successfully via SendGrid fallback');
        return { success: true };
      } else {
        return {
          success: false,
          error: `Both email services failed. Brevo: ${errorMessage}, SendGrid: ${sendGridResult.error}`
        };
      }
    } catch (sendGridError: any) {
      console.error('SendGrid fallback also failed:', sendGridError);
      return {
        success: false,
        error: `Both email services failed. Brevo: ${errorMessage}, SendGrid: ${sendGridError.message || 'Unknown error'}`
      };
    }
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationEmail(name: string, verificationLink: string): { subject: string; htmlContent: string; textContent: string } {
  const subject = "Verify your TradeConnect account";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌐 TradeConnect</h1>
                <p>Welcome to the Global B2B Marketplace</p>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Thank you for joining TradeConnect! To complete your registration and start connecting with global suppliers and buyers, please verify your email address.</p>
                
                <p style="text-align: center;">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                </p>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffcc02; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;"><strong>Trouble with the link above?</strong> Try this direct verification link:</p>
                    <p style="word-break: break-all; background: #fff; padding: 8px; border-radius: 4px; margin: 5px 0 0 0; font-size: 12px; color: #856404;">${verificationLink.replace('/verify-email?token=', '/verify-direct/')}</p>
                </div>
                
                <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ What happens after verification:</h3>
                    <ul style="color: #065f46; margin: 0;">
                        <li>Your account will be automatically approved</li>
                        <li>You can immediately start using TradeConnect</li>
                        <li>Access to all marketplace features</li>
                    </ul>
                </div>
                
                <p><strong>This link will expire in 24 hours for security purposes.</strong></p>
                
                <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2025 TradeConnect. All rights reserved.</p>
                <p>Connecting businesses worldwide through trusted B2B partnerships.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to TradeConnect!
    
    Hello ${name}!
    
    Thank you for joining TradeConnect! To complete your registration and start connecting with global suppliers and buyers, please verify your email address.
    
    Click this link to verify: ${verificationLink}
    
    What happens after verification:
    - Your account will be automatically approved
    - You can immediately start using TradeConnect  
    - Access to all marketplace features
    
    This link will expire in 24 hours for security purposes.
    
    If you didn't create this account, please ignore this email.
    
    © 2025 TradeConnect. All rights reserved.
  `;

  return { subject, htmlContent, textContent };
}

export function generatePasswordResetEmail(email: string, resetLink: string): { subject: string; htmlContent: string; textContent: string } {
  const subject = "Reset your TradeConnect password";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 TradeConnect</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Hello!</h2>
                <p>We received a request to reset the password for your TradeConnect account (${email}).</p>
                
                <p style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </p>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">${resetLink}</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffcc02; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;"><strong>Trouble with the link above?</strong> Try this direct reset link:</p>
                    <p style="word-break: break-all; background: #fff; padding: 8px; border-radius: 4px; margin: 5px 0 0 0; font-size: 12px; color: #856404;">${resetLink.replace('/reset-password?token=', '/reset-direct/')}</p>
                </div>
                
                <div class="warning">
                    <h3 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Important Security Information:</h3>
                    <ul style="color: #dc2626; margin: 0;">
                        <li>This link will expire in 1 hour for security</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Your password will remain unchanged unless you click the link</li>
                    </ul>
                </div>
                
                <p>Need help? Contact our support team if you have any questions.</p>
            </div>
            <div class="footer">
                <p>© 2025 TradeConnect. All rights reserved.</p>
                <p>This is an automated security email from TradeConnect.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
    TradeConnect - Password Reset Request
    
    Hello!
    
    We received a request to reset the password for your TradeConnect account (${email}).
    
    Click this link to reset your password: ${resetLink}
    
    Important Security Information:
    - This link will expire in 1 hour for security
    - If you didn't request this reset, please ignore this email
    - Your password will remain unchanged unless you click the link
    
    Need help? Contact our support team if you have any questions.
    
    © 2025 TradeConnect. All rights reserved.
  `;

  return { subject, htmlContent, textContent };
}