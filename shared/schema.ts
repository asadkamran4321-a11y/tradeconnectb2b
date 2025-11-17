import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'supplier', 'buyer', or 'admin'
  approved: boolean("approved").default(false), // Requires admin approval
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved
  approvedAt: timestamp("approved_at"),
  emailVerified: boolean("email_verified").default(false), // Email verification status
  emailVerificationToken: text("email_verification_token"), // Token for email verification
  emailVerificationExpires: timestamp("email_verification_expires"), // Token expiration
  passwordResetToken: text("password_reset_token"), // Token for password reset
  passwordResetExpires: timestamp("password_reset_expires"), // Reset token expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  description: text("description"),
  location: text("location"),
  website: text("website"),
  phone: text("phone"),
  verified: boolean("verified").default(false),
  rating: numeric("rating", { precision: 2, scale: 1 }).default('0.0'),
  profileImage: text("profile_image"),
  
  // Company Information
  businessRegistrationNumber: text("business_registration_number"),
  countryOfRegistration: text("country_of_registration"),
  cityOfRegistration: text("city_of_registration"),
  yearEstablished: integer("year_established"),
  legalEntityType: text("legal_entity_type"),
  vatTaxId: text("vat_tax_id"),
  registeredBusinessAddress: text("registered_business_address"),
  
  // Contact Information
  primaryContactName: text("primary_contact_name"),
  contactJobTitle: text("contact_job_title"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  companyWebsite: text("company_website"),
  whatsappNumber: text("whatsapp_number"),
  socialMediaLinkedIn: text("social_media_linkedin"),
  socialMediaYoutube: text("social_media_youtube"),
  socialMediaFacebook: text("social_media_facebook"),
  socialMediaTiktok: text("social_media_tiktok"),
  socialMediaInstagram: text("social_media_instagram"),
  socialMediaPinterest: text("social_media_pinterest"),
  socialMediaX: text("social_media_x"),
  
  // Main Product Category
  mainProductCategory: text("main_product_category"),
  
  // Compliance & Legal
  businessLicenseUrl: text("business_license_url"),
  businessLicenseFileName: text("business_license_file_name"),
  productCertificationsUrl: text("product_certifications_url"),
  productCertificationsFileName: text("product_certifications_file_name"),
  exportImportLicenseUrl: text("export_import_license_url"),
  exportImportLicenseFileName: text("export_import_license_name"),
  
  // Additional Company Info
  companyProfileUrl: text("company_profile_url"),
  companyProfileFileName: text("company_profile_file_name"),
  companyLogoUrl: text("company_logo_url"),
  companyLogoFileName: text("company_logo_file_name"),
  factoryPhotosUrl: text("factory_photos_url"),
  factoryPhotosFileName: text("factory_photos_file_name"),
  introVideoUrl: text("intro_video_url"),
  auditReportsUrl: text("audit_reports_url"),
  auditReportsFileName: text("audit_reports_file_name"),
  
  // Shipping Methods
  shippingMethods: text("shipping_methods").array(),
  incotermsSupported: text("incoterms_supported").array(),
  regionsShippedTo: text("regions_shipped_to").array(),
  
  // References
  keyClients: text("key_clients").array(),
  testimonials: text("testimonials"),
  
  // Onboarding status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(1),
  profileDraftData: text("profile_draft_data"), // JSON string for draft saving
  
  // Agreement flags
  agreesToTerms: boolean("agrees_to_terms").default(false),
  agreesToPrivacy: boolean("agrees_to_privacy").default(false),
  declaresInfoAccurate: boolean("declares_info_accurate").default(false),
  
  // Status tracking
  status: text("status").default('active'), // 'active', 'rejected', 'suspended', 'deleted'
  rejectedBy: integer("rejected_by").references(() => users.id), // Admin who rejected
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  suspendedBy: integer("suspended_by").references(() => users.id), // Admin who suspended
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  deletedBy: integer("deleted_by").references(() => users.id), // Admin who deleted
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const buyers = pgTable("buyers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  description: text("description"),
  location: text("location"),
  website: text("website"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  image: text("image"), // Category banner/image
  description: text("description"),
  parentId: integer("parent_id").references(() => categories.id), // For subcategories
  productCount: integer("product_count").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  price: numeric("price", { precision: 10, scale: 2 }),
  minPrice: numeric("min_price", { precision: 10, scale: 2 }),
  maxPrice: numeric("max_price", { precision: 10, scale: 2 }),
  minOrder: integer("min_order").default(1),
  unit: text("unit").default("piece"),
  images: text("images").array(),
  videoUrl: text("video_url"),
  specifications: text("specifications"),
  
  // B2B Product Details
  materials: text("materials"),
  color: text("color"),
  size: text("size"),
  weight: text("weight"),
  dimensions: text("dimensions"),
  
  // Shipping and Trade Terms
  shippingTerms: text("shipping_terms"),
  incoterms: text("incoterms"),
  packagingDetails: text("packaging_details"),
  leadTime: text("lead_time"),
  paymentTerms: text("payment_terms"),
  
  // Certifications and Quality
  certifications: text("certifications").array(),
  qualityGrade: text("quality_grade"),
  origin: text("origin"),
  
  // Supply Information
  supplyCapacity: text("supply_capacity"),
  moq: integer("moq"), // Minimum Order Quantity
  
  views: integer("views").default(0),
  inquiries: integer("inquiries").default(0),
  rating: numeric("rating", { precision: 2, scale: 1 }).default('0.0'),
  
  // Admin Review System
  status: text("status").default("pending"), // pending, approved, rejected, suspended, draft, deleted
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Rejection System
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Suspension System
  suspendedBy: integer("suspended_by").references(() => users.id),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  
  // Recovery System
  restoredBy: integer("restored_by").references(() => users.id),
  restoredAt: timestamp("restored_at"),
  
  // URL Fetching
  sourceUrl: text("source_url"), // URL from where product was fetched
  
  // Soft delete for supplier management
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => buyers.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  quantity: integer("quantity"),
  status: text("status").default("pending"), // pending, approved, rejected, replied, closed
  
  // Admin approval system
  adminApprovalStatus: text("admin_approval_status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Supplier reply
  supplierReply: text("supplier_reply"),
  repliedAt: timestamp("replied_at"),
  
  // Buyer reply
  buyerReply: text("buyer_reply"),
  buyerRepliedAt: timestamp("buyer_replied_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedProducts = pgTable("saved_products", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => buyers.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followedSuppliers = pgTable("followed_suppliers", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => buyers.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'product_approved', 'product_rejected', 'inquiry_received', 'supplier_approved', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // Optional URL for action button
  actionText: text("action_text"), // Optional text for action button
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false), // Admin approval
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviewComments = pgTable("review_comments", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => productReviews.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  isApproved: boolean("is_approved").default(false), // Admin approval
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, userId: true });
export const insertBuyerSchema = createInsertSchema(buyers).omit({ id: true, createdAt: true, userId: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true, 
  productCount: true, 
  createdAt: true,
  createdBy: true 
});
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, views: true, inquiries: true, rating: true, status: true, reviewedBy: true, reviewedAt: true, reviewNotes: true, deletedAt: true, deletedBy: true });
export const insertInquirySchema = createInsertSchema(inquiries).omit({ id: true, createdAt: true, status: true, adminApprovalStatus: true, approvedBy: true, approvedAt: true, rejectionReason: true, supplierReply: true, repliedAt: true, buyerReply: true, buyerRepliedAt: true });
export const insertSavedProductSchema = createInsertSchema(savedProducts).omit({ id: true, createdAt: true });
export const insertFollowedSupplierSchema = createInsertSchema(followedSuppliers).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, readAt: true });
export const insertProductReviewSchema = createInsertSchema(productReviews).omit({ id: true, createdAt: true, updatedAt: true, isApproved: true, approvedBy: true, approvedAt: true }).extend({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5")
});
export const insertReviewCommentSchema = createInsertSchema(reviewComments).omit({ id: true, createdAt: true, updatedAt: true, isApproved: true, approvedBy: true, approvedAt: true });

