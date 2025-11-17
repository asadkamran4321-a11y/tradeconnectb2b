import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminDocumentPreviewModal from "@/components/modals/admin-document-preview-modal";
import AdminFactoryPhotosModal from "@/components/modals/admin-factory-photos-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, XCircle, Clock, Eye, ArrowLeft, Building2, Mail, Calendar, Package, AlertTriangle, UserCheck, Info, UserX, Trash2 } from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";
import type { Supplier } from "@shared/schema";

// Using shared Supplier type from schema - includes email, productCount from API response
type AdminSupplier = Supplier & {
  email: string;
  productCount: number;
};

type SupplierStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  deleted: number;
};

export default function SupplierManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedSupplier, setSelectedSupplier] = useState<AdminSupplier | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [viewInfoSupplier, setViewInfoSupplier] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [documentPreview, setDocumentPreview] = useState<{url: string, title: string, filename: string} | null>(null);
  const [factoryPhotosPreview, setFactoryPhotosPreview] = useState<{url: string, companyName: string} | null>(null);
  const [isViewInfoModalOpen, setIsViewInfoModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
  }, [setLocation]);

  // Fetch supplier statistics
  const { data: supplierStats, isLoading: statsLoading } = useQuery<SupplierStats>({
    queryKey: ['/api/admin/suppliers/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers/stats', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch all suppliers
  const { data: allSuppliers, isLoading: suppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['/api/admin/suppliers/all'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch pending suppliers
  const { data: pendingSuppliers, isLoading: pendingSuppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['/api/admin/suppliers/pending'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers/pending', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch rejected suppliers
  const { data: rejectedSuppliers, isLoading: rejectedSuppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['/api/admin/suppliers/rejected'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers/rejected', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });
  
  // Fetch suspended suppliers
  const { data: suspendedSuppliers, isLoading: suspendedSuppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['/api/admin/suppliers/suspended'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers/suspended', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });
  
  // Fetch deleted suppliers
  const { data: deletedSuppliers, isLoading: deletedSuppliersLoading } = useQuery<AdminSupplier[]>({
    queryKey: ['/api/admin/suppliers/deleted'],
    queryFn: async () => {
      return await apiRequest('/api/admin/suppliers/deleted', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Supplier approval mutation
  const approveSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/approve`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve supplier",
        variant: "destructive",
      });
    },
  });

  // Supplier rejection mutation
  const rejectSupplierMutation = useMutation({
    mutationFn: async ({ supplierId, reason }: { supplierId: number; reason: string }) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/reject`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
      setSelectedSupplier(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject supplier",
        variant: "destructive",
      });
    },
  });

  // Supplier restore mutation (for rejected suppliers)
  const restoreSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/restore`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier restored to pending status",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore supplier",
        variant: "destructive",
      });
    },
  });

  // Fetch detailed supplier information for the modal
  const fetchSupplierDetails = async (supplierId: number) => {
    try {
      const response = await apiRequest(`/api/admin/suppliers/${supplierId}/profile`, 'GET', undefined, adminAuthService.getAuthHeaders());
      setViewInfoSupplier(response);
      setIsViewInfoModalOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch supplier details",
        variant: "destructive",
      });
    }
  };

  // Suspend supplier mutation
  const suspendSupplierMutation = useMutation({
    mutationFn: async ({ supplierId, reason }: { supplierId: number; reason: string }) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/suspend`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier account suspended successfully. They have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/suspended'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
      setSuspendReason("");
      setIsSuspendModalOpen(false);
      setSelectedSupplier(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend supplier",
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/delete`, 'DELETE', undefined, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier account deleted successfully. They have been notified via email.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/suspended'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  // Activate supplier mutation
  const activateSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/activate`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier account activated successfully. They have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/suspended'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate supplier",
        variant: "destructive",
      });
    },
  });

  const handleRejectSupplier = () => {
    if (!selectedSupplier || !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    rejectSupplierMutation.mutate({
      supplierId: selectedSupplier.id,
      reason: reviewNotes.trim(),
    });
  };

  const getSuppliersByTab = () => {
    switch (activeTab) {
      case "pending":
        return pendingSuppliers || [];
      case "approved":
        return (allSuppliers || []).filter(s => s.verified);
      case "rejected":
        return rejectedSuppliers || [];
      case "suspended":
        return suspendedSuppliers || [];
      case "deleted":
        return deletedSuppliers || [];
      case "all":
        return allSuppliers || [];
      default:
        return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "pending":
        return pendingSuppliersLoading;
      case "approved":
        return suppliersLoading;
      case "rejected":
        return rejectedSuppliersLoading;
      case "suspended":
        return suspendedSuppliersLoading;
      case "deleted":
        return deletedSuppliersLoading;
      case "all":
        return suppliersLoading;
      default:
        return false;
    }
  };

  if (statsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading supplier management...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="supplier-management">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supplier Management</h1>
        <p className="text-gray-600">Manage supplier registrations, approvals, and verifications</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-suppliers">
              {supplierStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending-suppliers">
              {supplierStats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-approved-suppliers">
              {supplierStats?.approved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Verified suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-rejected-suppliers">
              {supplierStats?.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">Declined applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-suspended-suppliers">
              {supplierStats?.suspended || 0}
            </div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted</CardTitle>
            <Trash2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600" data-testid="stat-deleted-suppliers">
              {supplierStats?.deleted || 0}
            </div>
            <p className="text-xs text-muted-foreground">Permanently removed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="pending" className="relative" data-testid="tab-pending-suppliers">
                Pending Approval
                {supplierStats && supplierStats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {supplierStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved-suppliers">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected-suppliers">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="suspended" className="text-red-600" data-testid="tab-suspended-suppliers">
                Suspended Accounts
              </TabsTrigger>
              <TabsTrigger value="deleted" className="text-red-600" data-testid="tab-deleted-suppliers">
                Deleted Accounts
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all-suppliers">
                All Suppliers
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading() ? (
                <div className="text-center py-8">Loading suppliers...</div>
              ) : getSuppliersByTab().length > 0 ? (
                <div className="space-y-4">
                  {getSuppliersByTab().map((supplier) => (
                    <div key={supplier.id} className="border rounded-lg p-6" data-testid={`supplier-card-${supplier.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center" data-testid={`supplier-name-${supplier.id}`}>
                                <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                                {supplier.companyName}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="h-4 w-4 mr-2" />
                                {supplier.email}
                              </p>
                              {supplier.primaryContactName && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Contact: {supplier.primaryContactName}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={
                                  activeTab === "pending" ? "outline" :
                                  activeTab === "suspended" ? "destructive" :
                                  activeTab === "deleted" ? "secondary" :
                                  supplier.verified ? "default" : 
                                  supplier.status === "rejected" ? "destructive" : "secondary"
                                }
                                data-testid={`supplier-status-${supplier.id}`}
                              >
                                {activeTab === "pending" ? "Pending" :
                                 activeTab === "suspended" ? "Suspended" :
                                 activeTab === "deleted" ? "Deleted" :
                                 supplier.verified ? "Approved" : 
                                 supplier.status === "rejected" ? "Rejected" : "Unknown"}
                              </Badge>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Package className="h-4 w-4 mr-1" />
                                  {supplier.productCount || 0} products
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Joined: {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {supplier.description && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700 line-clamp-2">{supplier.description}</p>
                            </div>
                          )}

                          {supplier.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <strong>Rejection Reason:</strong> {supplier.rejectionReason}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            {supplier.mainProductCategory && (
                              <div>
                                <span className="font-medium">Category:</span> {supplier.mainProductCategory}
                              </div>
                            )}
                            {supplier.website && (
                              <div>
                                <span className="font-medium">Website:</span> 
                                <a href={supplier.website} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline ml-1">
                                  {supplier.website}
                                </a>
                              </div>
                            )}
                            {supplier.yearEstablished && (
                              <div>
                                <span className="font-medium">Established:</span> {supplier.yearEstablished}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        {activeTab === "pending" && (
                          <>
                            <Button
                              onClick={() => approveSupplierMutation.mutate(supplier.id)}
                              disabled={approveSupplierMutation.isPending || rejectSupplierMutation.isPending}
                              size="sm"
                              data-testid={`button-approve-${supplier.id}`}
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
                                    setSelectedSupplier(supplier);
                                    setReviewNotes("");
                                  }}
                                  data-testid={`button-reject-${supplier.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Supplier Application</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      You are about to reject the supplier application for <strong>{supplier.companyName}</strong>.
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                                    <Textarea
                                      id="rejection-reason"
                                      placeholder="Please provide a detailed reason for rejecting this supplier application..."
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      rows={4}
                                      data-testid="textarea-rejection-reason"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={handleRejectSupplier}
                                      disabled={!reviewNotes.trim() || rejectSupplierMutation.isPending}
                                      data-testid="button-confirm-reject"
                                    >
                                      {rejectSupplierMutation.isPending ? "Rejecting..." : "Reject Supplier"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {activeTab === "rejected" && (
                          <Button
                            onClick={() => restoreSupplierMutation.mutate(supplier.id)}
                            disabled={restoreSupplierMutation.isPending}
                            size="sm"
                            data-testid={`button-restore-${supplier.id}`}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Restore to Pending
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSupplierDetails(supplier.id)}
                          data-testid={`button-view-information-${supplier.id}`}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          View Information
                        </Button>

                        {/* Suspend/Activate Account */}
                        {supplier.status !== 'suspended' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-500 text-orange-700 hover:bg-orange-50"
                                data-testid={`button-suspend-${supplier.id}`}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspend Supplier Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to suspend {supplier.companyName}'s account? They will be notified and won't be able to access their dashboard until reactivated.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <Label htmlFor="suspend-reason">Reason for Suspension</Label>
                                <Textarea
                                  id="suspend-reason"
                                  placeholder="Please provide a reason for suspending this account..."
                                  value={suspendReason}
                                  onChange={(e) => setSuspendReason(e.target.value)}
                                  rows={3}
                                  data-testid="textarea-suspend-reason"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setSuspendReason("")}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (suspendReason.trim()) {
                                      suspendSupplierMutation.mutate({
                                        supplierId: supplier.id,
                                        reason: suspendReason.trim()
                                      });
                                    } else {
                                      toast({
                                        title: "Error",
                                        description: "Please provide a reason for suspension",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={!suspendReason.trim() || suspendSupplierMutation.isPending}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  {suspendSupplierMutation.isPending ? "Suspending..." : "Suspend Account"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-700 hover:bg-green-50"
                                data-testid={`button-activate-${supplier.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Activate Supplier Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to activate {supplier.companyName}'s account? They will regain access to their dashboard and be notified.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => activateSupplierMutation.mutate(supplier.id)}
                                  disabled={activateSupplierMutation.isPending}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  {activateSupplierMutation.isPending ? "Activating..." : "Activate Account"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Delete Account */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-${supplier.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Supplier Account</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>⚠️ <strong>This action cannot be undone.</strong></p>
                                <p>Are you sure you want to permanently delete {supplier.companyName}'s account? This will:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Delete all account data and products</li>
                                  <li>Send an email notification to the supplier</li>
                                  <li>Remove all associated data from the platform</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                                disabled={deleteSupplierMutation.isPending}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {deleteSupplierMutation.isPending ? "Deleting..." : "Delete Account"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-view-profile-${supplier.id}`}
                        >
                          <Link href={`/suppliers/${supplier.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No suppliers found</p>
                  <p>
                    {activeTab === "pending" && "No suppliers are currently pending approval."}
                    {activeTab === "approved" && "No suppliers have been approved yet."}
                    {activeTab === "rejected" && "No suppliers have been rejected."}
                    {activeTab === "all" && "No suppliers have registered yet."}
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Information Modal */}
      <Dialog open={isViewInfoModalOpen} onOpenChange={setIsViewInfoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Supplier Account Information
            </DialogTitle>
          </DialogHeader>
          
          {viewInfoSupplier && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company Name:</strong> {viewInfoSupplier.companyName}</div>
                    <div><strong>Email:</strong> {viewInfoSupplier.email}</div>
                    <div><strong>Contact Person:</strong> {viewInfoSupplier.primaryContactName || viewInfoSupplier.contactName || 'N/A'}</div>
                    <div><strong>Phone:</strong> {viewInfoSupplier.contactPhone || viewInfoSupplier.phone || 'N/A'}</div>
                    <div><strong>Website:</strong> {(viewInfoSupplier.companyWebsite || viewInfoSupplier.website) ? (
                      <a href={viewInfoSupplier.companyWebsite || viewInfoSupplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {viewInfoSupplier.companyWebsite || viewInfoSupplier.website}
                      </a>
                    ) : 'N/A'}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Business Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Industry:</strong> {viewInfoSupplier.mainProductCategory || viewInfoSupplier.industry || 'N/A'}</div>
                    <div><strong>Business Type:</strong> {viewInfoSupplier.legalEntityType || viewInfoSupplier.businessType || 'N/A'}</div>
                    <div><strong>Year Established:</strong> {viewInfoSupplier.yearEstablished || 'N/A'}</div>
                    <div><strong>Employee Count:</strong> {viewInfoSupplier.employeeCount || 'N/A'}</div>
                    <div><strong>Status:</strong> 
                      <Badge className="ml-2" variant={viewInfoSupplier.verified ? 'default' : 'secondary'}>
                        {viewInfoSupplier.verified ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Location & Contact</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Address:</strong> {viewInfoSupplier.registeredBusinessAddress || viewInfoSupplier.address || 'N/A'}</div>
                  <div><strong>City:</strong> {viewInfoSupplier.cityOfRegistration || viewInfoSupplier.city || 'N/A'}</div>
                  <div><strong>Country:</strong> {viewInfoSupplier.countryOfRegistration || viewInfoSupplier.country || 'N/A'}</div>
                  <div><strong>Postal Code:</strong> {viewInfoSupplier.postalCode || 'N/A'}</div>
                </div>
              </div>
              
              {/* Legal & Compliance */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Legal & Compliance</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Business License:</strong> {viewInfoSupplier.businessLicenseUrl ? (
                    <button 
                      onClick={() => setDocumentPreview({url: viewInfoSupplier.businessLicenseUrl, title: 'Business License', filename: viewInfoSupplier.businessLicenseFileName || 'business-license.pdf'})}
                      className="text-blue-600 hover:text-blue-800 underline ml-1"
                      data-testid="button-view-business-license"
                    >
                      View Document
                    </button>
                  ) : (viewInfoSupplier.businessLicense || 'N/A')}</div>
                  <div><strong>Tax ID:</strong> {viewInfoSupplier.vatTaxId || viewInfoSupplier.taxId || 'N/A'}</div>
                  <div><strong>Registration Number:</strong> {viewInfoSupplier.businessRegistrationNumber || viewInfoSupplier.businessRegistration || 'N/A'}</div>
                  <div><strong>Compliance Certificates:</strong> {viewInfoSupplier.productCertificationsUrl ? (
                    <button 
                      onClick={() => setDocumentPreview({url: viewInfoSupplier.productCertificationsUrl, title: 'Product Certifications', filename: viewInfoSupplier.productCertificationsFileName || 'certifications.pdf'})}
                      className="text-blue-600 hover:text-blue-800 underline ml-1"
                      data-testid="button-view-certifications"
                    >
                      View Document
                    </button>
                  ) : (viewInfoSupplier.complianceCertificates || 'N/A')}</div>
                </div>
              </div>
              
              {/* Products & Services */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Products & Services</h3>
                <div className="text-sm space-y-2">
                  <div><strong>Primary Products:</strong> {viewInfoSupplier.mainProductCategory || viewInfoSupplier.primaryProducts || 'N/A'}</div>
                  <div><strong>Total Products:</strong> {viewInfoSupplier.productsCount || viewInfoSupplier.productCount || 0}</div>
                  <div><strong>Description:</strong></div>
                  <div className="bg-gray-50 p-3 rounded border text-gray-700">
                    {viewInfoSupplier.description || viewInfoSupplier.companyDescription || 'No description provided'}
                  </div>
                </div>
              </div>
              
              {/* Shipping Information */}
              {(viewInfoSupplier.shippingMethods || viewInfoSupplier.deliveryTime) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Shipping & Delivery</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Shipping Methods:</strong> {viewInfoSupplier.shippingMethods || 'N/A'}</div>
                    <div><strong>Delivery Time:</strong> {viewInfoSupplier.deliveryTime || 'N/A'}</div>
                    <div><strong>Payment Terms:</strong> {viewInfoSupplier.paymentTerms || 'N/A'}</div>
                    <div><strong>Minimum Order:</strong> {viewInfoSupplier.minimumOrder || 'N/A'}</div>
                  </div>
                </div>
              )}
              
              {/* Uploaded Documents */}
              {(viewInfoSupplier.businessLicenseFile || viewInfoSupplier.certificatesFile || viewInfoSupplier.companyLogoFile) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Uploaded Documents</h3>
                  <div className="space-y-2 text-sm">
                    {viewInfoSupplier.businessLicenseFile && (
                      <div className="flex items-center gap-2">
                        <strong>Business License:</strong>
                        <a href={viewInfoSupplier.businessLicenseFile} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Document
                        </a>
                      </div>
                    )}
                    {viewInfoSupplier.certificatesFile && (
                      <div className="flex items-center gap-2">
                        <strong>Certificates:</strong>
                        <a href={viewInfoSupplier.certificatesFile} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Document
                        </a>
                      </div>
                    )}
                    {viewInfoSupplier.companyLogoFile && (
                      <div className="flex items-center gap-2">
                        <strong>Company Logo:</strong>
                        <a href={viewInfoSupplier.companyLogoFile} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Image
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Factory Photos */}
              {viewInfoSupplier.factoryPhotosUrl && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Factory Photos</h3>
                  <div className="text-sm">
                    <button 
                      onClick={() => setFactoryPhotosPreview({url: viewInfoSupplier.factoryPhotosUrl, companyName: viewInfoSupplier.companyName})}
                      className="text-blue-600 hover:text-blue-800 underline"
                      data-testid="button-view-factory-photos"
                    >
                      View Factory Photos
                    </button>
                  </div>
                </div>
              )}
              
              {/* Account Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Account Created:</strong> {new Date(viewInfoSupplier.createdAt).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(viewInfoSupplier.updatedAt).toLocaleDateString()}</div>
                  <div><strong>Email Verified:</strong> 
                    <Badge className="ml-2" variant={viewInfoSupplier.emailVerified ? 'default' : 'secondary'}>
                      {viewInfoSupplier.emailVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div><strong>Account Approved:</strong> 
                    <Badge className="ml-2" variant={viewInfoSupplier.approved ? 'default' : 'secondary'}>
                      {viewInfoSupplier.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Document Preview Modal */}
      {documentPreview && (
        <AdminDocumentPreviewModal
          isOpen={!!documentPreview}
          onClose={() => setDocumentPreview(null)}
          documentUrl={documentPreview.url}
          documentTitle={documentPreview.title}
          fileName={documentPreview.filename}
        />
      )}
      
      {/* Factory Photos Modal */}
      {factoryPhotosPreview && (
        <AdminFactoryPhotosModal
          isOpen={!!factoryPhotosPreview}
          onClose={() => setFactoryPhotosPreview(null)}
          photosUrl={factoryPhotosPreview.url}
          companyName={factoryPhotosPreview.companyName}
        />
      )}
    </div>
    </SimpleNavigationLayout>
  );
}