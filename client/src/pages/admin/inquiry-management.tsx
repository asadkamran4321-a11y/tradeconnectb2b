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
import { MessageSquare, ArrowLeft, Building2, Package, Calendar, CheckCircle, XCircle, Clock, Eye, AlertTriangle, MessageCircle, User, Mail, Phone, Globe, MapPin, Star, Shield, Truck } from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

type Inquiry = {
  id: number;
  buyerId: number;
  supplierId: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  buyerCompanyName: string;
  supplierCompanyName: string;
  productName: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  responses?: number;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
};

type DetailedInquiry = {
  id: number;
  buyerId: number;
  supplierId: number;
  productId?: number;
  subject: string;
  message: string;
  quantity?: number;
  status: string;
  adminApprovalStatus: string;
  supplierReply?: string;
  repliedAt?: string;
  buyerReply?: string;
  buyerRepliedAt?: string;
  createdAt: string;
  buyerCompanyName: string;
  buyerEmail: string;
  buyerPhone: string;
  supplierCompanyName: string;
  supplierEmail: string;
  supplierPhone: string;
  productName: string;
  productDescription?: string;
  productPrice?: number;
  rejectionReason?: string;
};

type DetailedSupplier = {
  id: number;
  userId: number;
  companyName: string;
  description?: string;
  location?: string;
  website?: string;
  phone?: string;
  verified: boolean;
  rating: string;
  profileImage?: string;
  businessRegistrationNumber?: string;
  countryOfRegistration?: string;
  cityOfRegistration?: string;
  yearEstablished?: number;
  legalEntityType?: string;
  vatTaxId?: string;
  registeredBusinessAddress?: string;
  primaryContactName?: string;
  contactJobTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyWebsite?: string;
  whatsappNumber?: string;
  socialMediaLinkedIn?: string;
  socialMediaYoutube?: string;
  socialMediaFacebook?: string;
  socialMediaTiktok?: string;
  socialMediaInstagram?: string;
  mainProductCategory?: string;
  shippingMethods?: string[];
  incotermsSupported?: string[];
  regionsShippedTo?: string[];
  keyClients?: string[];
  testimonials?: string;
  email: string;
  approved: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type InquiryStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  thisMonth: number;
};

