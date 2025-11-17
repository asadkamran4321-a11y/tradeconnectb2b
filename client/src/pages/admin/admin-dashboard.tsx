import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Package, ShoppingCart, CheckCircle, XCircle, Clock, Eye, Shield, TrendingUp, Trash2, AlertTriangle, FileText, Grid, MessageSquare } from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type AdminStats = {
  totalSuppliers: number;
  verifiedSuppliers: number;
  totalBuyers: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  suspendedProducts: number;
  rejectedSuppliers: number;
  pendingUserApprovals: number;
};

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  supplier: {
    id: number;
    companyName: string;
    verified: boolean;
  };
  createdAt: string;
};

type Supplier = {
  id: number;
  companyName: string;
  email: string;
  verified: boolean;
  productCount: number;
  createdAt: string;
};

type Buyer = {
  id: number;
  companyName: string;
  email: string;
  inquiryCount: number;
  savedProductCount: number;
  createdAt: string;
};

type PendingUser = {
  id: number;
  email: string;
  role: 'supplier' | 'buyer';
  approved: boolean;
  createdAt: string;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Check admin authentication
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
  }, [setLocation]);

  // Admin notification counts
  const { data: notificationCounts, isLoading: notificationCountsLoading } = useQuery<{ suppliers: number; buyers: number; products: number; users: number }>({
    queryKey: ['/api/admin/notification-counts'],
    queryFn: async () => {
      return await apiRequest('/api/admin/notification-counts', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/stats', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  if (statsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading admin dashboard...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage suppliers, buyers, and product approvals</p>
      </div>

      {/* Super Admin Navigation - Only visible to super admin (ID: 999) */}
      {adminAuthService.isSuperAdmin() && (
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-purple-800">
                <Shield className="h-6 w-6 mr-2" />
                Super Admin Controls
              </CardTitle>
              <p className="text-sm text-purple-600">Advanced system administration and configuration</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-purple-200 hover:bg-purple-50"
                  data-testid="button-super-admin-users"
                >
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">User Management</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-purple-200 hover:bg-purple-50"
                  data-testid="button-super-admin-settings"
                >
                  <Shield className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">System Settings</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-purple-200 hover:bg-purple-50"
                  data-testid="button-super-admin-logs"
                >
                  <FileText className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">System Logs</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-purple-200 hover:bg-purple-50"
                  data-testid="button-super-admin-backup"
                >
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">System Health</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.verifiedSuppliers || 0} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBuyers || 0}</div>
            <p className="text-xs text-muted-foreground">Active buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.approvedProducts || 0} approved, {stats?.pendingProducts || 0} pending, {stats?.suspendedProducts || 0} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingUserApprovals || 0}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Products</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejectedProducts || 0}</div>
            <p className="text-xs text-muted-foreground">In reject section</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Suppliers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.rejectedSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">In reject section</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Supplier Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-supplier-management">
            <Link href="/admin/suppliers">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Supplier Management
                  </CardTitle>
                  {!notificationCountsLoading && notificationCounts && notificationCounts.suppliers > 0 && (
                    <Badge variant="destructive" className="min-w-5 h-5 px-1.5 flex items-center justify-center text-xs">
                      {notificationCounts.suppliers}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage supplier registrations, approvals, and verification</p>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.pendingUserApprovals || 0} pending approvals
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Product Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-product-management">
            <Link href="/admin/products">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-green-500" />
                    Product Management
                  </CardTitle>
                  {!notificationCountsLoading && notificationCounts && notificationCounts.products > 0 && (
                    <Badge variant="destructive" className="min-w-5 h-5 px-1.5 flex items-center justify-center text-xs">
                      {notificationCounts.products}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Review product listings, approvals, and quality control</p>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.pendingProducts || 0} pending reviews
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Blog Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-blog-management">
            <Link href="/admin/blog">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-500" />
                    Blog Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Create and manage blog posts for the platform</p>
                <div className="mt-2 text-xs text-gray-500">
                  Content management system
                </div>
              </CardContent>
            </Link>
          </Card>
          
          {/* Category Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-category-management">
            <Link href="/admin/categories">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Grid className="h-5 w-5 mr-2 text-orange-500" />
                    Category Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Organize and manage product categories</p>
                <div className="mt-2 text-xs text-gray-500">
                  Product classification system
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Second Row of Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
          {/* Buyer Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-buyer-management">
            <Link href="/admin/buyers">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-indigo-500" />
                    Buyer Management
                  </CardTitle>
                  {!notificationCountsLoading && notificationCounts && notificationCounts.buyers > 0 && (
                    <Badge variant="destructive" className="min-w-5 h-5 px-1.5 flex items-center justify-center text-xs">
                      {notificationCounts.buyers}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage buyer accounts and platform activities</p>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.totalBuyers || 0} registered buyers
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Inquiry Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-inquiry-management">
            <Link href="/admin/inquiries">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-teal-500" />
                    Inquiry Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Review and approve buyer-supplier inquiries</p>
                <div className="mt-2 text-xs text-gray-500">
                  Communication oversight
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      {/* Quick Actions Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Supplier Applications:</span>
                  <Badge variant="outline">{stats?.pendingUserApprovals || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Product Reviews:</span>
                  <Badge variant="outline">{stats?.pendingProducts || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Approved Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Verified Suppliers:</span>
                  <Badge variant="default">{stats?.verifiedSuppliers || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Live Products:</span>
                  <Badge variant="default">{stats?.approvedProducts || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Issues & Rejections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Rejected Suppliers:</span>
                  <Badge variant="destructive">{stats?.rejectedSuppliers || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rejected Products:</span>
                  <Badge variant="destructive">{stats?.rejectedProducts || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simplified Content Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity & Quick Overview</h2>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Actions</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="buyers">Buyers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Welcome to the TradeConnect Admin Dashboard. Use the management sections above to handle supplier and product approvals.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats?.totalSuppliers || 0}</div>
                      <div className="text-sm text-gray-500">Total Suppliers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats?.totalProducts || 0}</div>
                      <div className="text-sm text-gray-500">Total Products</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Actions Tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Administrative Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Recent actions and audit logs will be displayed here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Inquiry management functionality will be displayed here.</p>
                  <p className="text-sm mt-2">Use the dedicated management sections above for detailed operations.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buyers Tab */}
          <TabsContent value="buyers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Buyer management functionality will be displayed here.</p>
                  <p className="text-sm mt-2">Use the dedicated management sections above for detailed operations.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      </div>
    </SimpleNavigationLayout>
  );
}