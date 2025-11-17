import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, Building2, Mail, Calendar, Package, ShoppingBag, Eye, UserX, UserCheck, Info, Trash2 } from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type Buyer = {
  id: number;
  companyName: string;
  email: string;
  inquiryCount: number;
  savedProductCount: number;
  createdAt: string;
  updatedAt: string;
  contactPerson?: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  description?: string;
  status?: 'active' | 'suspended';
  suspensionReason?: string;
};

type BuyerStats = {
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
};

export default function BuyerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [viewInfoBuyer, setViewInfoBuyer] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isViewInfoModalOpen, setIsViewInfoModalOpen] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
  }, [setLocation]);

  // Fetch buyer statistics
  const { data: buyerStats, isLoading: statsLoading } = useQuery<BuyerStats>({
    queryKey: ['/api/admin/buyers/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/buyers/stats', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch all buyers
  const { data: allBuyers, isLoading: buyersLoading } = useQuery<Buyer[]>({
    queryKey: ['/api/admin/buyers/all'],
    queryFn: async () => {
      return await apiRequest('/api/admin/buyers', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });


  // Activate buyer mutation
  const activateBuyerMutation = useMutation({
    mutationFn: async (buyerId: number) => {
      return await apiRequest(`/api/admin/buyers/${buyerId}/activate`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Buyer account activated successfully. They have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate buyer",
        variant: "destructive",
      });
    },
  });

  // Fetch detailed buyer information for the modal
  const fetchBuyerDetails = async (buyerId: number) => {
    try {
      const response = await apiRequest(`/api/admin/buyers/${buyerId}/profile`, 'GET', undefined, adminAuthService.getAuthHeaders());
      setViewInfoBuyer(response);
      setIsViewInfoModalOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch buyer details",
        variant: "destructive",
      });
    }
  };

  // Enhanced suspend buyer mutation
  const enhancedSuspendBuyerMutation = useMutation({
    mutationFn: async ({ buyerId, reason }: { buyerId: number; reason: string }) => {
      return await apiRequest(`/api/admin/buyers/${buyerId}/suspend`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Buyer account suspended successfully. They have been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/stats'] });
      setSuspendReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend buyer",
        variant: "destructive",
      });
    },
  });

  // Delete buyer mutation
  const deleteBuyerMutation = useMutation({
    mutationFn: async (buyerId: number) => {
      return await apiRequest(`/api/admin/buyers/${buyerId}/delete`, 'DELETE', undefined, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Buyer account deleted successfully. They have been notified via email.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/buyers/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete buyer",
        variant: "destructive",
      });
    },
  });

  const getBuyersByTab = () => {
    if (!allBuyers) return [];
    
    switch (activeTab) {
      case "active":
        return allBuyers.filter(b => b.status !== 'suspended');
      case "suspended":
        return allBuyers.filter(b => b.status === 'suspended');
      case "all":
      default:
        return allBuyers;
    }
  };

  const isLoading = () => {
    return buyersLoading;
  };

  if (statsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading buyer management...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="buyer-management">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buyer Management</h1>
        <p className="text-gray-600">Manage buyer accounts, activities, and platform engagement</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-buyers">
              {buyerStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All registered buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-buyers">
              {buyerStats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-suspended-buyers">
              {buyerStats?.suspended || 0}
            </div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-new-buyers">
              {buyerStats?.newThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">Recent registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Buyer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" data-testid="tab-all-buyers">
                All Buyers
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active-buyers">
                Active
              </TabsTrigger>
              <TabsTrigger value="suspended" data-testid="tab-suspended-buyers">
                Suspended
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading() ? (
                <div className="text-center py-8">Loading buyers...</div>
              ) : getBuyersByTab().length > 0 ? (
                <div className="space-y-4">
                  {getBuyersByTab().map((buyer) => (
                    <div key={buyer.id} className="border rounded-lg p-6" data-testid={`buyer-card-${buyer.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center" data-testid={`buyer-name-${buyer.id}`}>
                                <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                                {buyer.companyName}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="h-4 w-4 mr-2" />
                                {buyer.email}
                              </p>
                              {buyer.contactPerson && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Contact: {buyer.contactPerson}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={buyer.status === "suspended" ? "destructive" : "default"}
                                data-testid={`buyer-status-${buyer.id}`}
                              >
                                {buyer.status === "suspended" ? "Suspended" : "Active"}
                              </Badge>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Package className="h-4 w-4 mr-1" />
                                  {buyer.inquiryCount || 0} inquiries
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <ShoppingBag className="h-4 w-4 mr-1" />
                                  {buyer.savedProductCount || 0} saved products
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Joined: {new Date(buyer.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {buyer.description && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-700 line-clamp-2">{buyer.description}</p>
                            </div>
                          )}

                          {buyer.suspensionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <strong>Suspension Reason:</strong> {buyer.suspensionReason}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            {buyer.industry && (
                              <div>
                                <span className="font-medium">Industry:</span> {buyer.industry}
                              </div>
                            )}
                            {buyer.website && (
                              <div>
                                <span className="font-medium">Website:</span> 
                                <a href={buyer.website} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline ml-1">
                                  {buyer.website}
                                </a>
                              </div>
                            )}
                            {buyer.employeeCount && (
                              <div>
                                <span className="font-medium">Employees:</span> {buyer.employeeCount}
                              </div>
                            )}
                            {buyer.phoneNumber && (
                              <div>
                                <span className="font-medium">Phone:</span> {buyer.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchBuyerDetails(buyer.id)}
                          data-testid={`button-view-information-${buyer.id}`}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          View Information
                        </Button>

                        {/* Suspend/Activate Account */}
                        {buyer.status !== 'suspended' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-500 text-orange-700 hover:bg-orange-50"
                                data-testid={`button-suspend-${buyer.id}`}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspend Buyer Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to suspend {buyer.companyName}'s account? They will be notified and won't be able to access their dashboard until reactivated.
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
                                      enhancedSuspendBuyerMutation.mutate({
                                        buyerId: buyer.id,
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
                                  disabled={!suspendReason.trim() || enhancedSuspendBuyerMutation.isPending}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  {enhancedSuspendBuyerMutation.isPending ? "Suspending..." : "Suspend Account"}
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
                                data-testid={`button-activate-${buyer.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Activate Buyer Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to activate {buyer.companyName}'s account? They will regain access to their dashboard and be notified.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => activateBuyerMutation.mutate(buyer.id)}
                                  disabled={activateBuyerMutation.isPending}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  {activateBuyerMutation.isPending ? "Activating..." : "Activate Account"}
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
                              data-testid={`button-delete-${buyer.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Buyer Account</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>⚠️ <strong>This action cannot be undone.</strong></p>
                                <p>Are you sure you want to permanently delete {buyer.companyName}'s account? This will:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Delete all account data and saved products</li>
                                  <li>Send an email notification to the buyer</li>
                                  <li>Remove all associated data from the platform</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBuyerMutation.mutate(buyer.id)}
                                disabled={deleteBuyerMutation.isPending}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {deleteBuyerMutation.isPending ? "Deleting..." : "Delete Account"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No buyers found</p>
                  <p>
                    {activeTab === "active" && "No active buyers found."}
                    {activeTab === "suspended" && "No suspended buyers found."}
                    {activeTab === "all" && "No buyers have registered yet."}
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
              Buyer Account Information
            </DialogTitle>
          </DialogHeader>
          
          {viewInfoBuyer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company Name:</strong> {viewInfoBuyer.companyName}</div>
                    <div><strong>Email:</strong> {viewInfoBuyer.email}</div>
                    <div><strong>Contact Person:</strong> {viewInfoBuyer.contactPerson || 'N/A'}</div>
                    <div><strong>Phone:</strong> {viewInfoBuyer.phoneNumber || 'N/A'}</div>
                    <div><strong>Website:</strong> {viewInfoBuyer.website ? (
                      <a href={viewInfoBuyer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {viewInfoBuyer.website}
                      </a>
                    ) : 'N/A'}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Business Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Industry:</strong> {viewInfoBuyer.industry || 'N/A'}</div>
                    <div><strong>Employee Count:</strong> {viewInfoBuyer.employeeCount || 'N/A'}</div>
                    <div><strong>Status:</strong> 
                      <Badge className="ml-2" variant={viewInfoBuyer.status === 'suspended' ? 'destructive' : 'default'}>
                        {viewInfoBuyer.status === 'suspended' ? 'Suspended' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Location & Contact</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Address:</strong> {viewInfoBuyer.address || 'N/A'}</div>
                  <div><strong>Phone Number:</strong> {viewInfoBuyer.phoneNumber || 'N/A'}</div>
                </div>
              </div>
              
              {/* Activity Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Platform Activity</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Total Inquiries:</strong> {viewInfoBuyer.inquiryCount || 0}</div>
                  <div><strong>Saved Products:</strong> {viewInfoBuyer.savedProductCount || 0}</div>
                </div>
              </div>
              
              {/* Company Description */}
              {viewInfoBuyer.description && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Company Description</h3>
                  <div className="text-sm">
                    <div className="bg-gray-50 p-3 rounded border text-gray-700">
                      {viewInfoBuyer.description}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Suspension Information */}
              {viewInfoBuyer.status === 'suspended' && viewInfoBuyer.suspensionReason && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2 text-red-600">Suspension Information</h3>
                  <div className="text-sm">
                    <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800">
                      <strong>Reason:</strong> {viewInfoBuyer.suspensionReason}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Account Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Account Created:</strong> {new Date(viewInfoBuyer.createdAt).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(viewInfoBuyer.updatedAt).toLocaleDateString()}</div>
                  <div><strong>Email Verified:</strong> 
                    <Badge className="ml-2" variant={viewInfoBuyer.emailVerified ? 'default' : 'secondary'}>
                      {viewInfoBuyer.emailVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div><strong>Account Approved:</strong> 
                    <Badge className="ml-2" variant={viewInfoBuyer.approved ? 'default' : 'secondary'}>
                      {viewInfoBuyer.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </SimpleNavigationLayout>
  );
}