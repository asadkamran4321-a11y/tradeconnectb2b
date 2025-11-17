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
import { Package, CheckCircle, XCircle, Clock, Eye, ArrowLeft, Building2, DollarSign, Calendar, Tag, AlertTriangle, RefreshCw } from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  supplier: {
    id: number;
    companyName: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  description?: string;
  specifications?: string;
  minOrderQuantity?: number;
  unit?: string;
  leadTime?: string;
  rejectionReason?: string;
  images?: string[];
};

type ProductStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
};

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Check admin authentication
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
  }, [setLocation]);

  // Fetch product statistics
  const { data: productStats, isLoading: statsLoading } = useQuery<ProductStats>({
    queryKey: ['/api/admin/products/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/stats', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch pending products
  const { data: pendingProducts, isLoading: pendingProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/pending'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/pending', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch approved products
  const { data: approvedProducts, isLoading: approvedProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/approved'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/approved', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch rejected products
  const { data: rejectedProducts, isLoading: rejectedProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/rejected'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/rejected', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch suspended products
  const { data: suspendedProducts, isLoading: suspendedProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/suspended'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/suspended', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch all products
  const { data: allProducts, isLoading: allProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products/all'],
    queryFn: async () => {
      return await apiRequest('/api/admin/products/all', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Product approval mutation
  const approveProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/admin/products/${productId}/approve`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve product",
        variant: "destructive",
      });
    },
  });

  // Product rejection mutation
  const rejectProductMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: number; reason: string }) => {
      return await apiRequest(`/api/admin/products/${productId}/reject`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
      setSelectedProduct(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject product",
        variant: "destructive",
      });
    },
  });

  // Product suspension mutation
  const suspendProductMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: number; reason: string }) => {
      return await apiRequest(`/api/admin/products/${productId}/suspend`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product suspended successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend product",
        variant: "destructive",
      });
    },
  });

  // Product restore mutation
  const restoreProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/admin/products/${productId}/restore`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product restored successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore product",
        variant: "destructive",
      });
    },
  });

  const handleRejectProduct = () => {
    if (!selectedProduct || !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    rejectProductMutation.mutate({
      productId: selectedProduct.id,
      reason: reviewNotes.trim(),
    });
  };

  const handleSuspendProduct = () => {
    if (!selectedProduct || !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for suspension",
        variant: "destructive",
      });
      return;
    }

    suspendProductMutation.mutate({
      productId: selectedProduct.id,
      reason: reviewNotes.trim(),
    });
  };

  const getProductsByTab = () => {
    switch (activeTab) {
      case "pending":
        return pendingProducts || [];
      case "approved":
        return approvedProducts || [];
      case "rejected":
        return rejectedProducts || [];
      case "suspended":
        return suspendedProducts || [];
      case "all":
        return allProducts || [];
      default:
        return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "pending":
        return pendingProductsLoading;
      case "approved":
        return approvedProductsLoading;
      case "rejected":
        return rejectedProductsLoading;
      case "suspended":
        return suspendedProductsLoading;
      case "all":
        return allProductsLoading;
      default:
        return false;
    }
  };

  const getStatusBadge = (product: Product) => {
    switch (product.status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "suspended":
        return <Badge variant="secondary">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (statsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading product management...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="product-management">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-gray-600">Manage product listings, approvals, and reviews</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-products">
              {productStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All product listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending-products">
              {productStats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-approved-products">
              {productStats?.approved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Live products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-rejected-products">
              {productStats?.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">Declined listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-suspended-products">
              {productStats?.suspended || 0}
            </div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending" className="relative" data-testid="tab-pending-products">
                Pending Review
                {productStats && productStats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {productStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved-products">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected-products">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="suspended" data-testid="tab-suspended-products">
                Suspended
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all-products">
                All Products
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading() ? (
                <div className="text-center py-8">Loading products...</div>
              ) : getProductsByTab().length > 0 ? (
                <div className="space-y-4">
                  {getProductsByTab().map((product) => (
                    <div key={product.id} className="border rounded-lg p-6" data-testid={`product-card-${product.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg flex items-center" data-testid={`product-name-${product.id}`}>
                                <Package className="h-5 w-5 mr-2 text-blue-500" />
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Tag className="h-4 w-4 mr-2" />
                                Category: {product.category}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Building2 className="h-4 w-4 mr-2" />
                                Supplier: {product.supplier?.companyName || 'Unknown Supplier'}
                                {product.supplier?.verified && (
                                  <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span data-testid={`product-status-${product.id}`}>
                                {getStatusBadge(product)}
                              </span>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-green-600 flex items-center">
                                  <DollarSign className="h-4 w-4" />
                                  {product.price.toFixed(2)}
                                  {product.unit && <span className="text-sm ml-1">/{product.unit}</span>}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Listed: {new Date(product.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {product.description && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700 line-clamp-2">{product.description}</p>
                            </div>
                          )}

                          {product.minOrderQuantity && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Min Order:</strong> {product.minOrderQuantity} {product.unit || 'units'}
                            </p>
                          )}

                          {product.leadTime && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Lead Time:</strong> {product.leadTime}
                            </p>
                          )}

                          {product.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <strong>Rejection Reason:</strong> {product.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        {activeTab === "pending" && (
                          <>
                            <Button
                              onClick={() => approveProductMutation.mutate(product.id)}
                              disabled={approveProductMutation.isPending}
                              size="sm"
                              data-testid={`button-approve-${product.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setReviewNotes("");
                                  }}
                                  data-testid={`button-reject-${product.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Product</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      You are about to reject the product <strong>{product.name}</strong>.
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                                    <Textarea
                                      id="rejection-reason"
                                      placeholder="Please provide a detailed reason for rejecting this product..."
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      rows={4}
                                      data-testid="textarea-rejection-reason"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={handleRejectProduct}
                                      disabled={!reviewNotes.trim() || rejectProductMutation.isPending}
                                      data-testid="button-confirm-reject"
                                    >
                                      {rejectProductMutation.isPending ? "Rejecting..." : "Reject Product"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {activeTab === "approved" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setReviewNotes("");
                                }}
                                data-testid={`button-suspend-${product.id}`}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Suspend
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Suspend Product</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    You are about to suspend the product <strong>{product.name}</strong>.
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor="suspension-reason">Reason for Suspension *</Label>
                                  <Textarea
                                    id="suspension-reason"
                                    placeholder="Please provide a detailed reason for suspending this product..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    rows={4}
                                    data-testid="textarea-suspension-reason"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={handleSuspendProduct}
                                    disabled={!reviewNotes.trim() || suspendProductMutation.isPending}
                                    data-testid="button-confirm-suspend"
                                  >
                                    {suspendProductMutation.isPending ? "Suspending..." : "Suspend Product"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {(activeTab === "rejected" || activeTab === "suspended") && (
                          <Button
                            onClick={() => restoreProductMutation.mutate(product.id)}
                            disabled={restoreProductMutation.isPending}
                            size="sm"
                            data-testid={`button-restore-${product.id}`}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {activeTab === "rejected" ? "Restore to Pending" : "Unsuspend"}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-view-product-${product.id}`}
                        >
                          <Link href={`/products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Product
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No products found</p>
                  <p>
                    {activeTab === "pending" && "No products are currently pending review."}
                    {activeTab === "approved" && "No products have been approved yet."}
                    {activeTab === "rejected" && "No products have been rejected."}
                    {activeTab === "suspended" && "No products are currently suspended."}
                    {activeTab === "all" && "No products have been listed yet."}
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </SimpleNavigationLayout>
  );
}