// Update schemas that only allow safe fields
export const updateProductReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const updateReviewCommentSchema = z.object({
  comment: z.string().min(1).max(1000),
});

// Types
export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Buyer = typeof buyers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type SavedProduct = typeof savedProducts.$inferSelect;
export type FollowedSupplier = typeof followedSuppliers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type ReviewComment = typeof reviewComments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InsertSavedProduct = z.infer<typeof insertSavedProductSchema>;
export type InsertFollowedSupplier = z.infer<typeof insertFollowedSupplierSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type InsertReviewComment = z.infer<typeof insertReviewCommentSchema>;

// Admin Notifications Table
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'new_supplier', 'new_buyer', 'new_product', 'new_user_registration'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of the related entity (supplier, buyer, product, user)
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications);
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// Supplier Onboarding Schema for comprehensive profile management
export const supplierOnboardingSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationNumber: z.string().min(1, "Business registration number is required"),
  countryOfRegistration: z.string().min(1, "Country of registration is required"),
  cityOfRegistration: z.string().min(1, "City of registration is required"),
  yearEstablished: z.number().min(1800, "Please enter a valid year").max(new Date().getFullYear(), "Year cannot be in the future"),
  legalEntityType: z.string().min(1, "Legal entity type is required"),
  registeredBusinessAddress: z.string().min(1, "Registered business address is required"),
  vatTaxId: z.string().optional(),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  contactJobTitle: z.string().min(1, "Contact job title is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  companyWebsite: z.string().min(1, "Company website is required"),
  whatsappNumber: z.string().optional(),
  socialMediaLinkedIn: z.string().optional(),
  socialMediaYoutube: z.string().optional(),
  socialMediaFacebook: z.string().optional(),
  socialMediaTiktok: z.string().optional(),
  socialMediaInstagram: z.string().optional(),
  socialMediaPinterest: z.string().optional(),
  socialMediaX: z.string().optional(),
  mainProductCategory: z.string().min(1, "Main product category is required"),
  businessLicenseUrl: z.string().min(1, "Business license is required"),
  businessLicenseFileName: z.string().optional(),
  productCertificationsUrl: z.string().optional(),
  productCertificationsFileName: z.string().optional(),
  exportImportLicenseUrl: z.string().optional(),
  exportImportLicenseFileName: z.string().optional(),
  companyProfileUrl: z.string().optional(),
  companyProfileFileName: z.string().optional(),
  factoryPhotosUrl: z.string().optional(),
  factoryPhotosFileName: z.string().optional(),
  introVideoUrl: z.string().optional(),
  introVideoFileName: z.string().optional(),
  agreesToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms of Service" }) }),
  agreesToPrivacy: z.literal(true, { errorMap: () => ({ message: "You must agree to the Privacy Policy" }) }),
  declaresInfoAccurate: z.literal(true, { errorMap: () => ({ message: "You must declare that information is accurate" }) }),
});

export type SupplierOnboardingData = z.infer<typeof supplierOnboardingSchema>;

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  status: text("status").default("draft").notNull(), // draft, published, archived
  authorId: integer("author_id").references(() => users.id).notNull(),
  tags: text("tags").array(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.array(z.string()).optional(),
}).omit({ id: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true });

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