export default function InquiryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [detailedInquiry, setDetailedInquiry] = useState<DetailedInquiry | null>(null);
  const [detailedSupplier, setDetailedSupplier] = useState<DetailedSupplier | null>(null);
  const [isInquiryDetailsOpen, setIsInquiryDetailsOpen] = useState(false);
  const [isSupplierProfileOpen, setIsSupplierProfileOpen] = useState(false);
  const [isLoadingInquiryDetails, setIsLoadingInquiryDetails] = useState(false);
  const [isLoadingSupplierProfile, setIsLoadingSupplierProfile] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      setLocation('/admin/login');
      return;
    }
  }, [setLocation]);

  // Fetch inquiry statistics
  const { data: inquiryStats, isLoading: statsLoading } = useQuery<InquiryStats>({
    queryKey: ['/api/admin/inquiries/stats'],
    queryFn: async () => {
      return await apiRequest('/api/admin/inquiries/stats', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch pending inquiries
  const { data: pendingInquiries, isLoading: pendingInquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/inquiries/pending'],
    queryFn: async () => {
      return await apiRequest('/api/admin/inquiries/pending', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch approved inquiries
  const { data: approvedInquiries, isLoading: approvedInquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/inquiries/approved'],
    queryFn: async () => {
      return await apiRequest('/api/admin/inquiries/approved', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch rejected inquiries
  const { data: rejectedInquiries, isLoading: rejectedInquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/inquiries/rejected'],
    queryFn: async () => {
      return await apiRequest('/api/admin/inquiries/rejected', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Fetch all inquiries
  const { data: allInquiries, isLoading: allInquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/inquiries/all'],
    queryFn: async () => {
      return await apiRequest('/api/admin/inquiries/all', 'GET', undefined, adminAuthService.getAuthHeaders());
    },
    retry: false,
  });

  // Inquiry approval mutation
  const approveInquiryMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      return await apiRequest(`/api/admin/inquiries/${inquiryId}/approve`, 'POST', {}, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inquiry approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve inquiry",
        variant: "destructive",
      });
    },
  });

  // Fetch detailed inquiry
  const fetchDetailedInquiry = async (inquiryId: number) => {
    setIsLoadingInquiryDetails(true);
    setIsInquiryDetailsOpen(true);
    try {
      const data = await apiRequest(`/api/admin/inquiries/${inquiryId}`, 'GET', undefined, adminAuthService.getAuthHeaders());
      setDetailedInquiry(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch inquiry details",
        variant: "destructive",
      });
      setIsInquiryDetailsOpen(false);
    } finally {
      setIsLoadingInquiryDetails(false);
    }
  };

  // Fetch detailed supplier profile
  const fetchDetailedSupplier = async (supplierId: number) => {
    setIsLoadingSupplierProfile(true);
    setIsSupplierProfileOpen(true);
    try {
      const data = await apiRequest(`/api/admin/suppliers/${supplierId}/profile`, 'GET', undefined, adminAuthService.getAuthHeaders());
      setDetailedSupplier(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch supplier profile",
        variant: "destructive",
      });
      setIsSupplierProfileOpen(false);
    } finally {
      setIsLoadingSupplierProfile(false);
    }
  };

  // Inquiry rejection mutation
  const rejectInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, reason }: { inquiryId: number; reason: string }) => {
      return await apiRequest(`/api/admin/inquiries/${inquiryId}/reject`, 'POST', { reason }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inquiry rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/rejected'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-counts'] });
      setSelectedInquiry(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject inquiry",
        variant: "destructive",
      });
    },
  });

  const handleRejectInquiry = () => {
    if (!selectedInquiry || !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    rejectInquiryMutation.mutate({
      inquiryId: selectedInquiry.id,
      reason: reviewNotes.trim(),
    });
  };

  const getInquiriesByTab = () => {
    switch (activeTab) {
      case "pending":
        return pendingInquiries || [];
      case "approved":
        return approvedInquiries || [];
      case "rejected":
        return rejectedInquiries || [];
      case "all":
        return allInquiries || [];
      default:
        return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "pending":
        return pendingInquiriesLoading;
      case "approved":
        return approvedInquiriesLoading;
      case "rejected":
        return rejectedInquiriesLoading;
      case "all":
        return allInquiriesLoading;
      default:
        return false;
    }
  };

  const getStatusBadge = (inquiry: Inquiry) => {
    switch (inquiry.status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  if (statsLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading inquiry management...</div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  return (
    <SimpleNavigationLayout>
      <div className="container mx-auto py-8" data-testid="inquiry-management">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Inquiry Management</h1>
        <p className="text-gray-600">Manage buyer-supplier inquiries and communication approval</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-inquiries">
              {inquiryStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending-inquiries">
              {inquiryStats?.pending || 0}
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
            <div className="text-2xl font-bold text-green-600" data-testid="stat-approved-inquiries">
              {inquiryStats?.approved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-rejected-inquiries">
              {inquiryStats?.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">Declined inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-monthly-inquiries">
              {inquiryStats?.thisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">New this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="relative" data-testid="tab-pending-inquiries">
                Pending Review
                {inquiryStats && inquiryStats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {inquiryStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved-inquiries">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected-inquiries">
                Rejected
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all-inquiries">
                All Inquiries
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {isLoading() ? (
                <div className="text-center py-8">Loading inquiries...</div>
              ) : getInquiriesByTab().length > 0 ? (
                <div className="space-y-4">
                  {getInquiriesByTab().map((inquiry) => (
                    <div key={inquiry.id} className="border rounded-lg p-6" data-testid={`inquiry-card-${inquiry.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg" data-testid={`inquiry-title-${inquiry.id}`}>
                                  Inquiry #{inquiry.id}
                                </h3>
                                <span data-testid={`inquiry-status-${inquiry.id}`}>
                                  {getStatusBadge(inquiry)}
                                </span>
                                {inquiry.priority && getPriorityBadge(inquiry.priority)}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                                  <span className="font-medium">Buyer:</span>
                                  <span className="ml-1">{inquiry.buyerCompanyName}</span>
                                </div>
                                <div className="flex items-center">
                                  <Building2 className="h-4 w-4 mr-2 text-green-500" />
                                  <span className="font-medium">Supplier:</span>
                                  <span className="ml-1">{inquiry.supplierCompanyName}</span>
                                </div>
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 mr-2 text-purple-500" />
                                  <span className="font-medium">Product:</span>
                                  <span className="ml-1">{inquiry.productName}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-600 flex items-center justify-end">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(inquiry.createdAt).toLocaleDateString()}
                              </p>
                              {inquiry.responses !== undefined && (
                                <p className="text-sm text-gray-600 flex items-center justify-end mt-1">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  {inquiry.responses} responses
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              <strong>Message:</strong> {inquiry.message}
                            </p>
                          </div>

                          {inquiry.rejectionReason && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <strong>Rejection Reason:</strong> {inquiry.rejectionReason}
                              </p>
                            </div>
                          )}

                          {inquiry.category && (
                            <div className="text-xs text-gray-500">
                              Category: {inquiry.category}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        {activeTab === "pending" && (
                          <>
                            <Button
                              onClick={() => approveInquiryMutation.mutate(inquiry.id)}
                              disabled={approveInquiryMutation.isPending}
                              size="sm"
                              data-testid={`button-approve-${inquiry.id}`}
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
                                    setSelectedInquiry(inquiry);
                                    setReviewNotes("");
                                  }}
                                  data-testid={`button-reject-${inquiry.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Inquiry</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      You are about to reject the inquiry from <strong>{inquiry.buyerCompanyName}</strong> about <strong>{inquiry.productName}</strong>.
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                                    <Textarea
                                      id="rejection-reason"
                                      placeholder="Please provide a detailed reason for rejecting this inquiry..."
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      rows={4}
                                      data-testid="textarea-rejection-reason"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={handleRejectInquiry}
                                      disabled={!reviewNotes.trim() || rejectInquiryMutation.isPending}
                                      data-testid="button-confirm-reject"
                                    >
                                      {rejectInquiryMutation.isPending ? "Rejecting..." : "Reject Inquiry"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchDetailedInquiry(inquiry.id)}
                          disabled={isLoadingInquiryDetails}
                          data-testid={`button-view-inquiry-details-${inquiry.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {isLoadingInquiryDetails ? "Loading..." : "View Details"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchDetailedSupplier(inquiry.supplierId)}
                          disabled={isLoadingSupplierProfile}
                          data-testid={`button-view-supplier-profile-${inquiry.id}`}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {isLoadingSupplierProfile ? "Loading..." : "View Supplier"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No inquiries found</p>
                  <p>
                    {activeTab === "pending" && "No inquiries are currently pending review."}
                    {activeTab === "approved" && "No inquiries have been approved yet."}
                    {activeTab === "rejected" && "No inquiries have been rejected."}
                    {activeTab === "all" && "No inquiries have been submitted yet."}
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Inquiry Modal */}
      <Dialog open={isInquiryDetailsOpen} onOpenChange={(open) => {
        setIsInquiryDetailsOpen(open);
        if (!open) {
          setDetailedInquiry(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-inquiry-details">
          <DialogHeader>
            <DialogTitle data-testid="modal-inquiry-title">
              {isLoadingInquiryDetails ? "Loading Inquiry Details..." : `Inquiry Details - #${detailedInquiry?.id || ''}`}
            </DialogTitle>
          </DialogHeader>
          {isLoadingInquiryDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading inquiry details...</p>
              </div>
            </div>
          ) : detailedInquiry ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Inquiry Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Subject:</strong> {detailedInquiry.subject}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        detailedInquiry.adminApprovalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        detailedInquiry.adminApprovalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {detailedInquiry.adminApprovalStatus}
                      </span>
                    </div>
                    <div><strong>Created:</strong> {new Date(detailedInquiry.createdAt).toLocaleString()}</div>
                    {detailedInquiry.quantity && <div><strong>Quantity:</strong> {detailedInquiry.quantity}</div>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Product Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Product:</strong> {detailedInquiry.productName}</div>
                    {detailedInquiry.productDescription && <div><strong>Description:</strong> {detailedInquiry.productDescription}</div>}
                    {detailedInquiry.productPrice && <div><strong>Price:</strong> ${detailedInquiry.productPrice}</div>}
                  </div>
                </div>
              </div>

              {/* Buyer & Supplier Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2 text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                    Buyer Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company:</strong> {detailedInquiry.buyerCompanyName}</div>
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-1" /><strong>Email:</strong> {detailedInquiry.buyerEmail}</div>
                    <div className="flex items-center"><Phone className="h-4 w-4 mr-1" /><strong>Phone:</strong> {detailedInquiry.buyerPhone}</div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2 text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-green-500" />
                    Supplier Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company:</strong> {detailedInquiry.supplierCompanyName}</div>
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-1" /><strong>Email:</strong> {detailedInquiry.supplierEmail}</div>
                    <div className="flex items-center"><Phone className="h-4 w-4 mr-1" /><strong>Phone:</strong> {detailedInquiry.supplierPhone}</div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="font-semibold mb-2 text-lg">Inquiry Message</h3>
                <div className="bg-gray-50 p-4 rounded text-sm">
                  {detailedInquiry.message}
                </div>
              </div>

              {/* Responses */}
              {(detailedInquiry.supplierReply || detailedInquiry.buyerReply) && (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Communication History</h3>
                  <div className="space-y-3">
                    {detailedInquiry.supplierReply && (
                      <div className="bg-green-50 p-4 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-green-800">Supplier Response</span>
                          {detailedInquiry.repliedAt && (
                            <span className="text-sm text-green-600">
                              {new Date(detailedInquiry.repliedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{detailedInquiry.supplierReply}</p>
                      </div>
                    )}
                    {detailedInquiry.buyerReply && (
                      <div className="bg-blue-50 p-4 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-800">Buyer Response</span>
                          {detailedInquiry.buyerRepliedAt && (
                            <span className="text-sm text-blue-600">
                              {new Date(detailedInquiry.buyerRepliedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{detailedInquiry.buyerReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {detailedInquiry.rejectionReason && (
                <div className="bg-red-50 p-4 rounded">
                  <h3 className="font-semibold mb-2 text-lg text-red-800">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{detailedInquiry.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Failed to load inquiry details. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => detailedInquiry && fetchDetailedInquiry(detailedInquiry.id)}
                data-testid="button-retry-inquiry"
              >
                Retry
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed Supplier Profile Modal */}
      <Dialog open={isSupplierProfileOpen} onOpenChange={(open) => {
        setIsSupplierProfileOpen(open);
        if (!open) {
          setDetailedSupplier(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="modal-supplier-profile">
          <DialogHeader>
            <DialogTitle data-testid="modal-supplier-title">
              {isLoadingSupplierProfile ? "Loading Supplier Profile..." : `Supplier Profile - ${detailedSupplier?.companyName || ''}`}
            </DialogTitle>
          </DialogHeader>
          {isLoadingSupplierProfile ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading supplier profile...</p>
              </div>
            </div>
          ) : detailedSupplier ? (
            <div className="space-y-6">
              {/* Company Overview */}
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{detailedSupplier.companyName}</h2>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        detailedSupplier.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {detailedSupplier.verified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        {detailedSupplier.rating}/5.0
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        detailedSupplier.approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {detailedSupplier.approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                    {detailedSupplier.description && (
                      <p className="text-gray-700 mb-3">{detailedSupplier.description}</p>
                    )}
                  </div>
                  {detailedSupplier.profileImage && (
                    <img 
                      src={detailedSupplier.profileImage} 
                      alt={detailedSupplier.companyName} 
                      className="w-20 h-20 rounded object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center"><Mail className="h-4 w-4 mr-2" /><strong>Email:</strong> {detailedSupplier.email}</div>
                    {detailedSupplier.contactEmail && detailedSupplier.contactEmail !== detailedSupplier.email && (
                      <div className="flex items-center"><Mail className="h-4 w-4 mr-2" /><strong>Contact Email:</strong> {detailedSupplier.contactEmail}</div>
                    )}
                    {detailedSupplier.phone && (
                      <div className="flex items-center"><Phone className="h-4 w-4 mr-2" /><strong>Phone:</strong> {detailedSupplier.phone}</div>
                    )}
                    {detailedSupplier.contactPhone && detailedSupplier.contactPhone !== detailedSupplier.phone && (
                      <div className="flex items-center"><Phone className="h-4 w-4 mr-2" /><strong>Contact Phone:</strong> {detailedSupplier.contactPhone}</div>
                    )}
                    {detailedSupplier.primaryContactName && (
                      <div><strong>Contact Person:</strong> {detailedSupplier.primaryContactName}</div>
                    )}
                    {detailedSupplier.contactJobTitle && (
                      <div><strong>Job Title:</strong> {detailedSupplier.contactJobTitle}</div>
                    )}
                    {detailedSupplier.whatsappNumber && (
                      <div><strong>WhatsApp:</strong> {detailedSupplier.whatsappNumber}</div>
                    )}
                    {detailedSupplier.website && (
                      <div className="flex items-center"><Globe className="h-4 w-4 mr-2" /><strong>Website:</strong> 
                        <a href={detailedSupplier.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                          {detailedSupplier.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-green-500" />
                    Company Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {detailedSupplier.location && (
                      <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" /><strong>Location:</strong> {detailedSupplier.location}</div>
                    )}
                    {detailedSupplier.yearEstablished && (
                      <div><strong>Established:</strong> {detailedSupplier.yearEstablished}</div>
                    )}
                    {detailedSupplier.legalEntityType && (
                      <div><strong>Entity Type:</strong> {detailedSupplier.legalEntityType}</div>
                    )}
                    {detailedSupplier.businessRegistrationNumber && (
                      <div><strong>Registration No:</strong> {detailedSupplier.businessRegistrationNumber}</div>
                    )}
                    {detailedSupplier.countryOfRegistration && (
                      <div><strong>Registered in:</strong> {detailedSupplier.countryOfRegistration}</div>
                    )}
                    {detailedSupplier.vatTaxId && (
                      <div><strong>VAT/Tax ID:</strong> {detailedSupplier.vatTaxId}</div>
                    )}
                    {detailedSupplier.mainProductCategory && (
                      <div><strong>Main Category:</strong> {detailedSupplier.mainProductCategory}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping & Services */}
              {(detailedSupplier.shippingMethods?.length || detailedSupplier.incotermsSupported?.length || detailedSupplier.regionsShippedTo?.length) && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-purple-500" />
                    Shipping & Services
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {detailedSupplier.shippingMethods?.length && (
                      <div>
                        <strong>Shipping Methods:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {detailedSupplier.shippingMethods.map((method, index) => (
                            <li key={index}>{method}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailedSupplier.incotermsSupported?.length && (
                      <div>
                        <strong>Incoterms:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {detailedSupplier.incotermsSupported.map((term, index) => (
                            <li key={index}>{term}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detailedSupplier.regionsShippedTo?.length && (
                      <div>
                        <strong>Shipping Regions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {detailedSupplier.regionsShippedTo.map((region, index) => (
                            <li key={index}>{region}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Clients & Testimonials */}
              {(detailedSupplier.keyClients?.length || detailedSupplier.testimonials) && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    References & Testimonials
                  </h3>
                  <div className="space-y-3">
                    {detailedSupplier.keyClients?.length && (
                      <div>
                        <strong className="text-sm">Key Clients:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {detailedSupplier.keyClients.map((client, index) => (
                            <span key={index} className="bg-gray-200 px-2 py-1 rounded text-xs">
                              {client}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {detailedSupplier.testimonials && (
                      <div>
                        <strong className="text-sm">Testimonials:</strong>
                        <div className="bg-gray-50 p-3 rounded mt-2 text-sm">
                          {detailedSupplier.testimonials}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(detailedSupplier.socialMediaLinkedIn || detailedSupplier.socialMediaFacebook || detailedSupplier.socialMediaYoutube) && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Social Media</h3>
                  <div className="flex gap-4 text-sm">
                    {detailedSupplier.socialMediaLinkedIn && (
                      <a href={detailedSupplier.socialMediaLinkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {detailedSupplier.socialMediaFacebook && (
                      <a href={detailedSupplier.socialMediaFacebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Facebook
                      </a>
                    )}
                    {detailedSupplier.socialMediaYoutube && (
                      <a href={detailedSupplier.socialMediaYoutube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                        YouTube
                      </a>
                    )}
                    {detailedSupplier.socialMediaInstagram && (
                      <a href={detailedSupplier.socialMediaInstagram} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        Instagram
                      </a>
                    )}
                    {detailedSupplier.socialMediaTiktok && (
                      <a href={detailedSupplier.socialMediaTiktok} target="_blank" rel="noopener noreferrer" className="text-black hover:underline">
                        TikTok
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2 text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Account Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><strong>Email Verified:</strong> {detailedSupplier.emailVerified ? 'Yes' : 'No'}</div>
                  <div><strong>Approved:</strong> {detailedSupplier.approved ? 'Yes' : 'No'}</div>
                  <div><strong>Member Since:</strong> {new Date(detailedSupplier.createdAt).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(detailedSupplier.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Failed to load supplier profile. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => detailedSupplier && fetchDetailedSupplier(detailedSupplier.id)}
                data-testid="button-retry-supplier"
              >
                Retry
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </SimpleNavigationLayout>
  );
}