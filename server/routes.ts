import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSEORoutes } from "./routes/seo";
import { insertCategorySchema } from "@shared/schema";
import { insertUserSchema, insertSupplierSchema, insertBuyerSchema, insertProductSchema, insertInquirySchema, insertNotificationSchema, insertBlogPostSchema, insertProductReviewSchema, insertReviewCommentSchema, updateProductReviewSchema, updateReviewCommentSchema } from "@shared/schema";
import { sendEmail, generateVerificationToken, generateVerificationEmail, generatePasswordResetEmail } from "./emailService";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { setupVerificationRoutes } from "./routes/verification";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  const userId = Number(req.headers['user-id']);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Get user from storage to check role
  storage.getUserById(userId).then(user => {
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    next();
  }).catch(error => {
    return res.status(500).json({ message: "Error checking admin access" });
  });
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req: any, res: any, next: any) => {
  const userId = Number(req.headers['user-id']);
  console.log('requireSuperAdmin - userId:', userId);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Get user from storage to check role
  storage.getUserById(userId).then(user => {
    console.log('requireSuperAdmin - found user:', user);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Super admin access required" });
    }
    req.user = user;
    console.log('requireSuperAdmin - set req.user:', req.user);
    next();
  }).catch(error => {
    console.error('requireSuperAdmin - error:', error);
    return res.status(500).json({ message: "Error checking admin access" });
  });
};

