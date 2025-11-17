import { Express } from "express";
import { storage } from "../storage";

// Alternative verification endpoint for deployment compatibility
export function setupVerificationRoutes(app: Express) {
  // Direct verification route (bypasses frontend routing issues)
  app.get("/verify-direct/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      console.log('🔍 Direct verification request received');
      console.log('🎫 Token from params:', token ? 'YES' : 'NO');
      console.log('🎫 Token length:', token ? token.length : 0);
      
      if (!token) {
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Verification Failed</h1>
              <p>No verification token provided</p>
              <a href="/" style="color: blue;">Back to Home</a>
            </body>
          </html>
        `);
      }
      
      // Find user with this token
      const user = await storage.getUserByEmailVerificationToken(token);
      if (!user) {
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Verification Failed</h1>
              <p>Invalid or expired verification token</p>
              <a href="/resend-verification" style="color: blue;">Resend Verification Email</a> | 
              <a href="/" style="color: blue;">Back to Home</a>
            </body>
          </html>
        `);
      }
      
      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Verification Failed</h1>
              <p>Verification token has expired</p>
              <a href="/resend-verification" style="color: blue;">Resend Verification Email</a> | 
              <a href="/" style="color: blue;">Back to Home</a>
            </body>
          </html>
        `);
      }
      
      console.log('✅ Verifying email for user:', user.email);
      console.log('🚀 Auto-approving user account');
      
      // Update user: verify email and auto-approve
      await storage.updateUser(user.id, {
        emailVerified: true,
        approved: true, // Auto-approve after email verification
        approvedBy: 999, // System approval (admin ID 999)
        approvedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });
      
      // Create notification for the user
      await storage.createNotification({
        userId: user.id,
        type: 'user_approved',
        title: 'Account Verified & Approved',
        message: `Welcome to TradeConnect! Your ${user.role} account has been verified and automatically approved. You can now access all features.`,
        actionUrl: user.role === 'supplier' ? '/dashboard/supplier' : '/dashboard/buyer',
        actionText: 'Go to Dashboard',
      });
      
      console.log('🎉 Email verification and auto-approval completed successfully');
      
      // Return success page
      res.send(`
        <html>
          <head>
            <title>Email Verified Successfully</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%); }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .success-icon { color: #4caf50; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #2e7d32; margin-bottom: 20px; }
              p { color: #666; margin-bottom: 20px; line-height: 1.6; }
              .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px; }
              .button:hover { background: #1565c0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>Email Verified Successfully!</h1>
              <p>Your account has been automatically approved. You can now log in and access all TradeConnect features.</p>
              <p><strong>What's Next:</strong></p>
              <ul style="text-align: left; color: #666; margin: 20px 0;">
                <li>Your account is now approved and active</li>
                <li>You can log in and access all features</li>
                <li>Start connecting with global suppliers and buyers</li>
              </ul>
              <a href="/login" class="button">Go to Login</a>
              <a href="/" class="button" style="background: #757575;">Back to Home</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('❌ Direct verification error:', error);
      res.status(500).send(`
        <html>
          <head><title>Verification Error</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Verification Error</h1>
            <p>An error occurred during verification. Please try again.</p>
            <a href="/resend-verification" style="color: blue;">Resend Verification Email</a> | 
            <a href="/" style="color: blue;">Back to Home</a>
          </body>
        </html>
      `);
    }
  });
}