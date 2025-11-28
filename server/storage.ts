import { 
  users, suppliers, buyers, categories, products, inquiries, savedProducts, followedSuppliers, notifications, adminNotifications, blogPosts, productReviews, reviewComments,
  type User, type Supplier, type Buyer, type Category, type Product, type Inquiry, 
  type SavedProduct, type FollowedSupplier, type Notification, type AdminNotification, type BlogPost, type ProductReview, type ReviewComment,
  type InsertUser, type InsertSupplier, type InsertBuyer, type InsertCategory, 
  type InsertProduct, type InsertInquiry, type InsertSavedProduct, type InsertFollowedSupplier,
  type InsertNotification, type InsertAdminNotification, type InsertBlogPost, type InsertProductReview, type InsertReviewComment
} from "@shared/schema";
import admin from "firebase-admin";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSupplierById(id: number): Promise<Supplier | undefined>;
  getSupplierByUserId(userId: number): Promise<Supplier | undefined>;
  getSuppliers(search?: string, location?: string): Promise<Supplier[]>;
  updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier | undefined>;
  suspendSupplier(supplierId: number, suspendedBy?: number, reason?: string): Promise<boolean>;
  activateSupplier(supplierId: number): Promise<boolean>;
  restoreRejectedSupplier(supplierId: number, restoredBy?: number): Promise<boolean>;

  // Buyer operations
  createBuyer(buyer: InsertBuyer): Promise<Buyer>;
  getBuyerById(id: number): Promise<Buyer | undefined>;
  getBuyerByUserId(userId: number): Promise<Buyer | undefined>;
  getBuyers(): Promise<Buyer[]>;
  getAllBuyers(): Promise<Buyer[]>;
  updateBuyer(id: number, data: Partial<Buyer>): Promise<Buyer | undefined>;
  suspendBuyer(buyerId: number, reason: string): Promise<boolean>;
  activateBuyer(buyerId: number): Promise<boolean>;
  deleteBuyer(buyerId: number): Promise<boolean>;

  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getSubcategories(parentId: number): Promise<Category[]>;
  getCategoriesWithSubcategories(): Promise<Category[]>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProductById(id: number): Promise<Product | undefined>;
  getProducts(filters?: { categoryId?: number; supplierId?: number; search?: string; minPrice?: number; maxPrice?: number; sortBy?: string }): Promise<Product[]>;
  getProductsBySupplier(supplierId: number, includeDeleted?: boolean): Promise<Product[]>;
  getDraftProductsBySupplier(supplierId: number): Promise<Product[]>;
  getDeletedProductsBySupplier(supplierId: number): Promise<Product[]>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  softDeleteProduct(id: number, deletedBy: number): Promise<boolean>;
  recoverProduct(id: number): Promise<boolean>;
  saveDraftProduct(product: InsertProduct): Promise<Product>;
  publishDraftProduct(id: number): Promise<Product | undefined>;
  restoreRejectedProduct(id: number, restoredBy: number): Promise<Product | undefined>;
  incrementProductViews(id: number): Promise<void>;
  incrementProductInquiries(id: number): Promise<void>;
  // Admin product management (wrapper methods)
  approveProduct(id: number, approvedBy?: number, notes?: string): Promise<Product | undefined>;
  rejectProduct(id: number, rejectedBy?: number, notes?: string): Promise<boolean>;
  restoreProduct(id: number, restoredBy?: number): Promise<Product | undefined>;
  getAllProductsForAdmin(): Promise<Product[]>;
  getApprovedProducts(): Promise<Product[]>;
  getSuspendedProducts(): Promise<Product[]>;
  suspendProduct(productId: number, suspendedBy: number, reason?: string): Promise<Product | undefined>;
  unsuspendProduct(productId: number): Promise<Product | undefined>;

  // Inquiry operations
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesByBuyer(buyerId: number): Promise<Inquiry[]>;
  getInquiriesBySupplier(supplierId: number): Promise<Inquiry[]>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  updateInquiry(id: number, data: Partial<Inquiry>): Promise<Inquiry | undefined>;
  getAllInquiries(): Promise<Inquiry[]>;
  getPendingInquiries(): Promise<any[]>;
  getPendingInquiriesForAdmin(): Promise<any[]>;
  getApprovedInquiries(): Promise<Inquiry[]>;
  getRejectedInquiries(): Promise<Inquiry[]>;
  approveInquiry(inquiryId: number, adminId?: number): Promise<Inquiry | undefined>;
  rejectInquiry(inquiryId: number, reason: string): Promise<boolean>;
  replyToInquiry(id: number, reply: string): Promise<Inquiry | undefined>;
  buyerReplyToInquiry(id: number, reply: string): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<Inquiry | undefined>;
  recoverInquiry(id: number): Promise<Inquiry | undefined>;

  // Saved products operations
  saveLikeProduct(data: InsertSavedProduct): Promise<SavedProduct>;
  getSavedProductsByBuyer(buyerId: number): Promise<SavedProduct[]>;
  removeSavedProduct(buyerId: number, productId: number): Promise<boolean>;

  // Follow supplier operations
  followSupplier(data: InsertFollowedSupplier): Promise<FollowedSupplier>;
  getFollowedSuppliersByBuyer(buyerId: number): Promise<FollowedSupplier[]>;
  unfollowSupplier(buyerId: number, supplierId: number): Promise<boolean>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  deleteNotification(notificationId: number): Promise<boolean>;

  // Admin Notification operations
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(): Promise<AdminNotification[]>;
  getAdminNotificationCounts(): Promise<{ suppliers: number; buyers: number; products: number; users: number }>;
  markAdminNotificationAsRead(notificationId: number): Promise<AdminNotification | undefined>;

  // Dashboard statistics
  getSupplierStats(supplierId: number): Promise<{
    totalProducts: number;
    activeInquiries: number;
    profileViews: number;
    rating: number;
  }>;
  getBuyerStats(buyerId: number): Promise<{
    savedProducts: number;
    activeInquiries: number;
    followingSuppliers: number;
    successfulOrders: number;
  }>;

  // Admin operations
  getAdminStats(): Promise<{
    totalSuppliers: number;
    verifiedSuppliers: number;
    totalBuyers: number;
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    rejectedProducts: number;
    rejectedSuppliers: number;
  }>;
  getPendingProducts(): Promise<Product[]>;
  getRejectedProducts(): Promise<Product[]>;
  reviewProduct(productId: number, action: 'approve' | 'reject', reviewedBy: number, notes?: string): Promise<Product | undefined>;
  deleteProduct(productId: number): Promise<boolean>;
  verifySupplier(supplierId: number, verified: boolean): Promise<Supplier | undefined>;
  rejectSupplier(supplierId: number, rejectedBy: number, reason?: string): Promise<Supplier | undefined>;
  getRejectedSuppliers(): Promise<Supplier[]>;
  getSuspendedSuppliers(): Promise<Supplier[]>;
  getDeletedSuppliers(): Promise<Supplier[]>;
  restoreSupplier(supplierId: number): Promise<Supplier | undefined>;
  deleteSupplier(supplierId: number, deletedBy?: number): Promise<boolean>;
  getAllSuppliersForAdmin(): Promise<Supplier[]>;
  getPendingSuppliersForAdmin(): Promise<any[]>;
  getAllBuyersForAdmin(): Promise<Buyer[]>;
  getPendingUserApprovals(): Promise<User[]>;
  approveUser(userId: number, approvedBy: number): Promise<User | undefined>;
  rejectUser(userId: number): Promise<boolean>;

  // Blog post operations
  createBlogPost(blogPost: InsertBlogPost & { authorId: number }): Promise<BlogPost>;
  getBlogPosts(status?: string): Promise<BlogPost[]>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostWithAuthor(slug: string): Promise<(BlogPost & { author?: { id: number; email: string; name?: string } }) | undefined>;
  updateBlogPost(id: number, blogPost: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  publishBlogPost(id: number): Promise<BlogPost>;

  // Product Review operations
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  getProductReviews(productId: number): Promise<ProductReview[]>;
  getProductReviewById(id: number): Promise<ProductReview | undefined>;
  updateProductReview(id: number, updates: Partial<ProductReview>): Promise<ProductReview | undefined>;
  deleteProductReview(id: number): Promise<boolean>;
  approveProductReview(id: number, approvedBy: number): Promise<ProductReview | undefined>;
  updateProductRating(productId: number): Promise<void>;

  // Review Comment operations
  createReviewComment(comment: InsertReviewComment): Promise<ReviewComment>;
  getReviewComments(reviewId: number): Promise<ReviewComment[]>;
  getReviewCommentById(id: number): Promise<ReviewComment | undefined>;
  updateReviewComment(id: number, updates: Partial<ReviewComment>): Promise<ReviewComment | undefined>;
  deleteReviewComment(id: number): Promise<boolean>;
  approveReviewComment(id: number, approvedBy: number): Promise<ReviewComment | undefined>;
  checkExistingReview(productId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private supplierProfiles: Map<number, any> = new Map();
  private buyerProfiles: Map<number, any> = new Map();
  private categories: Map<number, Category> = new Map();
  private products: Map<number, any> = new Map();
  private inquiries: Map<number, any> = new Map();
  private savedProducts: Map<number, SavedProduct> = new Map();
  private followedSuppliers: Map<number, FollowedSupplier> = new Map();
  private notifications: Map<number, Notification> = new Map();
  private adminNotifications: Map<number, AdminNotification> = new Map();
  private blogPosts: Map<number, BlogPost> = new Map();
  private productReviews: Map<number, ProductReview> = new Map();
  private reviewComments: Map<number, ReviewComment> = new Map();

  private currentUserId = 1;
  private currentSupplierProfileId = 1;
  private currentBuyerProfileId = 1;
  private categoryIdCounter = 1;
  private currentProductId = 1;
  private currentInquiryId = 1;
  private savedProductIdCounter = 1;
  private followedSupplierIdCounter = 1;
  private currentNotificationId = 1;
  private currentAdminNotificationId = 1;
  private currentBlogPostId = 1;
  private currentReviewId = 1;
  private currentReviewCommentId = 1;

  constructor() {}

  private initializeData() {
    // Initialize some categories
    const defaultCategories = [
      { name: "Electronics", icon: "fas fa-microchip" },
      { name: "Machinery", icon: "fas fa-cogs" },
      { name: "Textiles", icon: "fas fa-tshirt" },
      { name: "Chemicals", icon: "fas fa-flask" },
      { name: "Automotive", icon: "fas fa-car" },
      { name: "Food & Beverage", icon: "fas fa-utensils" }
    ];

    defaultCategories.forEach(cat => {
      this.createCategory({
        name: cat.name,
        icon: cat.icon
      } as any);
    });
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.emailVerificationToken === token);
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.passwordResetToken === token);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // Delete associated supplier profile if exists
    const supplier = await this.getSupplierByUserId(id);
    if (supplier) {
      this.supplierProfiles.delete(supplier.id);
    }

    // Delete associated buyer profile if exists
    const buyer = await this.getBuyerByUserId(id);
    if (buyer) {
      this.buyerProfiles.delete(buyer.id);
    }

    // Delete the user
    this.users.delete(id);
    return true;
  }

  // Supplier operations
  async createSupplier(supplier: InsertSupplier & { userId: number }): Promise<Supplier> {
    const newSupplier: Supplier = {
      ...supplier,
      id: this.currentSupplierProfileId++,
      verified: false,
      rating: '0.0',
      status: 'active',
      createdAt: new Date(),
      description: supplier.description || null,
      location: supplier.location || null,
      website: supplier.website || null,
      companyWebsite: (supplier as any).companyWebsite ?? null,
      phone: supplier.phone || null,
      profileImage: supplier.profileImage || null,
      userId: supplier.userId,
      // Company Information
      businessRegistrationNumber: supplier.businessRegistrationNumber || null,
      countryOfRegistration: supplier.countryOfRegistration || null,
      cityOfRegistration: supplier.cityOfRegistration || null,
      yearEstablished: supplier.yearEstablished || null,
      legalEntityType: supplier.legalEntityType || null,
      vatTaxId: supplier.vatTaxId || null,
      registeredBusinessAddress: supplier.registeredBusinessAddress || null,
      // Contact Information
      primaryContactName: supplier.primaryContactName || null,
      contactJobTitle: supplier.contactJobTitle || null,
      contactEmail: supplier.contactEmail || null,
      contactPhone: supplier.contactPhone || null,
      socialMediaLinkedIn: supplier.socialMediaLinkedIn || null,
      whatsappNumber: supplier.whatsappNumber || null,
      socialMediaYoutube: (supplier as any).socialMediaYoutube ?? null,
      socialMediaFacebook: (supplier as any).socialMediaFacebook ?? null,
      socialMediaTiktok: (supplier as any).socialMediaTiktok ?? null,
      socialMediaInstagram: (supplier as any).socialMediaInstagram ?? null,
      socialMediaPinterest: (supplier as any).socialMediaPinterest ?? null,
      socialMediaX: (supplier as any).socialMediaX ?? null,
      // Main Product Category
      mainProductCategory: supplier.mainProductCategory || null,
      // Compliance & Legal
      businessLicenseUrl: supplier.businessLicenseUrl || null,
      businessLicenseFileName: (supplier as any).businessLicenseFileName ?? null,
      productCertificationsUrl: supplier.productCertificationsUrl || null,
      productCertificationsFileName: (supplier as any).productCertificationsFileName ?? null,
      exportImportLicenseUrl: supplier.exportImportLicenseUrl || null,
      exportImportLicenseFileName: (supplier as any).exportImportLicenseFileName ?? null,
      // Additional Company Info
      companyProfileUrl: supplier.companyProfileUrl || null,
      companyProfileFileName: (supplier as any).companyProfileFileName ?? null,
      companyLogoUrl: supplier.companyLogoUrl || null,
      companyLogoFileName: (supplier as any).companyLogoFileName ?? null,
      factoryPhotosUrl: supplier.factoryPhotosUrl || null,
      factoryPhotosFileName: (supplier as any).factoryPhotosFileName ?? null,
      introVideoUrl: supplier.introVideoUrl || null,
      auditReportsUrl: supplier.auditReportsUrl || null,
      auditReportsFileName: (supplier as any).auditReportsFileName ?? null,
      // Shipping Methods
      shippingMethods: supplier.shippingMethods || [],
      incotermsSupported: supplier.incotermsSupported || [],
      regionsShippedTo: supplier.regionsShippedTo || [],
      // References
      keyClients: supplier.keyClients || [],
      testimonials: supplier.testimonials || null,
      // Onboarding status
      onboardingCompleted: supplier.onboardingCompleted || false,
      onboardingStep: supplier.onboardingStep || 1,
      profileDraftData: supplier.profileDraftData ?? null,
      agreesToTerms: (supplier as any).agreesToTerms ?? false,
      agreesToPrivacy: (supplier as any).agreesToPrivacy ?? false,
      declaresInfoAccurate: (supplier as any).declaresInfoAccurate ?? false,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      suspensionReason: null,
      deletedBy: null,
      deletedAt: null,
    };
    this.supplierProfiles.set(newSupplier.id, newSupplier);

    // Create admin notification for new supplier
    this.createAdminNotification({
      type: 'new_supplier',
      title: 'New Supplier Registration',
      message: `New supplier profile created: ${newSupplier.companyName}`,
      relatedId: newSupplier.id,
    });

    return newSupplier;
  }

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    return this.supplierProfiles.get(id);
  }

  async getSupplierByUserId(userId: number): Promise<Supplier | undefined> {
    return Array.from(this.supplierProfiles.values()).find(supplier => supplier.userId === userId);
  }

  async getSuppliers(search?: string, location?: string): Promise<Supplier[]> {
    let suppliers = Array.from(this.supplierProfiles.values());
    
    if (search) {
      suppliers = suppliers.filter(s => 
        s.companyName.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (location) {
      suppliers = suppliers.filter(s => s.location?.toLowerCase().includes(location.toLowerCase()));
    }
    
    return suppliers;
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = this.supplierProfiles.get(id);
    if (!supplier) return undefined;
    
    const updated = { ...supplier, ...data };
    this.supplierProfiles.set(id, updated);
    return updated;
  }

  async updateSupplierByUserId(userId: number, data: Partial<Supplier>): Promise<Supplier | null> {
    const supplier = Array.from(this.supplierProfiles.values()).find(s => s.userId === userId);
    if (!supplier) return null;
    
    const updated = { ...supplier, ...data };
    this.supplierProfiles.set(supplier.id, updated);
    return updated;
  }

  // Buyer operations
  async createBuyer(buyer: InsertBuyer & { userId: number }): Promise<Buyer> {
    const newBuyer: Buyer = {
      ...buyer,
      id: this.currentBuyerProfileId++,
      createdAt: new Date(),
      description: buyer.description || null,
      location: buyer.location || null,
      website: buyer.website || null,
      phone: buyer.phone || null,
      profileImage: buyer.profileImage || null,
      userId: buyer.userId,
    };
    this.buyerProfiles.set(newBuyer.id, newBuyer);

    // Create admin notification for new buyer
    this.createAdminNotification({
      type: 'new_buyer',
      title: 'New Buyer Registration',
      message: `New buyer profile created: ${newBuyer.companyName}`,
      relatedId: newBuyer.id,
    });

    return newBuyer;
  }

  async getBuyerById(id: number): Promise<Buyer | undefined> {
    return this.buyerProfiles.get(id);
  }

  async getBuyerByUserId(userId: number): Promise<Buyer | undefined> {
    return Array.from(this.buyerProfiles.values()).find(buyer => buyer.userId === userId);
  }

  async getBuyers(): Promise<Buyer[]> {
    return Array.from(this.buyerProfiles.values());
  }

  async updateBuyer(id: number, data: Partial<Buyer>): Promise<Buyer | undefined> {
    const buyer = this.buyerProfiles.get(id);
    if (!buyer) return undefined;
    
    const updated = { ...buyer, ...data };
    this.buyerProfiles.set(id, updated);
    return updated;
  }

  async getAllBuyers(): Promise<any[]> {
    return Array.from(this.buyerProfiles.values()).map(buyer => ({
      ...buyer,
      status: 'active',
      inquiryCount: Array.from(this.inquiries.values()).filter(i => i.buyerId === buyer.id).length,
      savedProductCount: Array.from(this.savedProducts.values()).filter(s => s.buyerId === buyer.id).length,
    }));
  }

  async suspendBuyer(buyerId: number, reason: string): Promise<boolean> {
    const buyer = Array.from(this.buyerProfiles.values()).find(b => b.id === buyerId);
    if (!buyer) return false;
    
    const updated = { ...buyer, status: 'suspended' };
    this.buyerProfiles.set(buyer.id, updated);
    return true;
  }

  async activateBuyer(buyerId: number): Promise<boolean> {
    const buyer = Array.from(this.buyerProfiles.values()).find(b => b.id === buyerId);
    if (!buyer) return false;
    
    const updated = { ...buyer, status: 'active' };
    this.buyerProfiles.set(buyer.id, updated);
    return true;
  }

  async deleteBuyer(buyerId: number): Promise<boolean> {
    const buyer = Array.from(this.buyerProfiles.values()).find(b => b.id === buyerId);
    if (!buyer) return false;
    
    // Delete associated data
    const savedProducts = Array.from(this.savedProducts.values()).filter(s => s.buyerId === buyerId);
    savedProducts.forEach(sp => this.savedProducts.delete(sp.id));
    
    const followedSuppliers = Array.from(this.followedSuppliers.values()).filter(fs => fs.buyerId === buyerId);
    followedSuppliers.forEach(fs => this.followedSuppliers.delete(fs.id));
    
    const inquiries = Array.from(this.inquiries.values()).filter(i => i.buyerId === buyerId);
    inquiries.forEach(inq => this.inquiries.delete(inq.id));
    
    const notifications = Array.from(this.notifications.values()).filter(n => n.userId === buyer.userId);
    notifications.forEach(notif => this.notifications.delete(notif.id));
    
    // Delete buyer profile
    this.buyerProfiles.delete(buyer.id);
    
    // Delete user account
    this.users.delete(buyer.userId);
    
    return true;
  }

  async suspendSupplier(supplierId: number, suspendedBy: number, reason: string): Promise<boolean> {
    const supplier = Array.from(this.supplierProfiles.values()).find(s => s.id === supplierId);
    if (!supplier) return false;
    
    const updated = { 
      ...supplier, 
      status: 'suspended',
      suspendedBy,
      suspendedAt: new Date(),
      suspensionReason: reason
    };
    this.supplierProfiles.set(supplier.id, updated);
    
    // Send suspension notification to supplier
    await this.createNotification({
      userId: supplier.userId,
      type: 'profile_suspended',
      title: 'Account Suspended',
      message: `Your supplier account has been suspended. ${reason ? `Reason: ${reason}` : ''} Please contact support if you have questions.`,
      actionUrl: '/contact-support',
      actionText: 'Contact Support',
    });
    
    return true;
  }

  async activateSupplier(supplierId: number): Promise<boolean> {
    const supplier = Array.from(this.supplierProfiles.values()).find(s => s.id === supplierId);
    if (!supplier) return false;
    
    const updated = { ...supplier, status: 'active' };
    this.supplierProfiles.set(supplier.id, updated);
    return true;
  }

  async restoreRejectedSupplier(supplierId: number, restoredBy?: number): Promise<boolean> {
    const supplier = Array.from(this.supplierProfiles.values()).find(s => s.id === supplierId);
    if (!supplier) return false;
    
    const updated = { 
      ...supplier, 
      rejected: false, 
      rejectedBy: null, 
      rejectionReason: null, 
      verified: false 
    };
    this.supplierProfiles.set(supplier.id, updated);
    return true;
  }

  // Admin product management wrapper methods
  async approveProduct(id: number, approvedBy?: number, notes?: string): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { 
      ...product, 
      adminReviewStatus: 'approved' as const,
      reviewedAt: new Date(),
      reviewedBy: approvedBy || null,
      reviewNotes: notes || null,
      updatedAt: new Date()
    };
    this.products.set(id, updated);
    return updated;
  }

  async rejectProduct(id: number, rejectedBy?: number, notes?: string): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updated = { 
      ...product, 
      adminReviewStatus: 'rejected' as const,
      reviewedAt: new Date(),
      reviewedBy: rejectedBy || null,
      reviewNotes: notes || null,
      updatedAt: new Date()
    };
    this.products.set(id, updated);
    return true;
  }

  async restoreProduct(id: number, restoredBy?: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = {
      ...product,
      status: 'pending',
      deletedAt: null,
      deletedBy: null,
      restoredBy: restoredBy ?? null,
      restoredAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async getAllProductsForAdmin(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Category operations
  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: this.categoryIdCounter++,
      productCount: 0,
      icon: category.icon || null,
      image: category.image || null,
      description: category.description || null,
      parentId: category.parentId || null,
      isActive: category.isActive !== undefined ? category.isActive : true,
      sortOrder: category.sortOrder || 0,
      createdAt: new Date(),
      createdBy: category.createdBy || null,
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.isActive);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Check if category has subcategories
    const hasSubcategories = Array.from(this.categories.values()).some(c => c.parentId === id);
    if (hasSubcategories) {
      return false; // Cannot delete category with subcategories
    }
    
    // Check if category has products
    const hasProducts = Array.from(this.products.values()).some(p => p.categoryId === id);
    if (hasProducts) {
      // Soft delete by setting isActive to false
      const category = this.categories.get(id);
      if (category) {
        category.isActive = false;
        this.categories.set(id, category);
      }
      return true;
    }
    
    // Hard delete if no products
    return this.categories.delete(id);
  }

  async getSubcategories(parentId: number): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(c => c.parentId === parentId && c.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getCategoriesWithSubcategories(): Promise<Category[]> {
    const mainCategories = Array.from(this.categories.values())
      .filter(c => !c.parentId && c.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    return mainCategories;
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: this.currentProductId++,
      views: 0,
      inquiries: 0,
      rating: '0.0',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date(),
      description: product.description || null,
      categoryId: product.categoryId || null,
      price: product.price || null,
      minPrice: product.minPrice || null,
      maxPrice: product.maxPrice || null,
      minOrder: product.minOrder || 1,
      unit: product.unit || 'piece',
      images: product.images || [],
      specifications: product.specifications || null,
      materials: (product as any).materials ?? null,
      color: (product as any).color ?? null,
      size: (product as any).size ?? null,
      weight: (product as any).weight ?? null,
      dimensions: (product as any).dimensions ?? null,
      shippingTerms: (product as any).shippingTerms ?? null,
      incoterms: (product as any).incoterms ?? null,
      packagingDetails: (product as any).packagingDetails ?? null,
      leadTime: (product as any).leadTime ?? null,
      paymentTerms: (product as any).paymentTerms ?? null,
      certifications: (product as any).certifications ?? [],
      qualityGrade: (product as any).qualityGrade ?? null,
      origin: (product as any).origin ?? null,
      supplyCapacity: (product as any).supplyCapacity ?? null,
      moq: product.moq ?? null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      suspensionReason: null,
      restoredBy: null,
      restoredAt: null,
      sourceUrl: (product as any).sourceUrl ?? null,
      videoUrl: (product as any).videoUrl ?? null,
    };
    this.products.set(newProduct.id, newProduct);
    
    // Update category product count
    if (product.categoryId) {
      const category = this.categories.get(product.categoryId);
      if (category) {
        category.productCount = (category.productCount || 0) + 1;
        this.categories.set(product.categoryId, category);
      }
    }
    
    return newProduct;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(filters?: { categoryId?: number; supplierId?: number; search?: string; minPrice?: number; maxPrice?: number; sortBy?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    // Only show approved products for regular users
    products = products.filter(p => p.status === 'approved');
    
    if (filters?.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.supplierId) {
      products = products.filter(p => p.supplierId === filters.supplierId);
    }
    
    if (filters?.search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        p.description?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    
    if (filters?.minPrice) {
      products = products.filter(p => p.price && Number(p.price) >= filters.minPrice!);
    }
    
    if (filters?.maxPrice) {
      products = products.filter(p => p.price && Number(p.price) <= filters.maxPrice!);
    }
    
    // Sort products
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          products.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
          break;
        case 'price_desc':
          products.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
          break;
        case 'rating':
          products.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
          break;
        default:
          products.sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
      }
    }
    
    return products;
  }

  async getProductsBySupplier(supplierId: number, includeDeleted: boolean = false): Promise<Product[]> {
    let products = Array.from(this.products.values()).filter(p => p.supplierId === supplierId);
    
    if (!includeDeleted) {
      products = products.filter(p => !p.deletedAt);
    }
    
    return products;
  }

  async getDraftProductsBySupplier(supplierId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => 
      p.supplierId === supplierId && p.status === 'draft'
    );
  }

  async getDeletedProductsBySupplier(supplierId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => 
      p.supplierId === supplierId && p.status === 'deleted'
    );
  }

  async saveDraftProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: this.currentProductId++,
      views: 0,
      inquiries: 0,
      rating: '0.0',
      status: 'draft',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      description: product.description || null,
      categoryId: product.categoryId || null,
      price: product.price || null,
      minPrice: product.minPrice || null,
      maxPrice: product.maxPrice || null,
      minOrder: product.minOrder || 1,
      unit: product.unit || 'piece',
      images: product.images || [],
      specifications: product.specifications || null,
      materials: (product as any).materials ?? null,
      color: (product as any).color ?? null,
      size: (product as any).size ?? null,
      weight: (product as any).weight ?? null,
      dimensions: (product as any).dimensions ?? null,
      shippingTerms: (product as any).shippingTerms ?? null,
      incoterms: (product as any).incoterms ?? null,
      packagingDetails: (product as any).packagingDetails ?? null,
      leadTime: (product as any).leadTime ?? null,
      paymentTerms: (product as any).paymentTerms ?? null,
      certifications: (product as any).certifications ?? [],
      qualityGrade: (product as any).qualityGrade ?? null,
      origin: (product as any).origin ?? null,
      supplyCapacity: (product as any).supplyCapacity ?? null,
      moq: product.moq ?? null,
      deletedAt: null,
      deletedBy: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      suspensionReason: null,
      restoredBy: null,
      restoredAt: null,
      sourceUrl: (product as any).sourceUrl ?? null,
      videoUrl: (product as any).videoUrl ?? null,
    };
    this.products.set(newProduct.id, newProduct);

    // Create admin notification for new product
    if (newProduct.status === 'pending') {
      this.createAdminNotification({
        type: 'new_product',
        title: 'New Product Submission',
        message: `New product submitted for review: ${newProduct.name}`,
        relatedId: newProduct.id,
      });
    }

    return newProduct;
  }

  async publishDraftProduct(id: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product || product.status !== 'draft') return undefined;
    
    const updated = { ...product, status: 'pending' };
    this.products.set(id, updated);
    return updated;
  }

  async restoreRejectedProduct(id: number, restoredBy: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product || product.status !== 'rejected') return undefined;
    
    const updated = { 
      ...product, 
      status: 'pending',
      restoredBy: restoredBy,
      restoredAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null
    };
    this.products.set(id, updated);
    return updated;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // When product is updated, set status back to pending for admin verification
    const updated = { ...product, ...data, status: 'pending' };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    this.products.delete(id);
    
    // Update category product count
    if (product.categoryId) {
      const category = this.categories.get(product.categoryId);
      if (category) {
        category.productCount = Math.max(0, (category.productCount || 0) - 1);
        this.categories.set(product.categoryId, category);
      }
    }
    
    return true;
  }

  async softDeleteProduct(id: number, deletedBy: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updatedProduct = {
      ...product,
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: deletedBy
    };
    
    this.products.set(id, updatedProduct);
    return true;
  }

  async recoverProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updatedProduct = {
      ...product,
      status: 'pending',
      deletedAt: null,
      deletedBy: null
    };
    
    this.products.set(id, updatedProduct);
    return true;
  }

  async incrementProductViews(id: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.views = (product.views || 0) + 1;
      this.products.set(id, product);
    }
  }

  async incrementProductInquiries(id: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.inquiries = (product.inquiries || 0) + 1;
      this.products.set(id, product);
    }
  }

  // Inquiry operations
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: this.currentInquiryId++,
      status: 'pending',
      adminApprovalStatus: 'pending',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supplierReply: null,
      repliedAt: null,
      buyerReply: null,
      buyerRepliedAt: null,
      createdAt: new Date(),
      productId: inquiry.productId || null,
      quantity: inquiry.quantity || null,
    };
    this.inquiries.set(newInquiry.id, newInquiry);
    
    // Increment product inquiries if productId is provided
    if (inquiry.productId) {
      await this.incrementProductInquiries(inquiry.productId);
    }
    
    return newInquiry;
  }

  async getInquiriesByBuyer(buyerId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(i => i.buyerId === buyerId);
  }

  async getInquiriesBySupplier(supplierId: number): Promise<any[]> {
    const inquiries = Array.from(this.inquiries.values()).filter(i => i.supplierId === supplierId && i.adminApprovalStatus === 'approved');
    
    return inquiries.map(inquiry => {
      const buyer = this.buyerProfiles.get(inquiry.buyerId);
      const buyerUser = buyer ? this.users.get(buyer.userId) : null;
      const product = inquiry.productId ? this.products.get(inquiry.productId) : null;
      
      return {
        ...inquiry,
        buyerName: buyer?.companyName || 'Unknown Buyer',
        buyerEmail: buyerUser?.email || 'Unknown Email',
        productName: product?.name || 'General Inquiry',
      };
    }).sort((a, b) => {
      const statusOrder: Record<string, number> = { pending: 1, replied: 2, deleted: 3 };
      const sa = a.status ?? 'pending';
      const sb = b.status ?? 'pending';
      return (statusOrder[sa] ?? 99) - (statusOrder[sb] ?? 99);
    });
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }

  async getPendingInquiries(): Promise<any[]> {
    const inquiries = Array.from(this.inquiries.values());
    const pendingInquiries = inquiries.filter(i => i.adminApprovalStatus === 'pending');
    
    return pendingInquiries.map(inquiry => {
      const buyer = this.buyerProfiles.get(inquiry.buyerId);
      const supplier = this.supplierProfiles.get(inquiry.supplierId);
      const product = inquiry.productId ? this.products.get(inquiry.productId) : null;
      
      return {
        ...inquiry,
        buyerName: buyer?.companyName || 'Unknown Buyer',
        supplierName: supplier?.companyName || 'Unknown Supplier',
        productName: product?.name || 'General Inquiry',
      };
    });
  }

  async getApprovedInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(i => i.adminApprovalStatus === 'approved');
  }

  async getRejectedInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(i => i.adminApprovalStatus === 'rejected');
  }

  async approveInquiry(inquiryId: number, adminId?: number): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(inquiryId);
    if (!inquiry) return undefined;
    
    const updated: Inquiry = {
      ...inquiry,
      adminApprovalStatus: 'approved',
      approvedBy: adminId || 999,
      approvedAt: new Date(),
      buyerReply: null,
      buyerRepliedAt: null
    };
    
    this.inquiries.set(inquiryId, updated);
    return updated;
  }

  async rejectInquiry(inquiryId: number, reason: string): Promise<boolean> {
    const inquiry = this.inquiries.get(inquiryId);
    if (!inquiry) return false;
    
    const updated: Inquiry = {
      ...inquiry,
      adminApprovalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: null,
      approvedAt: null,
      buyerReply: null,
      buyerRepliedAt: null
    };
    
    this.inquiries.set(inquiryId, updated);
    return true;
  }

  async getPendingInquiriesForAdmin(): Promise<any[]> {
    // Alias for backward compatibility
    return this.getPendingInquiries();
  }





  async replyToInquiry(id: number, reply: string): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    
    const updated = {
      ...inquiry,
      supplierReply: reply,
      repliedAt: new Date(),
      status: 'replied'
    };
    
    this.inquiries.set(id, updated);
    return updated;
  }

  async buyerReplyToInquiry(id: number, reply: string): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    
    const updated = {
      ...inquiry,
      buyerReply: reply,
      buyerRepliedAt: new Date(),
      status: 'replied'
    };
    
    this.inquiries.set(id, updated);
    return updated;
  }

  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async updateInquiry(id: number, data: Partial<Inquiry>): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    
    const updated = { ...inquiry, ...data };
    this.inquiries.set(id, updated);
    return updated;
  }

  async deleteInquiry(id: number): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    
    const updated = {
      ...inquiry,
      status: 'deleted'
    };
    
    this.inquiries.set(id, updated);
    return updated;
  }

  async recoverInquiry(id: number): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    
    const updated = {
      ...inquiry,
      status: inquiry.supplierReply ? 'replied' : 'pending'
    };
    
    this.inquiries.set(id, updated);
    return updated;
  }

  // Saved products operations
  async saveLikeProduct(data: InsertSavedProduct): Promise<SavedProduct> {
    const newSavedProduct: SavedProduct = {
      ...data,
      id: this.savedProductIdCounter++,
      createdAt: new Date(),
    };
    this.savedProducts.set(newSavedProduct.id, newSavedProduct);
    return newSavedProduct;
  }

  async getSavedProductsByBuyer(buyerId: number): Promise<SavedProduct[]> {
    return Array.from(this.savedProducts.values()).filter(sp => sp.buyerId === buyerId);
  }

  async removeSavedProduct(buyerId: number, productId: number): Promise<boolean> {
    const savedProduct = Array.from(this.savedProducts.values()).find(
      sp => sp.buyerId === buyerId && sp.productId === productId
    );
    
    if (!savedProduct) return false;
    
    this.savedProducts.delete(savedProduct.id);
    return true;
  }

  // Follow supplier operations
  async followSupplier(data: InsertFollowedSupplier): Promise<FollowedSupplier> {
    const newFollowedSupplier: FollowedSupplier = {
      ...data,
      id: this.followedSupplierIdCounter++,
      createdAt: new Date(),
    };
    this.followedSuppliers.set(newFollowedSupplier.id, newFollowedSupplier);
    return newFollowedSupplier;
  }

  async getFollowedSuppliersByBuyer(buyerId: number): Promise<FollowedSupplier[]> {
    return Array.from(this.followedSuppliers.values()).filter(fs => fs.buyerId === buyerId);
  }

  async unfollowSupplier(buyerId: number, supplierId: number): Promise<boolean> {
    const followedSupplier = Array.from(this.followedSuppliers.values()).find(
      fs => fs.buyerId === buyerId && fs.supplierId === supplierId
    );
    
    if (!followedSupplier) return false;
    
    this.followedSuppliers.delete(followedSupplier.id);
    return true;
  }

  // Dashboard statistics
  async getSupplierStats(supplierId: number): Promise<{
    totalProducts: number;
    activeInquiries: number;
    profileViews: number;
    rating: number;
  }> {
    const products = await this.getProductsBySupplier(supplierId);
    const inquiries = await this.getInquiriesBySupplier(supplierId);
    const activeInquiries = inquiries.filter(i => i.status === 'pending').length;
    const supplier = await this.getSupplierById(supplierId);
    
    const profileViews = products.reduce((total, product) => total + (product.views || 0), 0);
    
    return {
      totalProducts: products.length,
      activeInquiries,
      profileViews,
      rating: Number(supplier?.rating || 0),
    };
  }

  async getBuyerStats(buyerId: number): Promise<{
    savedProducts: number;
    activeInquiries: number;
    followingSuppliers: number;
    successfulOrders: number;
  }> {
    const savedProducts = await this.getSavedProductsByBuyer(buyerId);
    const inquiries = await this.getInquiriesByBuyer(buyerId);
    const activeInquiries = inquiries.filter(i => i.status === 'pending').length;
    const followingSuppliers = await this.getFollowedSuppliersByBuyer(buyerId);
    
    return {
      savedProducts: savedProducts.length,
      activeInquiries,
      followingSuppliers: followingSuppliers.length,
      successfulOrders: 0, // This would require order tracking in a real system
    };
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalSuppliers: number;
    verifiedSuppliers: number;
    totalBuyers: number;
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    suspendedProducts: number;
    rejectedProducts: number;
    rejectedSuppliers: number;
    pendingUserApprovals: number;
  }> {
    const suppliers = Array.from(this.supplierProfiles.values());
    const buyers = Array.from(this.buyerProfiles.values());
    const products = Array.from(this.products.values());
    const users = Array.from(this.users.values());
    
    return {
      totalSuppliers: suppliers.filter(s => s.status !== 'rejected').length,
      verifiedSuppliers: suppliers.filter(s => s.verified && s.status !== 'rejected').length,
      totalBuyers: buyers.length,
      totalProducts: products.filter(p => p.status !== 'rejected').length,
      approvedProducts: products.filter(p => p.status === 'approved').length,
      pendingProducts: products.filter(p => p.status === 'pending').length,
      suspendedProducts: products.filter(p => p.status === 'suspended').length,
      rejectedProducts: products.filter(p => p.status === 'rejected').length,
      rejectedSuppliers: suppliers.filter(s => s.status === 'rejected').length,
      pendingUserApprovals: users.filter(u => !u.approved && u.role !== 'admin').length,
    };
  }

  async getPendingProducts(): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return products.filter(p => p.status === 'pending');
  }

  async getRejectedProducts(): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return products.filter(p => p.status === 'rejected');
  }

  async getApprovedProducts(): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return products.filter(p => p.status === 'approved');
  }

  async getSuspendedProducts(): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return products.filter(p => p.status === 'suspended');
  }

  async reviewProduct(productId: number, action: 'approve' | 'reject', reviewedBy: number, notes?: string): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (!product) return undefined;
    
    const updatedProduct = {
      ...product,
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes || null,
    };
    
    if (action === 'reject') {
      updatedProduct.rejectedBy = reviewedBy;
      updatedProduct.rejectedAt = new Date();
      updatedProduct.rejectionReason = notes || null;
    }
    
    this.products.set(productId, updatedProduct);
    
    // Create notification for supplier
    const supplier = await this.getSupplierById(product.supplierId);
    if (supplier) {
      const notificationData = {
        userId: supplier.userId,
        type: action === 'approve' ? 'product_approved' : 'product_rejected',
        title: action === 'approve' ? 'Product Approved' : 'Product Rejected',
        message: action === 'approve' 
          ? `Your product "${product.name}" has been approved and is now live on the marketplace.`
          : `Your product "${product.name}" has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
        actionUrl: action === 'approve' ? `/products/${productId}` : `/products/edit/${productId}`,
        actionText: action === 'approve' ? 'View Product' : 'Edit Product',
      };
      await this.createNotification(notificationData);
    }
    
    return updatedProduct;
  }

  async verifySupplier(supplierId: number, verified: boolean): Promise<Supplier | undefined> {
    const supplier = this.supplierProfiles.get(supplierId);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, verified, status: verified ? 'active' : 'pending_approval' };
    this.supplierProfiles.set(supplierId, updatedSupplier);

    // Send approval notification to supplier if verified
    if (verified) {
      await this.createNotification({
        userId: supplier.userId,
        type: 'profile_approved',
        title: 'Profile Approved',
        message: 'Congratulations! Your supplier profile has been approved and is now active.',
        actionUrl: '/supplier/dashboard',
        actionText: 'Go to Dashboard',
      });
    }

    return updatedSupplier;
  }

  async rejectSupplier(supplierId: number, rejectedBy: number, reason?: string): Promise<Supplier | undefined> {
    const supplier = this.supplierProfiles.get(supplierId);
    if (!supplier) return undefined;
    
    const updatedSupplier = { 
      ...supplier, 
      status: 'rejected',
      verified: false,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason || null
    };
    this.supplierProfiles.set(supplierId, updatedSupplier);

    // Send rejection notification to supplier
    await this.createNotification({
      userId: supplier.userId,
      type: 'profile_rejected',
      title: 'Profile Rejected',
      message: `Your supplier profile has been rejected. ${reason ? `Reason: ${reason}` : ''} Please review and resubmit your profile.`,
      actionUrl: '/supplier/enhanced-onboarding',
      actionText: 'Update Profile',
    });

    return updatedSupplier;
  }

  async getRejectedSuppliers(): Promise<Supplier[]> {
    const suppliers = Array.from(this.supplierProfiles.values());
    return suppliers.filter(s => s.status === 'rejected');
  }
  
  async getSuspendedSuppliers(): Promise<Supplier[]> {
    const suppliers = Array.from(this.supplierProfiles.values());
    return suppliers.filter(s => s.status === 'suspended').map(supplier => ({
      ...supplier,
      productCount: Array.from(this.products.values()).filter(p => p.supplierId === supplier.id).length,
    }));
  }
  
  async getDeletedSuppliers(): Promise<Supplier[]> {
    const suppliers = Array.from(this.supplierProfiles.values());
    return suppliers.filter(s => s.status === 'deleted').map(supplier => ({
      ...supplier,
      productCount: Array.from(this.products.values()).filter(p => p.supplierId === supplier.id).length,
    }));
  }

  async deleteSupplier(supplierId: number, deletedBy: number): Promise<boolean> {
    const supplier = Array.from(this.supplierProfiles.values()).find(s => s.id === supplierId);
    if (!supplier) return false;
    
    const updated = { 
      ...supplier, 
      status: 'deleted',
      deletedBy,
      deletedAt: new Date()
    };
    this.supplierProfiles.set(supplier.id, updated);
    
    // Send deletion notification to supplier
    await this.createNotification({
      userId: supplier.userId,
      type: 'profile_deleted',
      title: 'Account Deleted',
      message: 'Your supplier account has been deleted. If you believe this is an error, please contact support immediately.',
      actionUrl: '/contact-support',
      actionText: 'Contact Support',
    });
    
    return true;
  }

  async suspendProduct(productId: number, suspendedBy: number, reason?: string): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      status: 'suspended',
      suspendedBy,
      suspendedAt: new Date(),
      suspensionReason: reason || null
    };
    this.products.set(productId, updatedProduct);
    return updatedProduct;
  }

  async unsuspendProduct(productId: number): Promise<Product | undefined> {
    const product = this.products.get(productId);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      status: 'approved',
      suspendedBy: null,
      suspendedAt: null,
      suspensionReason: null
    };
    this.products.set(productId, updatedProduct);
    return updatedProduct;
  }

  async restoreSupplier(supplierId: number): Promise<Supplier | undefined> {
    const supplier = this.supplierProfiles.get(supplierId);
    if (!supplier) return undefined;
    
    const updatedSupplier = { 
      ...supplier, 
      status: 'active',
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null
    };
    this.supplierProfiles.set(supplierId, updatedSupplier);
    return updatedSupplier;
  }

  async getAllSuppliersForAdmin(): Promise<Supplier[]> {
    const suppliers = Array.from(this.supplierProfiles.values());
    return suppliers.map(supplier => ({
      ...supplier,
      productCount: Array.from(this.products.values()).filter(p => p.supplierId === supplier.id).length,
    }));
  }

  async getPendingSuppliersForAdmin(): Promise<any[]> {
    const suppliers = Array.from(this.supplierProfiles.values())
      .filter(supplier => supplier.onboardingCompleted && !supplier.verified);
    
    return suppliers.map(supplier => {
      const user = this.users.get(supplier.userId);
      return {
        ...supplier,
        user: user ? { id: user.id, email: user.email, approved: user.approved } : null
      };
    });
  }

  async getAllBuyersForAdmin(): Promise<Buyer[]> {
    const buyers = Array.from(this.buyerProfiles.values());
    return buyers.map(buyer => ({
      ...buyer,
      inquiryCount: Array.from(this.inquiries.values()).filter(i => i.buyerId === buyer.id).length,
      savedProductCount: Array.from(this.savedProducts.values()).filter(s => s.buyerId === buyer.id).length,
    }));
  }

  async getPendingUserApprovals(): Promise<User[]> {
    const users = Array.from(this.users.values());
    return users.filter(u => !u.approved && u.role !== 'admin');
  }

  async approveUser(userId: number, approvedBy: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      approved: true,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    
    // Create notification for user
    const notificationData = {
      userId: user.id,
      type: 'user_approved',
      title: 'Account Approved',
      message: `Welcome to TradeConnect! Your ${user.role} account has been approved. You can now access all features.`,
      actionUrl: user.role === 'supplier' ? '/dashboard/supplier' : '/dashboard/buyer',
      actionText: 'Go to Dashboard',
    };
    await this.createNotification(notificationData);
    
    return updatedUser;
  }

  // Admin Notification operations
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const newAdminNotification: AdminNotification = {
      ...notification,
      id: this.currentAdminNotificationId++,
      read: false,
      createdAt: new Date(),
      relatedId: (notification as any).relatedId ?? null,
    };
    this.adminNotifications.set(newAdminNotification.id, newAdminNotification);
    return newAdminNotification;
  }

  async getAdminNotifications(): Promise<AdminNotification[]> {
    return Array.from(this.adminNotifications.values()).sort((a, b) => 
      (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0)
    );
  }

  async getAdminNotificationCounts(): Promise<{ suppliers: number; buyers: number; products: number; users: number }> {
    const notifications = Array.from(this.adminNotifications.values()).filter(n => !n.read);
    
    return {
      suppliers: notifications.filter(n => n.type === 'new_supplier').length,
      buyers: notifications.filter(n => n.type === 'new_buyer').length,
      products: notifications.filter(n => n.type === 'new_product').length,
      users: notifications.filter(n => n.type === 'new_user_registration').length,
    };
  }

  async markAdminNotificationAsRead(notificationId: number): Promise<AdminNotification | undefined> {
    const notification = this.adminNotifications.get(notificationId);
    if (!notification) return undefined;
    
    const updated = { ...notification, read: true };
    this.adminNotifications.set(notificationId, updated);
    return updated;
  }

  async rejectUser(userId: number): Promise<boolean> {
    // In a real system, you might want to keep rejected users for audit
    // For now, we'll remove them from the system
    const user = this.users.get(userId);
    if (!user) return false;
    
    try {
      // Remove associated profiles
      if (user.role === 'supplier') {
        const supplier = await this.getSupplierByUserId(userId);
        if (supplier) {
          // Also remove supplier's products
          const supplierProducts = Array.from(this.products.values()).filter(p => p.supplierId === supplier.id);
          supplierProducts.forEach(p => this.products.delete(p.id));
          
          this.supplierProfiles.delete(supplier.id);
        }
      } else if (user.role === 'buyer') {
        const buyer = await this.getBuyerByUserId(userId);
        if (buyer) {
          // Remove buyer's saved products and followed suppliers
          const savedProducts = Array.from(this.savedProducts.values()).filter(s => s.buyerId === buyer.id);
          savedProducts.forEach(s => this.savedProducts.delete(s.id));
          
          const followedSuppliers = Array.from(this.followedSuppliers.values()).filter(f => f.buyerId === buyer.id);
          followedSuppliers.forEach(f => this.followedSuppliers.delete(f.id));
          
          this.buyerProfiles.delete(buyer.id);
        }
      }
      
      // Remove user
      this.users.delete(userId);
      return true;
    } catch (error) {
      console.error('Error rejecting user:', error);
      return false;
    }
  }


  private async initializeAdminUser() {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByEmail('admin@admin.com');
    if (existingAdmin) {
      return;
    }

    // Create admin user with hashed password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Reset user ID counter to ensure admin gets a high ID to avoid conflicts
    const adminId = 999; // Use a high ID to avoid conflicts
    
    const adminUser = {
      id: adminId,
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'admin' as const,
      approved: true, // Admin is auto-approved
      approvedBy: null,
      approvedAt: new Date(),
      emailVerified: true, // Admin email is auto-verified
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    console.log('Admin user created - Email: admin@admin.com, Password: admin123, ID:', adminId);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: this.currentNotificationId++,
      createdAt: new Date(),
      isRead: notification.isRead ?? null,
      actionUrl: notification.actionUrl ?? null,
      actionText: notification.actionText ?? null,
      readAt: null,
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return undefined;
    
    const updatedNotification = {
      ...notification,
      isRead: true,
      readAt: new Date(),
    };
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => {
        const updatedNotification = {
          ...n,
          isRead: true,
          readAt: new Date(),
        };
        this.notifications.set(n.id, updatedNotification);
      });
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .length;
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    return this.notifications.delete(notificationId);
  }

  private async initializeTestData() {
    // Skip if test data already exists
    if (this.users.size > 1) {
      return;
    }

    const bcrypt = await import('bcrypt');
    
    // Create test suppliers
    const suppliers = [
      {
        id: 100,
        email: 'supplier1@test.com',
        password: await bcrypt.hash('test123', 10),
        role: 'supplier' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 101,
        email: 'supplier2@test.com',
        password: await bcrypt.hash('test123', 10),
        role: 'supplier' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 102,
        email: 'supplier3@test.com',
        password: await bcrypt.hash('test123', 10),
        role: 'supplier' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Simple test user for easy testing
      {
        id: 103,
        email: 'a@a',
        password: await bcrypt.hash('a', 10),
        role: 'supplier' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Create test buyers
    const buyers = [
      {
        id: 200,
        email: 'buyer1@test.com',
        password: await bcrypt.hash('test123', 10),
        role: 'buyer' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 201,
        email: 'buyer2@test.com',
        password: await bcrypt.hash('test123', 10),
        role: 'buyer' as const,
        approved: true,
        emailVerified: true,
        approvedBy: 999,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add users to storage
    [...suppliers, ...buyers].forEach(user => {
      this.users.set(user.id, user);
    });

    // Create supplier profiles
    const supplierProfiles = [
      {
        id: 1,
        userId: 100,
        companyName: 'TechCorp Electronics',
        description: 'Leading manufacturer of consumer electronics and components with over 15 years of experience in the global market. We specialize in premium audio equipment, mobile accessories, and smart home devices.',
        location: 'Shenzhen, China',
        website: 'https://techcorp.com',
        phone: '+86-755-1234567',
        contactName: 'Zhang Wei',
        verified: true,
        rating: 4.8,
        productsCount: 15,
        onboardingCompleted: true,
        profileImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
        // Company Information
        businessRegistrationNumber: 'CN-91440300MA5DAJ7Q4X',
        countryOfRegistration: 'China',
        cityOfRegistration: 'Shenzhen',
        yearEstablished: 2008,
        legalEntityType: 'Limited Company',
        vatTaxId: 'CN-914403003221234567',
        registeredBusinessAddress: '15F, Building A, Tech Park, Nanshan District, Shenzhen, China 518000',
        // Contact Information
        primaryContactName: 'Zhang Wei',
        contactJobTitle: 'Export Manager',
        contactEmail: 'zhang.wei@techcorp.com',
        contactPhone: '+86-755-1234567',
        companyWebsite: 'https://techcorp.com',
        whatsappNumber: '+86-138-0013-5678',
        socialMediaLinkedIn: 'https://linkedin.com/company/techcorp-electronics',
        socialMediaYoutube: 'https://youtube.com/c/techcorpelectronics',
        socialMediaFacebook: 'https://facebook.com/techcorpelectronics',
        socialMediaTiktok: 'https://tiktok.com/@techcorp_official',
        socialMediaInstagram: 'https://instagram.com/techcorp_electronics',
        socialMediaPinterest: 'https://pinterest.com/techcorpelectronics',
        socialMediaX: 'https://x.com/techcorp_elec',
        // Main Product Category
        mainProductCategory: 'Consumer Electronics',
        // Compliance & Legal
        businessLicenseUrl: '/test-documents/techcorp-business-license.html',
        businessLicenseFileName: 'TechCorp_Business_License.pdf',
        productCertificationsUrl: '/test-documents/techcorp-certifications.html',
        productCertificationsFileName: 'TechCorp_CE_FCC_Certifications.pdf',
        exportImportLicenseUrl: '/test-documents/techcorp-business-license.html',
        exportImportLicenseFileName: 'TechCorp_Export_License.pdf',
        // Additional Company Info
        companyProfileUrl: '/test-documents/techcorp-certifications.html',
        companyProfileFileName: 'TechCorp_Company_Profile.pdf',
        companyLogoUrl: '/test-documents/Business_license_certificate_0dafa214.png',
        companyLogoFileName: 'TechCorp_Logo.png',
        factoryPhotosUrl: '/test-photos/factory-photos.json',
        factoryPhotosFileName: 'TechCorp_Factory_Photos.zip',
        introVideoUrl: 'https://youtube.com/watch?v=techcorp123',
        auditReportsUrl: 'https://example.com/audits/techcorp-iso9001.pdf',
        auditReportsFileName: 'TechCorp_ISO9001_Audit.pdf',
        // Shipping Methods
        shippingMethods: ['Sea Freight', 'Air Freight', 'Express Courier', 'Railway'],
        incotermsSupported: ['FOB', 'CIF', 'EXW', 'DDP', 'DDU'],
        regionsShippedTo: ['North America', 'Europe', 'Asia', 'South America', 'Oceania'],
        // References
        keyClients: ['Best Buy', 'Amazon', 'Walmart', 'Target', 'MediaMarkt'],
        testimonials: 'Excellent quality products with reliable delivery. TechCorp has been our trusted partner for over 5 years. - Best Buy Procurement Team',
        // Agreements
        agreesToTerms: true,
        agreesToPrivacy: true,
        declaresInfoAccurate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 101,
        companyName: 'Global Manufacturing Ltd',
        description: 'Leading industrial machinery and equipment supplier established in 1995. We specialize in heavy-duty conveyor systems, hydraulic equipment, and industrial automation solutions for manufacturing facilities worldwide.',
        location: 'Mumbai, India',
        website: 'https://globalmanufacturing.com',
        phone: '+91-22-9876543',
        contactName: 'Raj Patel',
        verified: true,
        rating: 4.5,
        productsCount: 8,
        onboardingCompleted: true,
        profileImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop',
        // Company Information
        businessRegistrationNumber: 'IN-L29299MH1995PLC087654',
        countryOfRegistration: 'India',
        cityOfRegistration: 'Mumbai',
        yearEstablished: 1995,
        legalEntityType: 'Public Limited Company',
        vatTaxId: 'IN-27AABCG1234M1Z5',
        registeredBusinessAddress: 'Plot No. 45, Industrial Estate, Andheri East, Mumbai, Maharashtra 400099, India',
        // Contact Information
        primaryContactName: 'Raj Patel',
        contactJobTitle: 'International Sales Director',
        contactEmail: 'raj.patel@globalmanufacturing.com',
        contactPhone: '+91-22-9876543',
        companyWebsite: 'https://globalmanufacturing.com',
        whatsappNumber: '+91-98765-43210',
        socialMediaLinkedIn: 'https://linkedin.com/company/global-manufacturing-ltd',
        socialMediaYoutube: 'https://youtube.com/c/globalmanufacturingindia',
        socialMediaFacebook: 'https://facebook.com/globalmanufacturingltd',
        socialMediaTiktok: 'https://tiktok.com/@global_manufacturing',
        socialMediaInstagram: 'https://instagram.com/global_manufacturing_ltd',
        socialMediaPinterest: 'https://pinterest.com/globalmanufacturing',
        socialMediaX: 'https://x.com/globalmfg_ltd',
        // Main Product Category
        mainProductCategory: 'Industrial Machinery',
        // Compliance & Legal
        businessLicenseUrl: 'https://example.com/licenses/globalmanufacturing-license.pdf',
        businessLicenseFileName: 'GlobalManufacturing_License.pdf',
        productCertificationsUrl: 'https://example.com/certs/globalmanufacturing-iso.pdf',
        productCertificationsFileName: 'GlobalManufacturing_ISO_Certifications.pdf',
        exportImportLicenseUrl: 'https://example.com/licenses/globalmanufacturing-iec.pdf',
        exportImportLicenseFileName: 'GlobalManufacturing_IEC_License.pdf',
        // Additional Company Info
        companyProfileUrl: 'https://example.com/profiles/globalmanufacturing-profile.pdf',
        companyProfileFileName: 'GlobalManufacturing_Profile.pdf',
        companyLogoUrl: 'https://example.com/logos/globalmanufacturing-logo.png',
        companyLogoFileName: 'GlobalManufacturing_Logo.png',
        factoryPhotosUrl: 'https://example.com/photos/globalmanufacturing-facility.zip',
        factoryPhotosFileName: 'GlobalManufacturing_Facility_Photos.zip',
        introVideoUrl: 'https://youtube.com/watch?v=globalmfg456',
        auditReportsUrl: 'https://example.com/audits/globalmanufacturing-iso14001.pdf',
        auditReportsFileName: 'GlobalManufacturing_ISO14001_Audit.pdf',
        // Shipping Methods
        shippingMethods: ['Sea Freight', 'Air Freight', 'Land Transport', 'Multimodal'],
        incotermsSupported: ['FOB', 'CFR', 'CIF', 'EXW', 'FCA'],
        regionsShippedTo: ['Asia', 'Middle East', 'Africa', 'Europe', 'North America'],
        // References
        keyClients: ['Tata Steel', 'Reliance Industries', 'Mahindra Group', 'L&T', 'BHEL'],
        testimonials: 'Outstanding industrial equipment quality and excellent after-sales service. Global Manufacturing has been our preferred supplier for heavy machinery for over 8 years. - Tata Steel',
        // Agreements
        agreesToTerms: true,
        agreesToPrivacy: true,
        declaresInfoAccurate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: 102,
        companyName: 'Euro Components GmbH',
        description: 'Premium automotive parts and components manufacturer founded in 1982. We are a trusted supplier of brake systems, lighting components, and precision automotive parts to European car manufacturers and aftermarket distributors.',
        location: 'Stuttgart, Germany',
        website: 'https://eurocomponents.de',
        phone: '+49-711-555-0123',
        contactName: 'Hans Mueller',
        verified: true,
        rating: 4.9,
        productsCount: 12,
        onboardingCompleted: true,
        profileImage: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop',
        // Company Information
        businessRegistrationNumber: 'DE-HRB123456',
        countryOfRegistration: 'Germany',
        cityOfRegistration: 'Stuttgart',
        yearEstablished: 1982,
        legalEntityType: 'GmbH (Limited Liability Company)',
        vatTaxId: 'DE123456789',
        registeredBusinessAddress: 'Industriestraße 45, 70565 Stuttgart, Germany',
        // Contact Information
        primaryContactName: 'Hans Mueller',
        contactJobTitle: 'Managing Director & Export Manager',
        contactEmail: 'h.mueller@eurocomponents.de',
        contactPhone: '+49-711-555-0123',
        companyWebsite: 'https://eurocomponents.de',
        whatsappNumber: '+49-176-1234-5678',
        socialMediaLinkedIn: 'https://linkedin.com/company/euro-components-gmbh',
        socialMediaYoutube: 'https://youtube.com/c/eurocomponentsgmbh',
        socialMediaFacebook: 'https://facebook.com/eurocomponentsgmbh',
        socialMediaTiktok: 'https://tiktok.com/@euro_components',
        socialMediaInstagram: 'https://instagram.com/euro_components_gmbh',
        socialMediaPinterest: 'https://pinterest.com/eurocomponents',
        socialMediaX: 'https://x.com/eurocomponents_de',
        // Main Product Category
        mainProductCategory: 'Automotive Parts',
        // Compliance & Legal
        businessLicenseUrl: 'https://example.com/licenses/eurocomponents-gewerbeschein.pdf',
        businessLicenseFileName: 'EuroComponents_Gewerbeschein.pdf',
        productCertificationsUrl: 'https://example.com/certs/eurocomponents-ece-iso.pdf',
        productCertificationsFileName: 'EuroComponents_ECE_ISO_Certifications.pdf',
        exportImportLicenseUrl: 'https://example.com/licenses/eurocomponents-export.pdf',
        exportImportLicenseFileName: 'EuroComponents_Export_License.pdf',
        // Additional Company Info
        companyProfileUrl: 'https://example.com/profiles/eurocomponents-unternehmensprofil.pdf',
        companyProfileFileName: 'EuroComponents_Unternehmensprofil.pdf',
        companyLogoUrl: 'https://example.com/logos/eurocomponents-logo.svg',
        companyLogoFileName: 'EuroComponents_Logo.svg',
        factoryPhotosUrl: '/test-photos/factory-photos.json',
        factoryPhotosFileName: 'EuroComponents_Werk_Fotos.zip',
        introVideoUrl: 'https://youtube.com/watch?v=eurocomp789',
        auditReportsUrl: 'https://example.com/audits/eurocomponents-iatf16949.pdf',
        auditReportsFileName: 'EuroComponents_IATF16949_Audit.pdf',
        // Shipping Methods
        shippingMethods: ['Road Transport', 'Rail Transport', 'Air Freight', 'Sea Freight'],
        incotermsSupported: ['EXW', 'FCA', 'DAP', 'DDP', 'CPT'],
        regionsShippedTo: ['Europe', 'North America', 'Asia', 'Middle East'],
        // References
        keyClients: ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Bosch'],
        testimonials: 'Euro Components delivers consistent quality and innovation in automotive parts. Their technical expertise and reliable delivery have made them our strategic partner for over 10 years. - BMW Procurement',
        // Agreements
        agreesToTerms: true,
        agreesToPrivacy: true,
        declaresInfoAccurate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Simple test supplier for a@a user that needs onboarding
      {
        id: 4,
        userId: 103,
        companyName: 'Test Company',
        description: 'Test supplier for onboarding testing',
        location: 'Test City',
        website: 'https://test.com',
        phone: '+1-555-0123',
        verified: false,
        rating: 4.0,
        onboardingCompleted: false,
        onboardingStep: 1,
        profileDraftData: null,
        status: 'active',
        profileImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
        businessRegistrationNumber: null,
        countryOfRegistration: null,
        cityOfRegistration: null,
        yearEstablished: null,
        legalEntityType: null,
        vatTaxId: null,
        registeredBusinessAddress: null,
        primaryContactName: null,
        contactJobTitle: null,
        contactEmail: null,
        contactPhone: null,
        companyWebsite: null,
        whatsappNumber: null,
        socialMediaLinkedIn: null,
        socialMediaYoutube: null,
        socialMediaFacebook: null,
        socialMediaTiktok: null,
        socialMediaInstagram: null,
        socialMediaPinterest: null,
        socialMediaX: null,
        mainProductCategory: null,
        businessLicenseUrl: null,
        businessLicenseFileName: null,
        productCertificationsUrl: null,
        productCertificationsFileName: null,
        exportImportLicenseUrl: null,
        exportImportLicenseFileName: null,
        companyProfileUrl: null,
        companyProfileFileName: null,
        companyLogoUrl: null,
        companyLogoFileName: null,
        factoryPhotosUrl: null,
        factoryPhotosFileName: null,
        introVideoUrl: null,
        auditReportsUrl: null,
        auditReportsFileName: null,
        shippingMethods: [],
        incotermsSupported: [],
        regionsShippedTo: [],
        keyClients: [],
        testimonials: null,
        agreesToTerms: false,
        agreesToPrivacy: false,
        declaresInfoAccurate: false,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
      }
    ];

    // Create buyer profiles
    const buyerProfiles = [
      {
        id: 4,
        userId: 200,
        companyName: 'American Import Co',
        contactName: 'John Smith',
        phone: '+1-555-0123',
        industry: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        userId: 201,
        companyName: 'Euro Trade Solutions',
        contactName: 'Marie Dubois',
        phone: '+33-1-45-67-89',
        industry: 'Automotive',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add profiles to storage
    [...supplierProfiles, ...buyerProfiles].forEach(profile => {
      if ('verified' in profile) {
        this.supplierProfiles.set(profile.id, profile);
      } else {
        this.buyerProfiles.set(profile.id, profile);
      }
    });

    // Create test products
    const products = [
      {
        id: 1,
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        category: 'Electronics',
        price: 89.99,
        moq: 50,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { color: 'Black', weight: '250g', battery: '30 hours' },
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'],
      },
      {
        id: 2,
        name: 'Smartphone Screen Protector',
        description: 'Tempered glass screen protector for smartphones',
        category: 'Electronics',
        price: 12.50,
        moq: 100,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Tempered Glass', thickness: '0.3mm' },
        images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=300&fit=crop'],
      },
      {
        id: 3,
        name: 'Industrial Conveyor Belt',
        description: 'Heavy-duty conveyor belt for industrial applications',
        category: 'Industrial',
        price: 245.00,
        moq: 10,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { length: '10m', width: '500mm', material: 'Rubber' },
        images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop'],
      },
      {
        id: 4,
        name: 'Hydraulic Pump',
        description: 'High-pressure hydraulic pump for industrial machinery',
        category: 'Industrial',
        price: 1250.00,
        moq: 5,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { pressure: '350 bar', flow: '45 L/min' },
        images: ['https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop'],
      },
      {
        id: 5,
        name: 'Car Brake Pads',
        description: 'Premium ceramic brake pads for passenger vehicles',
        category: 'Automotive',
        price: 65.00,
        moq: 20,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Ceramic', compatibility: 'BMW, Mercedes' },
        images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop'],
      },
      {
        id: 6,
        name: 'LED Headlight Bulbs',
        description: 'Energy-efficient LED headlight bulbs',
        category: 'Automotive',
        price: 45.00,
        moq: 25,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { wattage: '35W', lumens: '3600lm', color: '6000K' },
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'],
      },
      {
        id: 7,
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging pad for smartphones',
        category: 'Electronics',
        price: 28.99,
        moq: 30,
        supplierId: 1,
        status: 'pending',
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { power: '15W', compatibility: 'Qi-enabled devices' },
        images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop'],
      },
      {
        id: 8,
        name: 'Safety Harness',
        description: 'Industrial safety harness for construction work',
        category: 'Industrial',
        price: 85.00,
        moq: 15,
        supplierId: 2,
        status: 'pending',
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Polyester', weight: '1.2kg' },
        images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'],
      },
      // Additional TechCorp Electronics products (supplierId: 1)
      {
        id: 9,
        name: 'Smart Watch Pro',
        description: 'Advanced fitness tracking smartwatch with GPS and heart rate monitoring',
        category: 'Electronics',
        price: 199.99,
        moq: 25,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { display: '1.4" AMOLED', battery: '7 days', waterproof: 'IP68' },
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop'],
      },
      {
        id: 10,
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI, USB ports, and SD card reader',
        category: 'Electronics',
        price: 49.99,
        moq: 40,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { ports: '7', hdmi: '4K@60Hz', material: 'Aluminum' },
        images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop'],
      },
      {
        id: 11,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        category: 'Electronics',
        price: 24.99,
        moq: 60,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { dpi: '1600', battery: '18 months', connectivity: '2.4GHz' },
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'],
      },
      {
        id: 12,
        name: 'Bluetooth Speaker',
        description: 'Portable waterproof Bluetooth speaker with rich bass',
        category: 'Electronics',
        price: 79.99,
        moq: 35,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { power: '20W', battery: '12 hours', waterproof: 'IPX7' },
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop'],
      },
      {
        id: 13,
        name: 'Gaming Keyboard',
        description: 'Mechanical gaming keyboard with RGB backlighting',
        category: 'Electronics',
        price: 129.99,
        moq: 20,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { switches: 'Mechanical Blue', backlight: 'RGB', layout: 'Full Size' },
        images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop'],
      },
      {
        id: 14,
        name: 'Laptop Stand',
        description: 'Adjustable aluminum laptop stand for ergonomic working',
        category: 'Electronics',
        price: 39.99,
        moq: 50,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Aluminum', adjustable: 'Yes', compatibility: 'Universal' },
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop'],
      },
      {
        id: 15,
        name: 'Power Bank 20000mAh',
        description: 'High-capacity portable power bank with fast charging',
        category: 'Electronics',
        price: 34.99,
        moq: 45,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { capacity: '20000mAh', output: '18W PD', ports: '2 USB + 1 USB-C' },
        images: ['https://images.unsplash.com/photo-1609592806043-e86b9f67cf8b?w=400&h=300&fit=crop'],
      },
      {
        id: 16,
        name: 'Webcam HD 1080p',
        description: 'Full HD webcam with auto-focus and noise-canceling microphone',
        category: 'Electronics',
        price: 59.99,
        moq: 30,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { resolution: '1080p@30fps', microphone: 'Built-in', mounting: 'Universal' },
        images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop'],
      },
      {
        id: 17,
        name: 'Car Phone Mount',
        description: 'Magnetic car phone mount for dashboard or windshield',
        category: 'Electronics',
        price: 19.99,
        moq: 75,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { mount: 'Magnetic', rotation: '360°', compatibility: 'Universal' },
        images: ['https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=400&h=300&fit=crop'],
      },
      {
        id: 18,
        name: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with touch control and wireless charging base',
        category: 'Electronics',
        price: 69.99,
        moq: 25,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { brightness: '3 levels', charging: 'Wireless Qi', material: 'Aluminum' },
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'],
      },
      {
        id: 19,
        name: 'Tablet Stand',
        description: 'Universal adjustable tablet stand for desk or bedside use',
        category: 'Electronics',
        price: 29.99,
        moq: 55,
        supplierId: 1,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { compatibility: '7-13 inch tablets', adjustable: 'Multi-angle', material: 'ABS + Silicone' },
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'],
      },
      // Additional Global Manufacturing Ltd products (supplierId: 2)
      {
        id: 20,
        name: 'Industrial Crane',
        description: 'Heavy-duty overhead crane for warehouse and factory operations',
        category: 'Industrial',
        price: 15750.00,
        moq: 1,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { capacity: '10 tons', span: '20m', height: '8m' },
        images: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop'],
      },
      {
        id: 21,
        name: 'Pneumatic Cylinder',
        description: 'High-performance pneumatic cylinder for automation systems',
        category: 'Industrial',
        price: 185.00,
        moq: 10,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { stroke: '200mm', bore: '50mm', pressure: '10 bar' },
        images: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop'],
      },
      {
        id: 22,
        name: 'Forklift Battery',
        description: '48V lithium-ion battery for electric forklifts',
        category: 'Industrial',
        price: 3200.00,
        moq: 2,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { voltage: '48V', capacity: '400Ah', lifecycle: '3000 cycles' },
        images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
      },
      {
        id: 23,
        name: 'Industrial Valve',
        description: 'Stainless steel gate valve for high-pressure applications',
        category: 'Industrial',
        price: 420.00,
        moq: 8,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Stainless Steel 316', size: '2 inch', pressure: '150 PSI' },
        images: ['https://images.unsplash.com/photo-1581092335878-1bf62d14c27a?w=400&h=300&fit=crop'],
      },
      {
        id: 24,
        name: 'Motor Drive Controller',
        description: 'Variable frequency drive for AC motor speed control',
        category: 'Industrial',
        price: 890.00,
        moq: 5,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { power: '7.5kW', input: '380V 3-phase', frequency: '0-400Hz' },
        images: ['https://images.unsplash.com/photo-1581091870632-4a0b8c44be5a?w=400&h=300&fit=crop'],
      },
      {
        id: 25,
        name: 'Bearing Assembly',
        description: 'Heavy-duty roller bearing assembly for industrial machinery',
        category: 'Industrial',
        price: 275.00,
        moq: 12,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { type: 'Spherical Roller', bore: '100mm', load: '50kN' },
        images: ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop'],
      },
      {
        id: 26,
        name: 'Compressor Unit',
        description: 'Industrial air compressor for pneumatic systems',
        category: 'Industrial',
        price: 4500.00,
        moq: 1,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { capacity: '500L/min', pressure: '8 bar', power: '15kW' },
        images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop'],
      },
      {
        id: 27,
        name: 'Steel Platform',
        description: 'Modular steel work platform for industrial facilities',
        category: 'Industrial',
        price: 1850.00,
        moq: 3,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { dimensions: '3m x 2m', load: '500kg/m²', material: 'Galvanized Steel' },
        images: ['https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400&h=300&fit=crop'],
      },
      {
        id: 28,
        name: 'Welding Equipment',
        description: 'Professional MIG/TIG welding machine for industrial use',
        category: 'Industrial',
        price: 2100.00,
        moq: 2,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { current: '200A', voltage: '230V', processes: 'MIG/TIG/Stick' },
        images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop'],
      },
      {
        id: 29,
        name: 'Pipe Fitting Set',
        description: 'Stainless steel pipe fittings for industrial piping systems',
        category: 'Industrial',
        price: 95.00,
        moq: 20,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'SS316L', size: '1-4 inch', type: 'Elbow/Tee/Reducer' },
        images: ['https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=400&h=300&fit=crop'],
      },
      {
        id: 30,
        name: 'Proximity Sensor',
        description: 'Inductive proximity sensor for automated manufacturing',
        category: 'Industrial',
        price: 45.00,
        moq: 25,
        supplierId: 2,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { sensing: '8mm', output: 'NPN/PNP', housing: 'M18 threaded' },
        images: ['https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop'],
      },
      // Additional Euro Components GmbH products (supplierId: 3)
      {
        id: 31,
        name: 'Engine Oil Filter',
        description: 'High-performance engine oil filter for European vehicles',
        category: 'Automotive',
        price: 18.99,
        moq: 50,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { compatibility: 'BMW/Mercedes/Audi', filtration: '99.5%', material: 'Premium Media' },
        images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'],
      },
      {
        id: 32,
        name: 'Air Filter',
        description: 'High-flow air filter for improved engine performance',
        category: 'Automotive',
        price: 28.50,
        moq: 40,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { flow: '+15%', material: 'Cotton Gauze', washable: 'Yes' },
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'],
      },
      {
        id: 33,
        name: 'Spark Plugs Set',
        description: 'Iridium spark plugs for enhanced ignition performance',
        category: 'Automotive',
        price: 52.99,
        moq: 25,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Iridium', gap: '0.7mm', life: '100000km', set: '4 plugs' },
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'],
      },
      {
        id: 34,
        name: 'Brake Disc Set',
        description: 'Ventilated brake discs for improved braking performance',
        category: 'Automotive',
        price: 125.00,
        moq: 15,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { diameter: '320mm', ventilated: 'Yes', material: 'Cast Iron', set: '2 discs' },
        images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop'],
      },
      {
        id: 35,
        name: 'Suspension Strut',
        description: 'Gas-filled suspension strut for smooth ride comfort',
        category: 'Automotive',
        price: 89.99,
        moq: 20,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { type: 'Gas-filled', position: 'Front', compatibility: 'EU vehicles' },
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop'],
      },
      {
        id: 36,
        name: 'Alternator',
        description: 'High-output alternator for modern European vehicles',
        category: 'Automotive',
        price: 245.00,
        moq: 10,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { output: '140A', voltage: '12V', mounting: 'Standard' },
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'],
      },
      {
        id: 37,
        name: 'Fuel Pump',
        description: 'Electric fuel pump for fuel injection systems',
        category: 'Automotive',
        price: 145.50,
        moq: 12,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { pressure: '3.5 bar', flow: '120 L/h', type: 'In-tank electric' },
        images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'],
      },
      {
        id: 38,
        name: 'Timing Belt Kit',
        description: 'Complete timing belt kit with tensioner and pulleys',
        category: 'Automotive',
        price: 78.99,
        moq: 18,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { kit: 'Belt + Tensioner + Pulleys', material: 'HNBR', warranty: '2 years' },
        images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop'],
      },
      {
        id: 39,
        name: 'Radiator',
        description: 'Aluminum radiator for efficient engine cooling',
        category: 'Automotive',
        price: 195.00,
        moq: 8,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { material: 'Aluminum', core: '2-row', capacity: '8.5L' },
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'],
      },
      {
        id: 40,
        name: 'Clutch Kit',
        description: 'Complete clutch kit for manual transmission vehicles',
        category: 'Automotive',
        price: 165.00,
        moq: 15,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { kit: 'Disc + Pressure Plate + Bearing', diameter: '240mm', type: 'Organic' },
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'],
      },
      {
        id: 41,
        name: 'Xenon HID Kit',
        description: 'High-intensity discharge xenon headlight conversion kit',
        category: 'Automotive',
        price: 89.99,
        moq: 22,
        supplierId: 3,
        status: 'approved',
        approved: true,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        specifications: { wattage: '35W', temperature: '6000K', voltage: '12V', kit: 'Ballast + Bulbs' },
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'],
      }
    ];

    // Add products to storage
    products.forEach(product => {
      this.products.set(product.id, product);
    });


    // Create test inquiries
    const testInquiries = [
      {
        id: 1,
        buyerId: 1,
        supplierId: 1,
        productId: 1,
        subject: 'Bulk Order Inquiry - Wireless Bluetooth Headphones',
        message: 'Hi, I am interested in purchasing 500 units of your wireless Bluetooth headphones. Could you please provide a quote for bulk order and information about delivery time?',
        quantity: 500,
        status: 'pending',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: null,
        repliedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        buyerId: 2,
        supplierId: 1,
        productId: 2,
        subject: 'Technical Specifications - Smartphone Screen Protector',
        message: 'I need detailed technical specifications for your smartphone screen protectors. Are they compatible with iPhone 15 Pro Max? What is the pricing for 1000 pieces?',
        quantity: 1000,
        status: 'pending',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: null,
        repliedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
      },
      {
        id: 3,
        buyerId: 1,
        supplierId: 2,
        productId: 3,
        subject: 'Industrial Conveyor Belt - Custom Length',
        message: 'We need a custom conveyor belt of 25 meters length. Can you manufacture this according to our specifications? Please provide pricing and lead time.',
        quantity: 1,
        status: 'replied',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: 'Yes, we can manufacture custom length conveyor belts. For 25m length, the price would be $610. Lead time is 2-3 weeks. Please contact us at info@industrialparts.com for detailed specifications.',
        repliedAt: new Date(),
        rejectionReason: null,
        createdAt: new Date(),
      },
      {
        id: 4,
        buyerId: 2,
        supplierId: 3,
        productId: 5,
        subject: 'Car Brake Pads - Compatibility Check',
        message: 'I need brake pads for Mercedes E-Class 2020. Are your ceramic brake pads compatible? What is the minimum order quantity and price per set?',
        quantity: 50,
        status: 'pending',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: null,
        repliedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
      },
      {
        id: 5,
        buyerId: 1,
        supplierId: 3,
        productId: 6,
        subject: 'LED Headlight Bulbs - Volume Discount',
        message: 'We are looking for LED headlight bulbs for our automotive service center. Can you provide a volume discount for 200 units? What are the warranty terms?',
        quantity: 200,
        status: 'replied',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: 'For 200 units, we can offer a 15% discount. Final price would be $38.25 per unit. All bulbs come with 2-year warranty. Free shipping included for orders over $5000.',
        repliedAt: new Date(),
        rejectionReason: null,
        createdAt: new Date(),
      },
      {
        id: 6,
        buyerId: 1,
        supplierId: 1,
        productId: 1,
        subject: 'Deleted Inquiry - Wireless Headphones Return Policy',
        message: 'I want to know about your return policy for wireless headphones. What is the warranty period and replacement process?',
        quantity: 10,
        status: 'deleted',
        adminApprovalStatus: 'approved',
        approvedBy: 999,
        approvedAt: new Date(),
        supplierReply: null,
        repliedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
      }
    ];

    // Add inquiries to storage
    testInquiries.forEach(inquiry => {
      this.inquiries.set(inquiry.id, inquiry);
    });

    // Update current ID counters
    this.currentUserId = 300;
    this.currentSupplierProfileId = 10;
    this.currentBuyerProfileId = 10;
    this.currentProductId = 20;
    this.currentInquiryId = 7;

    console.log('Test data initialized - 3 suppliers, 2 buyers, 8 products (6 approved, 2 pending), 6 inquiries (3 pending, 2 replied, 1 deleted)');
  }

  // Product Review operations
  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const newReview: ProductReview = {
      id: this.currentReviewId++,
      ...review,
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      title: review.title ?? null,
      comment: review.comment ?? null,
    };
    this.productReviews.set(newReview.id, newReview);
    return newReview;
  }

  async getProductReviews(productId: number): Promise<ProductReview[]> {
    // Only return approved reviews for public access
    return Array.from(this.productReviews.values())
      .filter(review => review.productId === productId && review.isApproved)
      .sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
  }

  async getProductReviewById(id: number): Promise<ProductReview | undefined> {
    return this.productReviews.get(id);
  }

  async updateProductReview(id: number, updates: Partial<ProductReview>): Promise<ProductReview | undefined> {
    const review = this.productReviews.get(id);
    if (!review) return undefined;

    // If content is being edited, revoke approval and require re-moderation
    const updatedReview = { 
      ...review, 
      ...updates, 
      updatedAt: new Date(),
      // Revoke approval when content changes
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    };
    this.productReviews.set(id, updatedReview);
    
    // Update product rating after review change
    await this.updateProductRating(review.productId);
    
    return updatedReview;
  }

  async deleteProductReview(id: number): Promise<boolean> {
    const review = this.productReviews.get(id);
    if (!review) return false;
    
    const deleted = this.productReviews.delete(id);
    
    // Update product rating after deletion
    if (deleted) {
      await this.updateProductRating(review.productId);
    }
    
    return deleted;
  }

  async approveProductReview(id: number, approvedBy: number): Promise<ProductReview | undefined> {
    const review = this.productReviews.get(id);
    if (!review) return undefined;

    const updatedReview = {
      ...review,
      isApproved: true,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    this.productReviews.set(id, updatedReview);
    
    // Update product rating after approval
    await this.updateProductRating(review.productId);
    
    return updatedReview;
  }

  async updateProductRating(productId: number): Promise<void> {
    // Get all approved reviews for this product
    const approvedReviews = Array.from(this.productReviews.values())
      .filter(review => review.productId === productId && review.isApproved);
    
    // Calculate average rating
    let newRating = 0;
    if (approvedReviews.length > 0) {
      const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
      newRating = totalRating / approvedReviews.length;
    }
    
    // Update product rating (round to 1 decimal place)
    const product = this.products.get(productId);
    if (product) {
      const updatedProduct = {
        ...product,
        rating: Number(newRating.toFixed(1)).toString(),
      };
      this.products.set(productId, updatedProduct);
    }
  }

  // Review Comment operations
  async createReviewComment(comment: InsertReviewComment): Promise<ReviewComment> {
    const newComment: ReviewComment = {
      id: this.currentReviewCommentId++,
      ...comment,
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reviewComments.set(newComment.id, newComment);
    return newComment;
  }

  async getReviewComments(reviewId: number): Promise<ReviewComment[]> {
    // Only return approved comments for public access
    return Array.from(this.reviewComments.values())
      .filter(comment => comment.reviewId === reviewId && comment.isApproved)
      .sort((a, b) => (a.createdAt ? a.createdAt.getTime() : 0) - (b.createdAt ? b.createdAt.getTime() : 0));
  }

  async getReviewCommentById(id: number): Promise<ReviewComment | undefined> {
    return this.reviewComments.get(id);
  }

  async updateReviewComment(id: number, updates: Partial<ReviewComment>): Promise<ReviewComment | undefined> {
    const comment = this.reviewComments.get(id);
    if (!comment) return undefined;

    // If content is being edited, revoke approval and require re-moderation
    const updatedComment = { 
      ...comment, 
      ...updates, 
      updatedAt: new Date(),
      // Revoke approval when content changes
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    };
    this.reviewComments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteReviewComment(id: number): Promise<boolean> {
    return this.reviewComments.delete(id);
  }

  async checkExistingReview(productId: number, userId: number): Promise<boolean> {
    // Check for any existing review by this user for this product (regardless of approval status)
    return Array.from(this.productReviews.values())
      .some(review => review.productId === productId && review.userId === userId);
  }

  async approveReviewComment(id: number, approvedBy: number): Promise<ReviewComment | undefined> {
    const comment = this.reviewComments.get(id);
    if (!comment) return undefined;

    const updatedComment = {
      ...comment,
      isApproved: true,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    this.reviewComments.set(id, updatedComment);
    return updatedComment;
  }

  // Blog post operations
  async createBlogPost(blogPost: InsertBlogPost & { authorId: number }): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const now = new Date();
    const newBlogPost: BlogPost = {
      id,
      ...blogPost,
      authorId: blogPost.authorId,
      publishedAt: blogPost.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
      excerpt: blogPost.excerpt ?? null,
      featuredImage: (blogPost as any).featuredImage ?? null,
      tags: blogPost.tags ?? [],
      metaTitle: (blogPost as any).metaTitle ?? null,
      metaDescription: (blogPost as any).metaDescription ?? null,
    };
    this.blogPosts.set(id, newBlogPost);
    return newBlogPost;
  }

  async getBlogPosts(status?: string): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    if (status) {
      posts = posts.filter(post => post.status === status);
    }
    return posts.sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async getBlogPostWithAuthor(slug: string): Promise<(BlogPost & { author?: { id: number; email: string; name?: string } }) | undefined> {
    const post = Array.from(this.blogPosts.values()).find(post => post.slug === slug);
    if (!post) return undefined;
    
    const author = await this.getUserById(post.authorId);
    return {
      ...post,
      author: author ? {
        id: author.id,
        email: author.email,
        name: author.email.split('@')[0] // Use email prefix as name for now
      } : undefined
    };
  }

  async updateBlogPost(id: number, blogPost: Partial<InsertBlogPost>): Promise<BlogPost> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) {
      throw new Error('Blog post not found');
    }
    
    const updatedPost: BlogPost = {
      ...existingPost,
      ...blogPost,
      updatedAt: new Date(),
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    this.blogPosts.delete(id);
  }

  async publishBlogPost(id: number): Promise<BlogPost> {
    const post = this.blogPosts.get(id);
    if (!post) {
      throw new Error('Blog post not found');
    }
    
    const publishedPost: BlogPost = {
      ...post,
      status: 'published',
      publishedAt: post.publishedAt || new Date(), // Set publishedAt only if not already set
      updatedAt: new Date(),
    };
    
    this.blogPosts.set(id, publishedPost);
    return publishedPost;
  }
}

const useFirestore = (process.env.USE_FIRESTORE === 'true') && !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS);

let storageImpl: IStorage;

if (useFirestore) {
  let db: FirebaseFirestore.Firestore | undefined;
  try {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")) : undefined;
    if (!admin.apps.length) {
      if (svc) {
        admin.initializeApp({ credential: admin.credential.cert(svc) });
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        admin.initializeApp(projectId ? { projectId } : {} as any);
      }
    }
    db = admin.firestore();
  } catch {
    db = undefined;
  }
  if (!db) {
    console.error("Firestore initialization failed; falling back to in-memory storage");
    storageImpl = new MemStorage();
  } else {

  const fdb = db as FirebaseFirestore.Firestore;
  class FirestoreStorage extends MemStorage {
    private usersCol = fdb.collection("users");
    private suppliersCol = fdb.collection("suppliers");
    private buyersCol = fdb.collection("buyers");
    private categoriesCol = fdb.collection("categories");
    private productsCol = fdb.collection("products");
    private inquiriesCol = fdb.collection("inquiries");
    private notificationsCol = fdb.collection("notifications");
    private countersCol = fdb.collection("counters");

    private async nextId(key: string): Promise<number> {
      try {
        const id = await fdb.runTransaction(async t => {
          const doc = this.countersCol.doc(key);
          const snap = await t.get(doc);
          const current = snap.exists ? (snap.data() as any).current || 0 : 0;
          const next = current + 1;
          t.set(doc, { current: next }, { merge: true });
          return next as number;
        });
        return id;
      } catch {
        return Date.now();
      }
    }

    async createUser(user: InsertUser): Promise<User> {
      const id = await this.nextId("users");
      const doc = { ...user, id, createdAt: new Date() } as any;
      await this.usersCol.doc(String(id)).set(doc);
      return doc as User;
    }

    async getUserById(id: number): Promise<User | undefined> {
      const snap = await this.usersCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as User) : undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
      const qs = await this.usersCol.where("email", "==", email).limit(1).get();
      return qs.empty ? undefined : (qs.docs[0].data() as User);
    }

    async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
      const qs = await this.usersCol.where("emailVerificationToken", "==", token).limit(1).get();
      return qs.empty ? undefined : (qs.docs[0].data() as User);
    }

    async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
      const qs = await this.usersCol.where("passwordResetToken", "==", token).limit(1).get();
      return qs.empty ? undefined : (qs.docs[0].data() as User);
    }

    async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
      const ref = this.usersCol.doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return undefined;
      const updated = { ...(snap.data() as User), ...data, updatedAt: new Date() };
      await ref.set(updated, { merge: true });
      return updated as User;
    }

    async deleteUser(id: number): Promise<boolean> {
      await this.usersCol.doc(String(id)).delete();
      return true;
    }

    async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
      const id = await this.nextId("suppliers");
      const doc = { ...supplier, id, createdAt: new Date(), updatedAt: new Date(), verified: supplier["verified"] ?? false, status: supplier["status"] ?? "active" } as any;
      await this.suppliersCol.doc(String(id)).set(doc);
      return doc as Supplier;
    }

    async getSupplierById(id: number): Promise<Supplier | undefined> {
      const snap = await this.suppliersCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as Supplier) : undefined;
    }

    async getSupplierByUserId(userId: number): Promise<Supplier | undefined> {
      const qs = await this.suppliersCol.where("userId", "==", userId).limit(1).get();
      return qs.empty ? undefined : (qs.docs[0].data() as Supplier);
    }

    async getSuppliers(search?: string, location?: string): Promise<Supplier[]> {
      let qs = await this.suppliersCol.get();
      let list = qs.docs.map(d => d.data() as Supplier);
      if (search) list = list.filter(s => (s.companyName || "").toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase()));
      if (location) list = list.filter(s => (s.location || "").toLowerCase().includes(location.toLowerCase()));
      return list;
    }

    async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier | undefined> {
      const ref = this.suppliersCol.doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return undefined;
      const updated = { ...(snap.data() as Supplier), ...data, updatedAt: new Date() };
      await ref.set(updated, { merge: true });
      return updated as Supplier;
    }

    async createBuyer(buyer: InsertBuyer): Promise<Buyer> {
      const id = await this.nextId("buyers");
      const doc = { ...buyer, id, createdAt: new Date(), updatedAt: new Date() } as any;
      await this.buyersCol.doc(String(id)).set(doc);
      return doc as Buyer;
    }

    async getBuyerById(id: number): Promise<Buyer | undefined> {
      const snap = await this.buyersCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as Buyer) : undefined;
    }

    async getBuyerByUserId(userId: number): Promise<Buyer | undefined> {
      const qs = await this.buyersCol.where("userId", "==", userId).limit(1).get();
      return qs.empty ? undefined : (qs.docs[0].data() as Buyer);
    }

    async getAllBuyers(): Promise<Buyer[]> {
      const qs = await this.buyersCol.get();
      return qs.docs.map(d => d.data() as Buyer);
    }

    async createCategory(category: InsertCategory): Promise<Category> {
      const id = await this.nextId("categories");
      const doc = { ...category, id } as any;
      await this.categoriesCol.doc(String(id)).set(doc);
      return doc as Category;
    }

    async getCategoryById(id: number): Promise<Category | undefined> {
      const snap = await this.categoriesCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as Category) : undefined;
    }

    async getCategories(): Promise<Category[]> {
      const qs = await this.categoriesCol.get();
      return qs.docs.map(d => d.data() as Category);
    }

    async getAllCategories(): Promise<Category[]> {
      return this.getCategories();
    }

    async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
      const ref = this.categoriesCol.doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return undefined;
      const updated = { ...(snap.data() as Category), ...updates };
      await ref.set(updated, { merge: true });
      return updated as Category;
    }

    async deleteCategory(id: number): Promise<boolean> {
      await this.categoriesCol.doc(String(id)).delete();
      return true;
    }

    async createProduct(product: InsertProduct): Promise<Product> {
      const id = await this.nextId("products");
      const doc = { ...product, id, createdAt: new Date(), updatedAt: new Date() } as any;
      await this.productsCol.doc(String(id)).set(doc);
      return doc as Product;
    }

    async getProductById(id: number): Promise<Product | undefined> {
      const snap = await this.productsCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as Product) : undefined;
    }

    async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
      const ref = this.productsCol.doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return undefined;
      const updated = { ...(snap.data() as Product), ...data, updatedAt: new Date() };
      await ref.set(updated, { merge: true });
      return updated as Product;
    }

    async getProducts(filters: any = {}): Promise<Product[]> {
      let qs = await this.productsCol.get();
      let list = qs.docs.map(d => d.data() as Product);
      if (filters.status) list = list.filter(p => p["status"] === filters.status);
      if (filters.supplierId) list = list.filter(p => p.supplierId === filters.supplierId);
      if (filters.categoryId) list = list.filter(p => p["categoryId"] === filters.categoryId);
      return list;
    }

    async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
      const id = await this.nextId("inquiries");
      const doc = { ...inquiry, id, createdAt: new Date() } as any;
      await this.inquiriesCol.doc(String(id)).set(doc);
      return doc as Inquiry;
    }

    async getInquiryById(id: number): Promise<Inquiry | undefined> {
      const snap = await this.inquiriesCol.doc(String(id)).get();
      return snap.exists ? (snap.data() as Inquiry) : undefined;
    }

    async getInquiriesByBuyer(buyerId: number): Promise<Inquiry[]> {
      const qs = await this.inquiriesCol.where("buyerId", "==", buyerId).get();
      return qs.docs.map(d => d.data() as Inquiry);
    }

    async getInquiriesBySupplier(supplierId: number): Promise<Inquiry[]> {
      const qs = await this.inquiriesCol.where("supplierId", "==", supplierId).get();
      return qs.docs.map(d => d.data() as Inquiry);
    }

    async createNotification(notification: InsertNotification): Promise<Notification> {
      const id = await this.nextId("notifications");
      const doc = { ...notification, id, createdAt: new Date(), read: false } as any;
      await this.notificationsCol.doc(String(id)).set(doc);
      return doc as Notification;
    }

    async getNotificationsByUser(userId: number): Promise<Notification[]> {
      const qs = await this.notificationsCol.where("userId", "==", userId).get();
      return qs.docs.map(d => d.data() as Notification);
    }

    async getUnreadNotificationsCount(userId: number): Promise<number> {
      const qs = await this.notificationsCol.where("userId", "==", userId).where("read", "==", false).get();
      return qs.size;
    }

    async markNotificationAsRead(id: number): Promise<Notification | undefined> {
      const ref = this.notificationsCol.doc(String(id));
      const snap = await ref.get();
      if (!snap.exists) return undefined;
      const updated = { ...(snap.data() as Notification), read: true };
      await ref.set(updated, { merge: true });
      return updated as Notification;
    }

    async markAllNotificationsAsRead(userId: number): Promise<void> {
      const qs = await this.notificationsCol.where("userId", "==", userId).get();
      const batch = fdb.batch();
      qs.docs.forEach(doc => batch.set(doc.ref, { ...doc.data(), read: true }, { merge: true }));
      await batch.commit();
    }

    async deleteNotification(id: number): Promise<boolean> {
      await this.notificationsCol.doc(String(id)).delete();
      return true;
    }
  }

  storageImpl = new FirestoreStorage();
  }
} else {
  storageImpl = new MemStorage();
}

export const storage: IStorage = storageImpl;