// Configure multer for image uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `blog_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    
    // Check allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed'));
    }
    
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory (for uploaded images in development)
  const publicPath = path.resolve(process.cwd(), 'public');
  app.use('/uploads', express.static(path.join(publicPath, 'uploads')));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      // Validate input
      const userData = insertUserSchema.parse({ email, password, role });
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        if (existingUser.emailVerified) {
          return res.status(400).json({ 
            message: "An account with this email already exists. Please sign in instead.",
            userExists: true
          });
        } else {
          // Allow re-registration for unverified accounts
          // This handles cases where users never completed verification
          await storage.deleteUser(existingUser.id);
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Create user with email verification fields
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        approved: false, // Will be auto-approved after email verification
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Create admin notification for new user registration
      await storage.createAdminNotification({
        type: 'new_user_registration',
        title: 'New User Registration',
        message: `New ${role} registered: ${email}`,
        relatedId: user.id,
      });
      
      // Create minimal profile based on role (profiles will be completed later)
      if (role === "supplier") {
        await storage.createSupplier({
          userId: user.id,
          companyName: `Company ${user.id}`, // Temporary name
          description: '',
          location: '',
          phone: '',
        });
      } else if (role === "buyer") {
        await storage.createBuyer({
          userId: user.id,
          companyName: `Company ${user.id}`, // Temporary name
          contactName: '',
          phone: '',
          industry: '',
        });
      }
      
      // Send verification email
      const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
      const emailContent = generateVerificationEmail(email, verificationLink);
      
      const emailResult = await sendEmail({
        to: email,
        name: email,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent
      });
      
      // Track email status and provide detailed error information
      const emailStatus = emailResult.success ? 'sent' : 'failed';
      
      if (!emailResult.success) {
        console.error('Failed to send verification email to:', email, 'Error:', emailResult.error);
      }
      
      res.json({ 
        user: { id: user.id, email: user.email, role: user.role, approved: user.approved, emailVerified: user.emailVerified },
        emailStatus,
        emailError: emailResult.error,
        message: emailResult.success 
          ? "Registration successful! Please check your email to verify your account. Your account will be automatically approved after email verification."
          : `Registration successful! However, we couldn't send the verification email: ${emailResult.error || 'Unknown error'}. You can still login and request a new verification email from your dashboard.`
      });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // For already verified users, skip verification check
      if (user.emailVerified) {
        // Since we auto-approve after email verification, verified users should always be approved
        // Check if user is approved (admins are always approved)
        if (!user.approved && user.role !== 'admin') {
          return res.status(401).json({ message: "Your account is pending approval. Please wait for admin approval." });
        }
      } else if (user.role !== 'admin') {
        // For unverified users (except admins), require email verification
        return res.status(401).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
          requiresVerification: true
        });
      }
      
      res.json({ user: { id: user.id, email: user.email, role: user.role, approved: user.approved, emailVerified: user.emailVerified } });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Email verification route with enhanced logging
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      console.log('🔍 Email verification request received');
      console.log('🔗 Full request URL:', req.url);
      console.log('🔗 Query params:', JSON.stringify(req.query));
      console.log('🎫 Token received:', token ? 'YES' : 'NO');
      console.log('🎫 Token value:', token ? String(token).substring(0, 16) + '...' : 'NULL');
      console.log('🎫 Token length:', token ? String(token).length : 0);
      
      if (!token || typeof token !== 'string') {
        console.log('❌ Invalid token provided');
        return res.status(400).json({ 
          message: "Invalid verification token",
          debug: {
            queryReceived: req.query,
            tokenExists: !!token,
            tokenType: typeof token
          }
        });
      }
      
      // Find user with this token
      const user = await storage.getUserByEmailVerificationToken(token);
      console.log('👤 User found with token:', user ? 'YES' : 'NO');
      
      if (!user) {
        console.log('❌ No user found with this token');
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        console.log('⏰ Token has expired');
        return res.status(400).json({ message: "Verification token has expired. Please use the resend verification option." });
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
      
      res.json({ 
        message: "Email verified successfully! Your account has been automatically approved. You can now log in.",
        verified: true
      });
    } catch (error) {
      console.error('❌ Email verification error:', error);
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Resend verification email route
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });
      
      // Send verification email
      const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
      const emailContent = generateVerificationEmail(email, verificationLink);
      
      const emailResult = await sendEmail({
        to: email,
        name: email,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent
      });
      
      if (!emailResult.success) {
        console.error('Failed to resend verification email to:', email, 'Error:', emailResult.error);
        return res.status(500).json({ message: emailResult.error || "Failed to send verification email. Please check your email address or try again later." });
      }
      
      res.json({ 
        message: "Verification email resent successfully. Please check your inbox and spam folder."
      });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Password reset request route
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ message: "If an account with this email exists, you will receive a password reset link." });
      }
      
      // Generate reset token
      const resetToken = generateVerificationToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });
      
      // Send password reset email
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = generatePasswordResetEmail(email, resetLink);
      
      const emailResult = await sendEmail({
        to: email,
        name: email,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent
      });
      
      if (!emailResult.success) {
        console.error('Failed to send password reset email to:', email, 'Error:', emailResult.error);
        // Still return success message for security (don't reveal if user exists)
      } else {
        console.log('✅ Password reset email sent successfully to:', email);
      }
      
      res.json({ 
        message: "If an account with this email exists, you will receive a password reset link."
      });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Password reset route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      console.log('🔄 Password reset request received');
      console.log('🎫 Token provided:', token ? 'YES' : 'NO');
      console.log('🔑 New password provided:', newPassword ? 'YES' : 'NO');
      
      if (!token || !newPassword) {
        console.error('❌ Missing token or password');
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Find user with reset token
      console.log('🔍 Looking for user with reset token...');
      const user = await storage.getUserByPasswordResetToken(token);
      
      if (!user) {
        console.error('❌ No user found with this reset token');
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log('✅ User found:', user.email);
      console.log('⏰ Token expires at:', user.passwordResetExpires);
      console.log('⏰ Current time:', new Date());
      
      // Check if token is expired
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        console.error('❌ Reset token has expired');
        return res.status(400).json({ message: "Reset token has expired. Please request a new password reset." });
      }
      
      // Hash new password
      console.log('🔐 Hashing new password...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password and clear reset token
      console.log('💾 Updating user password and clearing reset token...');
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      
      console.log('✅ Password reset completed successfully for:', user.email);
      res.json({ 
        message: "Password reset successfully. You can now log in with your new password."
      });
    } catch (error) {
      console.error('❌ Password reset error:', error);
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Direct password reset route (bypasses frontend routing issues)
  app.get('/reset-direct/:token', async (req, res) => {
    try {
      const token = req.params.token;
      console.log('🔍 Direct reset request received for token:', token.substring(0, 10) + '...');
      
      // Validate token exists and is not expired
      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.send(`
          <html>
            <head><title>Invalid Reset Link</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h2>❌ Invalid Reset Link</h2>
              <p>This password reset link is invalid or has expired.</p>
              <p><a href="/forgot-password">Request a new password reset</a></p>
            </body>
          </html>
        `);
      }
      
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        return res.send(`
          <html>
            <head><title>Expired Reset Link</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h2>⏰ Reset Link Expired</h2>
              <p>This password reset link has expired.</p>
              <p><a href="/forgot-password">Request a new password reset</a></p>
            </body>
          </html>
        `);
      }
      
      // Redirect to frontend reset page with token
      res.redirect(`/reset-password?token=${token}`);
    } catch (error) {
      console.error('❌ Direct reset error:', error);
      res.send(`
        <html>
          <head><title>Reset Error</title></head>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h2>❌ Reset Error</h2>
            <p>An error occurred while processing your reset request.</p>
            <p><a href="/forgot-password">Request a new password reset</a></p>
          </body>
        </html>
      `);
    }
  });

  // File upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      // For now, we'll simulate file upload by returning a placeholder URL
      // In production, this would integrate with cloud storage (AWS S3, etc.)
      const timestamp = Date.now();
      const fileName = req.body.fileName || `file_${timestamp}`;
      
      // Simulate upload processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileUrl = `/uploads/${fileName}_${timestamp}`;
      
      res.json({ 
        url: fileUrl,
        fileName: fileName,
        message: "File uploaded successfully"
      });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "Upload failed") });
    }
  });

  // Get current user (for authentication checks)
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.approved && user.role !== 'admin') {
        return res.status(403).json({ message: "Account pending admin approval" });
      }
      
      res.json({ id: user.id, email: user.email, role: user.role, approved: user.approved });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // User profile routes
  app.get("/api/profile", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let profile = null;
      if (user.role === "supplier") {
        profile = await storage.getSupplierByUserId(userId);
      } else if (user.role === "buyer") {
        profile = await storage.getBuyerByUserId(userId);
      }
      
      res.json({ user: { id: user.id, email: user.email, role: user.role }, profile });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/categories/with-subcategories", async (req, res) => {
    try {
      const mainCategories = await storage.getCategoriesWithSubcategories();
      const categoriesWithSubs = await Promise.all(
        mainCategories.map(async (category) => {
          const subcategories = await storage.getSubcategories(category.id);
          return { ...category, subcategories };
        })
      );
      res.json(categoriesWithSubs);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/categories/:id/subcategories", async (req, res) => {
    try {
      const parentId = Number(req.params.id);
      const subcategories = await storage.getSubcategories(parentId);
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Admin category management routes
  app.post("/api/admin/categories", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const user = await storage.getUserById(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({
        ...categoryData,
        createdBy: userId
      });
      
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/categories", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const user = await storage.getUserById(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/admin/categories/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const user = await storage.getUserById(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryId = Number(req.params.id);
      const updates = req.body;
      
      const updatedCategory = await storage.updateCategory(categoryId, updates);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const user = await storage.getUserById(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryId = Number(req.params.id);
      const deleted = await storage.deleteCategory(categoryId);
      
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete category with subcategories or products" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, supplierId, search, minPrice, maxPrice, sortBy } = req.query;
      
      const filters = {
        categoryId: categoryId ? Number(categoryId) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy as string,
      };
      
      const products = await storage.getProducts(filters);
      
      // Populate supplier information for each product
      const productsWithSuppliers = await Promise.all(
        products.map(async (product) => {
          const supplier = await storage.getSupplierById(product.supplierId);
          const category = await storage.getCategoryById(product.categoryId);
          return {
            ...product,
            supplier: supplier ? {
              id: supplier.id,
              companyName: supplier.companyName,
              location: supplier.location,
              verified: supplier.verified,
              rating: supplier.rating
            } : null,
            category: category ? {
              id: category.id,
              name: category.name
            } : null
          };
        })
      );
      
      res.json(productsWithSuppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Scrape product data from URL (for demo purposes)
  app.post('/api/scrape-product', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      // Simulate product data scraping from B2B platforms
      // In a real implementation, you would use web scraping libraries like Puppeteer or Cheerio
      const mockProductData = {
        name: 'Premium Industrial Component',
        description: 'High-quality industrial component manufactured to international standards. Suitable for various applications in manufacturing and construction industries.',
        price: '45.99',
        moq: 500,
        unit: 'piece',
        specifications: 'Material: Stainless Steel Grade 304\nDimensions: 150mm x 100mm x 50mm\nWeight: 2.5kg\nSurface: Brushed finish\nCertifications: ISO 9001, CE',
        materials: 'Stainless Steel 304, Rubber gaskets, Aluminum fittings',
        leadTime: '15-25 days',
        incoterms: 'FOB Shanghai',
        packagingDetails: 'Individual plastic bags, 50 pieces per carton',
        paymentTerms: 'T/T, L/C at sight',
        origin: 'China',
        supplyCapacity: '50,000 pieces per month',
        color: 'Silver',
        size: '150x100x50mm',
        weight: '2.5kg',
        dimensions: '150mm x 100mm x 50mm',
        qualityGrade: 'Grade A',
        images: [
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=500&h=500&fit=crop'
        ]
      };

      res.json(mockProductData);
    } catch (error) {
      console.error('Error scraping product data:', error);
      res.status(500).json({ message: 'Failed to scrape product data' });
    }
  });

  // Draft product endpoints (must come before parametric routes)
  app.post("/api/products/draft", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can create draft products" });
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        supplierId: supplier.id,
      });
      
      const product = await storage.saveDraftProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/products/drafts", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view draft products" });
      }
      
      const products = await storage.getDraftProductsBySupplier(supplier.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/products/deleted", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view deleted products" });
      }
      
      const products = await storage.getDeletedProductsBySupplier(supplier.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/products/draft/:id/publish", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const productId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can publish draft products" });
      }
      
      const product = await storage.getProductById(productId);
      if (!product || product.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const published = await storage.publishDraftProduct(productId);
      res.json({ success: published });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Increment view count
      await storage.incrementProductViews(id);
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can create products" });
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        supplierId: supplier.id,
      });
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const productId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can update products" });
      }
      
      const product = await storage.getProductById(productId);
      if (!product || product.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const productId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can delete products" });
      }
      
      const product = await storage.getProductById(productId);
      if (!product || product.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const deleted = await storage.softDeleteProduct(productId, userId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/products/:id/recover", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const productId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can recover products" });
      }
      
      const product = await storage.getProductById(productId);
      if (!product || product.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const recovered = await storage.recoverProduct(productId);
      res.json({ success: recovered });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Supplier onboarding route
  app.post("/api/suppliers/onboarding", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const onboardingData = req.body;
      
      // Update supplier profile with onboarding data
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const updatedSupplier = await storage.updateSupplier(supplier.id, {
        ...onboardingData,
        onboardingCompleted: true,
        onboardingStep: 7,
      });

      res.json({ supplier: updatedSupplier });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Supplier routes
  // Save supplier profile draft
  app.post("/api/suppliers/save-draft", async (req, res) => {
    try {
      const { profileDraftData } = req.body;
      const userId = Number(req.headers['user-id']);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      await storage.updateSupplierByUserId(userId, { profileDraftData });
      
      res.json({ message: "Draft saved successfully" });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Complete supplier onboarding
  app.post("/api/suppliers/complete-onboarding", async (req, res) => {
    try {
      const supplierData = req.body;
      const userId = Number(req.headers['user-id']);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Update supplier with complete profile data and set status to pending approval
      await storage.updateSupplierByUserId(userId, {
        ...supplierData,
        onboardingCompleted: true,
        verified: false, // Set to false until admin approves
        status: 'pending_approval', // Set status to pending approval
        profileDraftData: null // Clear draft data
      });
      
      res.json({ message: "Profile submitted successfully for review" });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get supplier profile (including draft data)
  app.get("/api/profile/supplier", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/suppliers", async (req, res) => {
    try {
      const { search, location } = req.query;
      const suppliers = await storage.getSuppliers(search as string, location as string);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Try to get supplier by profile ID first
      let supplier = await storage.getSupplierById(id);
      
      // If not found, try to get supplier by user ID
      if (!supplier) {
        supplier = await storage.getSupplierByUserId(id);
      }
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const supplierId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the supplier to verify ownership
      const supplier = await storage.getSupplierById(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      // Check if the user owns this supplier profile
      if (supplier.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updateData = req.body;
      const updatedSupplier = await storage.updateSupplier(supplierId, updateData);
      
      res.json(updatedSupplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Inquiry routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can create inquiries" });
      }
      
      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        buyerId: buyer.id,
      });
      
      const inquiry = await storage.createInquiry(inquiryData);
      res.json(inquiry);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/inquiries/buyer", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can view their inquiries" });
      }
      
      const inquiries = await storage.getInquiriesByBuyer(buyer.id);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/inquiries/supplier", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view their inquiries" });
      }
      
      const inquiries = await storage.getInquiriesBySupplier(supplier.id);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/inquiries/:id/reply", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const inquiryId = Number(req.params.id);
      const { reply } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can reply to inquiries" });
      }
      
      const inquiry = await storage.getInquiryById(inquiryId);
      if (!inquiry || inquiry.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      const updatedInquiry = await storage.replyToInquiry(inquiryId, reply);
      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Buyer reply to inquiry endpoint
  app.post("/api/inquiries/:id/buyer-reply", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const inquiryId = Number(req.params.id);
      const { reply } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can reply to inquiries" });
      }
      
      const inquiry = await storage.getInquiryById(inquiryId);
      if (!inquiry || inquiry.buyerId !== buyer.id) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      const updatedInquiry = await storage.buyerReplyToInquiry(inquiryId, reply);
      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/inquiries/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const inquiryId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can delete inquiries" });
      }
      
      const inquiry = await storage.getInquiryById(inquiryId);
      if (!inquiry || inquiry.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      const deletedInquiry = await storage.deleteInquiry(inquiryId);
      res.json(deletedInquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/inquiries/:id/recover", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const inquiryId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can recover inquiries" });
      }
      
      const inquiry = await storage.getInquiryById(inquiryId);
      if (!inquiry || inquiry.supplierId !== supplier.id) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      const recoveredInquiry = await storage.recoverInquiry(inquiryId);
      res.json(recoveredInquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/supplier", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view supplier dashboard" });
      }
      
      const stats = await storage.getSupplierStats(supplier.id);
      const recentProducts = await storage.getProductsBySupplier(supplier.id);
      
      res.json({ stats, recentProducts: recentProducts.slice(0, 5) });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/dashboard/buyer", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can view buyer dashboard" });
      }
      
      const stats = await storage.getBuyerStats(buyer.id);
      const products = await storage.getProducts({ sortBy: 'latest' });
      
      res.json({ stats, recommendedProducts: products.slice(0, 6) });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Saved products routes
  app.post("/api/saved-products", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can save products" });
      }
      
      const { productId } = req.body;
      const savedProduct = await storage.saveLikeProduct({
        buyerId: buyer.id,
        productId: Number(productId),
      });
      
      res.json(savedProduct);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/saved-products", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can view saved products" });
      }
      
      const savedProducts = await storage.getSavedProductsByBuyer(buyer.id);
      
      // Get product details for each saved product
      const savedProductsWithDetails = await Promise.all(
        savedProducts.map(async (savedProduct) => {
          const product = await storage.getProductById(savedProduct.productId);
          return {
            ...savedProduct,
            product,
          };
        })
      );
      
      res.json(savedProductsWithDetails);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/saved-products", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can remove saved products" });
      }
      
      const { productId } = req.body;
      const success = await storage.removeSavedProduct(buyer.id, Number(productId));
      
      if (!success) {
        return res.status(404).json({ message: "Product not found in saved list" });
      }
      
      res.json({ message: "Product removed successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Follow supplier endpoints
  app.post("/api/follow-supplier", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can follow suppliers" });
      }
      
      const { supplierId } = req.body;
      const followedSupplier = await storage.followSupplier({
        buyerId: buyer.id,
        supplierId: Number(supplierId),
      });
      
      res.json(followedSupplier);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/followed-suppliers", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can view followed suppliers" });
      }
      
      const followedSuppliers = await storage.getFollowedSuppliersByBuyer(buyer.id);
      res.json(followedSuppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/unfollow-supplier", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const buyer = await storage.getBuyerByUserId(userId);
      if (!buyer) {
        return res.status(403).json({ message: "Only buyers can unfollow suppliers" });
      }
      
      const { supplierId } = req.body;
      const success = await storage.unfollowSupplier(buyer.id, Number(supplierId));
      
      if (!success) {
        return res.status(404).json({ message: "Supplier not found in followed list" });
      }
      
      res.json({ message: "Supplier unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/notification-counts", requireAdmin, async (req, res) => {
    try {
      const counts = await storage.getAdminNotificationCounts();
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/products/pending", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getPendingProducts();
      // Add supplier information to each product
      const productsWithSupplier = await Promise.all(
        products.map(async (product) => {
          const supplier = await storage.getSupplierByUserId(product.supplierId);
          return { ...product, supplier };
        })
      );
      res.json(productsWithSupplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/products/rejected", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getRejectedProducts();
      // Add supplier information to each product
      const productsWithSupplier = await Promise.all(
        products.map(async (product) => {
          const supplier = await storage.getSupplierByUserId(product.supplierId);
          return { ...product, supplier };
        })
      );
      res.json(productsWithSupplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get approved products
  app.get("/api/admin/products/approved", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getApprovedProducts();
      // Add supplier information to each product
      const productsWithSupplier = await Promise.all(
        products.map(async (product) => {
          const supplier = await storage.getSupplierByUserId(product.supplierId);
          return { ...product, supplier };
        })
      );
      res.json(productsWithSupplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get suspended products
  app.get("/api/admin/products/suspended", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getSuspendedProducts();
      // Add supplier information to each product
      const productsWithSupplier = await Promise.all(
        products.map(async (product) => {
          const supplier = await storage.getSupplierByUserId(product.supplierId);
          return { ...product, supplier };
        })
      );
      res.json(productsWithSupplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Suspend product
  app.post("/api/admin/products/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = 999; // Current admin ID
      
      const product = await storage.suspendProduct(productId, adminId, reason);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Unsuspend product
  app.post("/api/admin/products/:id/unsuspend", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      const product = await storage.unsuspendProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Restore supplier
  app.post("/api/admin/suppliers/:id/restore", requireAdmin, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      
      const supplier = await storage.restoreSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier restored successfully", supplier });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const deleted = await storage.deleteProduct(productId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // ===== BUYER MANAGEMENT ROUTES =====
  
  // Get buyer statistics
  app.get("/api/admin/buyers/stats", requireAdmin, async (req, res) => {
    try {
      const buyers = await storage.getAllBuyers();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats = {
        total: buyers.length,
        active: buyers.filter(b => !b.suspended).length,
        suspended: buyers.filter(b => b.suspended).length,
        newThisMonth: buyers.filter(b => new Date(b.createdAt) >= thisMonth).length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get all buyers for admin
  app.get("/api/admin/buyers", requireAdmin, async (req, res) => {
    try {
      const buyers = await storage.getAllBuyers();
      res.json(buyers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Suspend buyer
  app.post("/api/admin/buyers/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const buyerId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const result = await storage.suspendBuyer(buyerId, reason || 'Suspended by admin');
      if (!result) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      res.json({ message: "Buyer suspended successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Activate buyer
  app.post("/api/admin/buyers/:id/activate", requireAdmin, async (req, res) => {
    try {
      const buyerId = parseInt(req.params.id);
      
      const result = await storage.activateBuyer(buyerId);
      if (!result) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      res.json({ message: "Buyer activated successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get detailed buyer profile by ID (for admin)
  app.get("/api/admin/buyers/:id/profile", requireAdmin, async (req, res) => {
    try {
      const buyerId = parseInt(req.params.id);
      const buyer = await storage.getBuyerById(buyerId);
      
      if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      // Get user details
      const user = await storage.getUserById(buyer.userId);
      
      const detailedProfile = {
        ...buyer,
        email: user?.email || 'Unknown',
        userRole: user?.role || 'buyer',
        approved: user?.approved || false,
        emailVerified: user?.emailVerified || false,
        createdAt: user?.createdAt || buyer.createdAt,
        updatedAt: user?.updatedAt || buyer.updatedAt
      };
      
      res.json(detailedProfile);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Delete buyer account
  app.delete("/api/admin/buyers/:id/delete", requireAdmin, async (req, res) => {
    try {
      const buyerId = parseInt(req.params.id);
      
      const result = await storage.deleteBuyer(buyerId);
      if (!result) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      res.json({ message: "Buyer account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // ===== INQUIRY MANAGEMENT ROUTES =====
  
  // Get inquiry statistics  
  app.get("/api/admin/inquiries/stats", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats = {
        total: inquiries.length,
        pending: inquiries.filter(i => i.adminApprovalStatus === 'pending').length,
        approved: inquiries.filter(i => i.adminApprovalStatus === 'approved').length,
        rejected: inquiries.filter(i => i.adminApprovalStatus === 'rejected').length,
        thisMonth: inquiries.filter(i => new Date(i.createdAt) >= thisMonth).length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get pending inquiries
  app.get("/api/admin/inquiries/pending", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getPendingInquiries();
      // getPendingInquiries already enriches the data, so just return it
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get approved inquiries
  app.get("/api/admin/inquiries/approved", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getApprovedInquiries();
      const inquiriesWithDetails = await Promise.all(
        inquiries.map(async (inquiry) => {
          const buyer = await storage.getBuyerById(inquiry.buyerId);
          const supplier = await storage.getSupplierById(inquiry.supplierId);
          const product = inquiry.productId ? await storage.getProductById(inquiry.productId) : null;
          
          return {
            ...inquiry,
            buyerCompanyName: buyer?.companyName || 'Unknown',
            supplierCompanyName: supplier?.companyName || 'Unknown',
            productName: product?.name || 'Unknown'
          };
        })
      );
      res.json(inquiriesWithDetails);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get rejected inquiries
  app.get("/api/admin/inquiries/rejected", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getRejectedInquiries();
      const inquiriesWithDetails = await Promise.all(
        inquiries.map(async (inquiry) => {
          const buyer = await storage.getBuyerById(inquiry.buyerId);
          const supplier = await storage.getSupplierById(inquiry.supplierId);
          const product = inquiry.productId ? await storage.getProductById(inquiry.productId) : null;
          
          return {
            ...inquiry,
            buyerCompanyName: buyer?.companyName || 'Unknown',
            supplierCompanyName: supplier?.companyName || 'Unknown',
            productName: product?.name || 'Unknown'
          };
        })
      );
      res.json(inquiriesWithDetails);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get all inquiries
  app.get("/api/admin/inquiries/all", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      const inquiriesWithDetails = await Promise.all(
        inquiries.map(async (inquiry) => {
          const buyer = await storage.getBuyerById(inquiry.buyerId);
          const supplier = await storage.getSupplierById(inquiry.supplierId);
          const product = inquiry.productId ? await storage.getProductById(inquiry.productId) : null;
          
          return {
            ...inquiry,
            buyerCompanyName: buyer?.companyName || 'Unknown',
            supplierCompanyName: supplier?.companyName || 'Unknown',
            productName: product?.name || 'Unknown'
          };
        })
      );
      res.json(inquiriesWithDetails);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });
  
  // Get detailed inquiry by ID (for admin) - MUST BE AFTER OTHER ROUTES
  app.get("/api/admin/inquiries/:id(\\\\d+)", requireAdmin, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const inquiry = await storage.getInquiryById(inquiryId);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      // Enrich with related data
      const buyer = await storage.getBuyerById(inquiry.buyerId);
      const supplier = await storage.getSupplierById(inquiry.supplierId);
      const product = inquiry.productId ? await storage.getProductById(inquiry.productId) : null;
      
      const enrichedInquiry = {
        ...inquiry,
        buyerCompanyName: buyer?.companyName || 'Unknown',
        buyerEmail: buyer?.contactEmail || 'Unknown',
        buyerPhone: buyer?.contactPhone || 'Unknown',
        supplierCompanyName: supplier?.companyName || 'Unknown',
        supplierEmail: supplier?.contactEmail || 'Unknown', 
        supplierPhone: supplier?.contactPhone || 'Unknown',
        productName: product?.name || 'General Inquiry',
        productDescription: product?.description || null,
        productPrice: product?.price || null
      };
      
      res.json(enrichedInquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });
  
  // Get detailed supplier profile by ID (for admin)
  app.get("/api/admin/suppliers/:id/profile", requireAdmin, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const supplier = await storage.getSupplierById(supplierId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      // Get user details
      const user = await storage.getUserById(supplier.userId);
      
      const detailedProfile = {
        ...supplier,
        email: user?.email || 'Unknown',
        userRole: user?.role || 'supplier',
        approved: user?.approved || false,
        emailVerified: user?.emailVerified || false,
        createdAt: user?.createdAt || supplier.createdAt,
        updatedAt: user?.updatedAt || supplier.updatedAt
      };
      
      res.json(detailedProfile);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Suspend supplier
  app.post("/api/admin/suppliers/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const suspendedBy = Number(req.headers['user-id']);
      
      if (!suspendedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.suspendSupplier(supplierId, suspendedBy, reason || 'Suspended by admin');
      if (!result) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier suspended successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Activate supplier
  app.post("/api/admin/suppliers/:id/activate", requireAdmin, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      
      const result = await storage.activateSupplier(supplierId);
      if (!result) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier activated successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Delete supplier account
  app.delete("/api/admin/suppliers/:id/delete", requireAdmin, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      
      const deletedBy = Number(req.headers['user-id']);
      
      if (!deletedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.deleteSupplier(supplierId, deletedBy);
      if (!result) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Approve inquiry
  app.post("/api/admin/inquiries/:id/approve", requireAdmin, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      
      const result = await storage.approveInquiry(inquiryId);
      if (!result) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json({ message: "Inquiry approved successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Reject inquiry
  app.post("/api/admin/inquiries/:id/reject", requireAdmin, async (req, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const result = await storage.rejectInquiry(inquiryId, reason || 'Rejected by admin');
      if (!result) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json({ message: "Inquiry rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/products/:id/review", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const { action, notes } = req.body;
      const userId = Number(req.headers['user-id']);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const product = await storage.reviewProduct(productId, action, userId, notes);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/suppliers", requireAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliersForAdmin();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/suppliers/pending", requireAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getPendingSuppliersForAdmin();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/suppliers/:id/verify", requireAdmin, async (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const { verified } = req.body;
      
      const supplier = await storage.verifySupplier(supplierId, verified);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/suppliers/:id/reject", requireAdmin, async (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const { reason } = req.body;
      const rejectedBy = Number(req.headers['user-id']);
      
      if (!rejectedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const supplier = await storage.rejectSupplier(supplierId, rejectedBy, reason);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/suppliers/rejected", requireAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getRejectedSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });
  
  app.get("/api/admin/suppliers/suspended", requireAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getSuspendedSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });
  
  app.get("/api/admin/suppliers/deleted", requireAdmin, async (req, res) => {
    try {
      const suppliers = await storage.getDeletedSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Supplier statistics endpoint
  app.get("/api/admin/suppliers/stats", requireAdmin, async (req, res) => {
    try {
      const allSuppliers = await storage.getAllSuppliersForAdmin();
      const pendingSuppliers = await storage.getPendingSuppliersForAdmin();
      const rejectedSuppliers = await storage.getRejectedSuppliers();
      
      const total = allSuppliers.length;
      const approved = allSuppliers.filter(s => s.verified).length;
      const pending = pendingSuppliers.length;
      const rejected = rejectedSuppliers.length;
      const suspendedSuppliers = await storage.getSuspendedSuppliers();
      const deletedSuppliers = await storage.getDeletedSuppliers();
      const suspended = suspendedSuppliers.length;
      const deleted = deletedSuppliers.length;
      
      res.json({
        total,
        pending,
        approved,
        rejected,
        suspended,
        deleted
      });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Approve supplier endpoint
  app.post("/api/admin/suppliers/:id/approve", requireAdmin, async (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const supplier = await storage.verifySupplier(supplierId, true);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Restore rejected supplier endpoint
  app.post("/api/admin/suppliers/:id/restore", requireAdmin, async (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const supplier = await storage.restoreRejectedSupplier(supplierId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Product statistics endpoint
  app.get("/api/admin/products/stats", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getAllProductsForAdmin();
      const pendingProducts = await storage.getPendingProducts();
      const approvedProducts = await storage.getApprovedProducts();
      const rejectedProducts = await storage.getRejectedProducts();
      const suspendedProducts = await storage.getSuspendedProducts();
      
      const total = allProducts.length;
      const pending = pendingProducts.length;
      const approved = approvedProducts.length;
      const rejected = rejectedProducts.length;
      const suspended = suspendedProducts.length;
      
      res.json({
        total,
        pending,
        approved,
        rejected,
        suspended
      });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Get all products for admin
  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProductsForAdmin();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Approve product endpoint
  app.post("/api/admin/products/:id/approve", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const approvedBy = Number(req.headers['user-id']);
      
      if (!approvedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const product = await storage.approveProduct(productId, approvedBy);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Reject product endpoint  
  app.post("/api/admin/products/:id/reject", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const { reason } = req.body;
      const rejectedBy = Number(req.headers['user-id']);
      
      if (!rejectedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const product = await storage.rejectProduct(productId, rejectedBy, reason);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Suspend product endpoint
  app.post("/api/admin/products/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const { reason } = req.body;
      const suspendedBy = Number(req.headers['user-id']);
      
      if (!suspendedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const product = await storage.suspendProduct(productId, suspendedBy, reason);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Restore product endpoint (for rejected/suspended products)
  app.post("/api/admin/products/:id/restore", requireAdmin, async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await storage.restoreProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Admin inquiry management routes
  app.get("/api/admin/inquiries/pending", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getPendingInquiriesForAdmin();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/inquiries/:id/approve", requireAdmin, async (req, res) => {
    try {
      const inquiryId = Number(req.params.id);
      const approvedBy = Number(req.headers['user-id']);
      
      if (!approvedBy) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const inquiry = await storage.approveInquiry(inquiryId, approvedBy);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/inquiries/:id/reject", requireAdmin, async (req, res) => {
    try {
      const inquiryId = Number(req.params.id);
      const { reason } = req.body;
      
      const inquiry = await storage.rejectInquiry(inquiryId, reason);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/admin/suppliers/:id", requireAdmin, async (req, res) => {
    try {
      const supplierId = Number(req.params.id);
      const deleted = await storage.deleteSupplier(supplierId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier and all their products deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/buyers", requireAdmin, async (req, res) => {
    try {
      const buyers = await storage.getAllBuyersForAdmin();
      res.json(buyers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/buyers/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const buyerId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the buyer to verify ownership
      const buyer = await storage.getBuyerById(buyerId);
      if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      // Check if the user owns this buyer profile
      if (buyer.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const updateData = req.body;
      const updatedBuyer = await storage.updateBuyer(buyerId, updateData);
      
      res.json(updatedBuyer);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Restore rejected product (Admin only)
  app.post("/api/admin/products/:id/restore", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const adminId = 999; // Current admin ID
      
      const product = await storage.restoreRejectedProduct(productId, adminId);
      if (!product) {
        return res.status(404).json({ message: "Product not found or not rejected" });
      }
      
      res.json({ message: "Product restored successfully", product });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/admin/users/pending", requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUserApprovals();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const adminId = Number(req.headers['user-id']);
      
      if (!adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.approveUser(userId, adminId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      
      const success = await storage.rejectUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User rejected and removed from system" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Inquiry management endpoints
  app.get("/api/admin/inquiries/pending", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getPendingInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/inquiries/:id/approve", requireAdmin, async (req, res) => {
    try {
      const inquiryId = Number(req.params.id);
      const adminId = req.user.id;
      
      const inquiry = await storage.approveInquiry(inquiryId, adminId);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/inquiries/:id/reject", requireAdmin, async (req, res) => {
    try {
      const inquiryId = Number(req.params.id);
      const { reason } = req.body;
      
      const success = await storage.rejectInquiry(inquiryId, reason);
      
      if (!success) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json({ message: "Inquiry rejected" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Product Review routes
  app.post("/api/products/:productId/reviews", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const productId = Number(req.params.productId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if product exists
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check for duplicate review (one review per user per product - any status)
      const hasExistingReview = await storage.checkExistingReview(productId, userId);
      if (hasExistingReview) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }

      const reviewData = insertProductReviewSchema.parse({
        ...req.body,
        productId,
        userId,
      });

      const review = await storage.createProductReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/reviews/:reviewId", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const reviewId = Number(req.params.reviewId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const existingReview = await storage.getProductReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own reviews" });
      }

      // Use secure validation schema - only allow safe fields
      const updateData = updateProductReviewSchema.parse(req.body);
      const updatedReview = await storage.updateProductReview(reviewId, updateData);
      res.json(updatedReview);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/reviews/:reviewId", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const reviewId = Number(req.params.reviewId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const existingReview = await storage.getProductReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own reviews" });
      }

      const deleted = await storage.deleteProductReview(reviewId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Review Comment routes
  app.post("/api/reviews/:reviewId/comments", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const reviewId = Number(req.params.reviewId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify review exists and is approved
      const review = await storage.getProductReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      if (!review.isApproved) {
        return res.status(400).json({ message: "Cannot comment on unapproved review" });
      }

      const commentData = insertReviewCommentSchema.parse({
        ...req.body,
        reviewId,
        userId,
      });

      const comment = await storage.createReviewComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/reviews/:reviewId/comments", async (req, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const comments = await storage.getReviewComments(reviewId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.put("/api/comments/:commentId", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const commentId = Number(req.params.commentId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const existingComment = await storage.getReviewCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own comments" });
      }

      const updateData = updateReviewCommentSchema.parse(req.body);
      const updatedComment = await storage.updateReviewComment(commentId, updateData);
      res.json(updatedComment);
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/comments/:commentId", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const commentId = Number(req.params.commentId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const existingComment = await storage.getReviewCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }

      const deleted = await storage.deleteReviewComment(commentId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Admin Review Moderation routes
  app.get("/api/admin/reviews/pending", requireAdmin, async (req, res) => {
    try {
      // Get all reviews and filter unapproved ones
      const allReviews = Array.from((storage as any).productReviews.values())
        .filter((review: any) => !review.isApproved);
      res.json(allReviews);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/reviews/:reviewId/approve", requireAdmin, async (req, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const adminId = req.user.id;
      
      const approvedReview = await storage.approveProductReview(reviewId, adminId);
      if (!approvedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(approvedReview);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/admin/reviews/:reviewId", requireAdmin, async (req, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const deleted = await storage.deleteProductReview(reviewId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Admin Comment Moderation routes
  app.get("/api/admin/comments/pending", requireAdmin, async (req, res) => {
    try {
      // Get all comments and filter unapproved ones
      const allComments = Array.from((storage as any).reviewComments.values())
        .filter((comment: any) => !comment.isApproved);
      res.json(allComments);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/admin/comments/:commentId/approve", requireAdmin, async (req, res) => {
    try {
      const commentId = Number(req.params.commentId);
      const adminId = req.user.id;
      
      const approvedComment = await storage.approveReviewComment(commentId, adminId);
      if (!approvedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(approvedComment);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/admin/comments/:commentId", requireAdmin, async (req, res) => {
    try {
      const commentId = Number(req.params.commentId);
      const deleted = await storage.deleteReviewComment(commentId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const notificationId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = Number(req.headers['user-id']);
      const notificationId = Number(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const deleted = await storage.deleteNotification(notificationId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: (error instanceof Error ? error.message : "An error occurred") });
    }
  });

  // Test password reset email endpoint with detailed logging
  app.post('/api/auth/test-password-reset-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      console.log(`🔍 Testing password reset email to: ${email}`);
      console.log(`📧 Using sender: marketing@gtsmt.com`);

      const resetToken = generateVerificationToken();
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = generatePasswordResetEmail(email, resetLink);
      
      console.log(`📝 Email subject: ${emailContent.subject}`);
      console.log(`🔗 Reset link: ${resetLink}`);
      
      const emailResult = await sendEmail({
        to: email,
        name: email.split('@')[0],
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent
      });

      console.log(`📊 Email send result:`, emailResult);

      if (emailResult.success) {
        res.json({ 
          success: true, 
          message: `Test password reset email sent to ${email}`,
          resetLink: resetLink,
          sender: "marketing@gtsmt.com"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send email',
          error: emailResult.error,
          sender: "marketing@gtsmt.com"
        });
      }
    } catch (error: any) {
      console.error('❌ Test password reset email error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Test verification email endpoint with detailed logging
  app.post('/api/auth/test-verification-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      console.log(`🔍 Attempting to send test email to: ${email}`);
      console.log(`📧 Using sender: marketing@gtsmt.com`);

      const token = generateVerificationToken();
      const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${token}`;
      const emailContent = generateVerificationEmail(email.split('@')[0], verificationLink);
      
      console.log(`📝 Email subject: ${emailContent.subject}`);
      console.log(`🔗 Verification link: ${verificationLink}`);
      
      const emailResult = await sendEmail({
        to: email,
        name: email.split('@')[0],
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: emailContent.textContent
      });

      console.log(`📊 Email send result:`, emailResult);

      if (emailResult.success) {
        res.json({ 
          success: true, 
          message: `Test verification email sent to ${email}`,
          verificationLink: verificationLink,
          sender: "marketing@gtsmt.com"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send email',
          error: emailResult.error,
          sender: "marketing@gtsmt.com"
        });
      }
    } catch (error: any) {
      console.error('❌ Test email error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Setup direct verification routes for deployment compatibility
  setupVerificationRoutes(app);

  // Register SEO routes
  registerSEORoutes(app);

  // Image upload route (Super Admin only)
  app.post('/api/upload/image', requireSuperAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Generate the URL for the uploaded file
      const imageUrl = `/uploads/images/${req.file.filename}`;
      
      console.log('Image uploaded successfully:', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        url: imageUrl
      });

      res.json({ 
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // If it's a multer error, provide specific feedback
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Only one file allowed.' });
        }
        return res.status(400).json({ message: `Upload error: ${error.message}` });
      }
      
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Blog routes (Super Admin only)
  app.get('/api/blog', async (req, res) => {
    try {
      const { status } = req.query;
      const posts = await storage.getBlogPosts(status as string);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    }
  });

  app.get('/api/blog/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPostById(id);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });

  app.get('/api/blog/slug/:slug', async (req, res) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostWithAuthor(slug);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });

  app.post('/api/blog', requireSuperAdmin, async (req, res) => {
    try {
      const blogPostData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost({
        ...blogPostData,
        authorId: req.user.id,
      });
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      console.error('Request user:', req.user);
      console.error('Request body:', req.body);
      res.status(500).json({ message: 'Failed to create blog post' });
    }
  });

  app.put('/api/blog/:id', requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const blogPostData = insertBlogPostSchema.partial().parse(req.body);
      const post = await storage.updateBlogPost(id, blogPostData);
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });

  app.delete('/api/blog/:id', requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });

  app.post('/api/blog/:id/publish', requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.publishBlogPost(id);
      res.json(post);
    } catch (error) {
      console.error('Error publishing blog post:', error);
      res.status(500).json({ message: 'Failed to publish blog post' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
