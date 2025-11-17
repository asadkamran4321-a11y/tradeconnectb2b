import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminLogin from "@/pages/auth/admin-login";
import SupplierLogin from "@/pages/auth/supplier-login";
import BuyerLogin from "@/pages/auth/buyer-login";
import EmailVerificationRequired from "@/pages/auth/email-verification-required";
import SupplierDashboard from "@/pages/dashboard/supplier-dashboard";
import SupplierProducts from "@/pages/dashboard/supplier-products";
import BuyerDashboard from "@/pages/dashboard/buyer-dashboard";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import SupplierVerification from "@/pages/admin/supplier-verification";
import SupplierProfile from "@/pages/supplier/supplier-profile";
import ProductList from "@/pages/products/product-list";
import ProductDetail from "@/pages/products/product-detail";
import AddProduct from "@/pages/products/add-product";
import ProductDrafts from "@/pages/products/product-drafts";
import SupplierList from "@/pages/suppliers/supplier-list";
import SupplierDetail from "@/pages/suppliers/supplier-detail";
import Profile from "@/pages/profile/profile";
import NotFound from "@/pages/not-found";
import SupplierOnboarding from "@/pages/onboarding/supplier-onboarding";
import SavedProducts from "@/pages/buyer/saved-products";
import FollowedSuppliers from "@/pages/buyer/followed-suppliers";
import BuyerInquiries from "@/pages/buyer/buyer-inquiries";
import SupplierInquiries from "@/pages/supplier/inquiries";
import InquiriesDashboard from "@/pages/supplier/inquiries-dashboard";
import VerifyEmail from "@/pages/verify-email";
import ResendVerification from "@/pages/auth/resend-verification";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import TestPasswordReset from "@/pages/test-password-reset";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import EnhancedSupplierOnboarding from "@/pages/supplier/enhanced-onboarding";
import VerificationPending from "@/pages/supplier/verification-pending";
import ProtectedSupplierDashboard from "@/pages/supplier/protected-dashboard";
import ProtectedAddProduct from "@/pages/supplier/protected-add-product";
import AdminSupplierVerification from "@/pages/admin/supplier-verification";
import VerifyEmailRequired from "@/pages/verify-email-required";
import CategoryList from "@/pages/categories/category-list";
import CategoryDetail from "@/pages/categories/category-detail";
import CategoryProducts from "@/pages/categories/category-products";
import CategoryManagement from "@/pages/admin/category-management";
import SupplierManagement from "@/pages/admin/supplier-management";
import ProductManagement from "@/pages/admin/product-management";
import BuyerManagement from "@/pages/admin/buyer-management";
import InquiryManagement from "@/pages/admin/inquiry-management";
import BlogManagement from "@/pages/admin/blog-management";
import BlogEditor from "@/pages/admin/blog-editor";
import BlogList from "@/pages/blog/blog-list";
import BlogDetail from "@/pages/blog/blog-detail";
import SystemHealth from "@/pages/admin/system-health";
import UserManagement from "@/pages/admin/user-management";
import SystemLogs from "@/pages/admin/system-logs";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/login/supplier" component={SupplierLogin} />
          <Route path="/login/buyer" component={BuyerLogin} />
          <Route path="/verify-email-required" component={EmailVerificationRequired} />
          <Route path="/register" component={Register} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/resend-verification" component={ResendVerification} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/test-password-reset" component={TestPasswordReset} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/supplier/enhanced-onboarding" component={EnhancedSupplierOnboarding} />
          <Route path="/supplier/verification-pending" component={VerificationPending} />
          <Route path="/supplier/profile" component={SupplierProfile} />
          <Route path="/verify-email-required" component={VerifyEmailRequired} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/dashboard/supplier" component={ProtectedSupplierDashboard} />
          <Route path="/dashboard/supplier/products" component={SupplierProducts} />
          <Route path="/dashboard/buyer" component={BuyerDashboard} />
          <Route path="/dashboard/admin" component={AdminDashboard} />
          <Route path="/admin/supplier-verification" component={SupplierVerification} />
          <Route path="/buyer/saved-products" component={SavedProducts} />
          <Route path="/buyer/followed-suppliers" component={FollowedSuppliers} />
          <Route path="/buyer/inquiries" component={BuyerInquiries} />
          <Route path="/supplier/inquiries" component={SupplierInquiries} />
          <Route path="/supplier/inquiries-dashboard" component={InquiriesDashboard} />
          <Route path="/onboarding/supplier" component={SupplierOnboarding} />
          <Route path="/products" component={ProductList} />
          <Route path="/products/add" component={ProtectedAddProduct} />
          <Route path="/products/edit/:id" component={ProtectedAddProduct} />
          <Route path="/products/drafts" component={ProductDrafts} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/suppliers" component={SupplierList} />
          <Route path="/suppliers/:id" component={SupplierDetail} />
          <Route path="/categories" component={CategoryList} />
          <Route path="/categories/:id" component={CategoryDetail} />
          <Route path="/categories/:id/products" component={CategoryProducts} />
          <Route path="/admin/categories" component={CategoryManagement} />
          <Route path="/admin/suppliers" component={SupplierManagement} />
          <Route path="/admin/products" component={ProductManagement} />
          <Route path="/admin/buyers" component={BuyerManagement} />
          <Route path="/admin/inquiries" component={InquiryManagement} />
          <Route path="/admin/blog" component={BlogManagement} />
          <Route path="/admin/blog/new" component={BlogEditor} />
          <Route path="/admin/blog/edit/:id" component={BlogEditor} />
          <Route path="/admin/system/health" component={SystemHealth} />
          <Route path="/admin/system/users" component={UserManagement} />
          <Route path="/admin/system/logs" component={SystemLogs} />
          <Route path="/blog" component={BlogList} />
          <Route path="/blog/:slug" component={BlogDetail} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
