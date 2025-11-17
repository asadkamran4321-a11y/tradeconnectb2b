import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Building, 
  Contact, 
  Globe, 
  FileText, 
  Package,
  ExternalLink,
  Download,
  Eye,
  Clock
} from "lucide-react";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";

type SupplierDetail = {
  id: number;
  userId: number;
  companyName: string;
  businessRegistrationNumber: string;
  countryOfRegistration: string;
  cityOfRegistration: string;
  yearEstablished: number;
  legalEntityType: string;
  registeredBusinessAddress: string;
  vatTaxId?: string;
  primaryContactName: string;
  contactJobTitle: string;
  contactPhone: string;
  contactEmail: string;
  companyWebsite: string;
  whatsappNumber?: string;
  socialMediaLinkedIn?: string;
  socialMediaYoutube?: string;
  socialMediaFacebook?: string;
  socialMediaTiktok?: string;
  socialMediaInstagram?: string;
  mainProductCategory: string;
  businessLicenseUrl?: string;
  businessLicenseFileName?: string;
  productCertificationsUrl?: string;
  productCertificationsFileName?: string;
  exportImportLicenseUrl?: string;
  exportImportLicenseFileName?: string;
  companyProfileUrl?: string;
  companyProfileFileName?: string;
  factoryPhotosUrl?: string;
  factoryPhotosFileName?: string;
  introVideoUrl?: string;
  introVideoFileName?: string;
  verified: boolean;
  status: 'pending_approval' | 'active' | 'rejected';
  onboardingCompleted: boolean;
  createdAt: string;
  rejectionReason?: string;
};

export default function SupplierVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetail | null>(null);

  // Check admin authentication
  if (!adminAuthService.isAuthenticated()) {
    setLocation('/admin');
    return null;
  }

  // Fetch all suppliers
  const { data: suppliers, isLoading } = useQuery<SupplierDetail[]>({
    queryKey: ['/api/admin/suppliers'],
  });

  // Verify supplier mutation
  const verifyMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/verify`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Supplier Verified",
        description: "The supplier has been successfully verified and can now list products.",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reject supplier mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ supplierId, reason }: { supplierId: number, reason: string }) => {
      return await apiRequest(`/api/admin/suppliers/${supplierId}/reject`, 'POST', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setRejectionReason("");
      setSelectedSupplier(null);
      toast({
        title: "Supplier Rejected",
        description: "The supplier has been notified and can resubmit their profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleVerify = (supplierId: number) => {
    verifyMutation.mutate(supplierId);
  };

  const handleReject = (supplier: SupplierDetail) => {
    setSelectedSupplier(supplier);
  };

  const confirmReject = () => {
    if (selectedSupplier && rejectionReason.trim()) {
      rejectMutation.mutate({
        supplierId: selectedSupplier.id,
        reason: rejectionReason.trim()
      });
    }
  };

  const getStatusBadge = (supplier: SupplierDetail) => {
    if (supplier.verified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    }
    if (supplier.status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    }
    if (supplier.onboardingCompleted) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>;
  };

  const formatFileUrl = (url?: string) => {
    if (!url) return null;
    return url.startsWith('/uploads/') ? url : `/uploads/${url}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading supplier verification data...</div>
        </div>
      </div>
    );
  }

  const pendingSuppliers = suppliers?.filter(s => s.onboardingCompleted && !s.verified && s.status !== 'rejected') || [];
  const rejectedSuppliers = suppliers?.filter(s => s.status === 'rejected') || [];
  const verifiedSuppliers = suppliers?.filter(s => s.verified) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Verification</h1>
          <p className="text-gray-600">Review and verify supplier applications</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingSuppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{verifiedSuppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedSuppliers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900">{suppliers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Suppliers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Verification ({pendingSuppliers.length})</h2>
          <div className="space-y-4">
            {pendingSuppliers.map((supplier) => (
              <Card key={supplier.id} className="overflow-hidden">
                <CardHeader className="bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.companyName}</CardTitle>
                      <p className="text-sm text-gray-600">{supplier.contactEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(supplier)}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerify(supplier.id)}
                          disabled={verifyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(supplier)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Company Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Registration Number:</span>
                          <span className="ml-2 text-gray-600">{supplier.businessRegistrationNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium">Country:</span>
                          <span className="ml-2 text-gray-600">{supplier.countryOfRegistration}</span>
                        </div>
                        <div>
                          <span className="font-medium">City:</span>
                          <span className="ml-2 text-gray-600">{supplier.cityOfRegistration}</span>
                        </div>
                        <div>
                          <span className="font-medium">Year Established:</span>
                          <span className="ml-2 text-gray-600">{supplier.yearEstablished}</span>
                        </div>
                        <div>
                          <span className="font-medium">Legal Entity:</span>
                          <span className="ml-2 text-gray-600">{supplier.legalEntityType}</span>
                        </div>
                        <div>
                          <span className="font-medium">Address:</span>
                          <span className="ml-2 text-gray-600">{supplier.registeredBusinessAddress}</span>
                        </div>
                        {supplier.vatTaxId && (
                          <div>
                            <span className="font-medium">VAT/Tax ID:</span>
                            <span className="ml-2 text-gray-600">{supplier.vatTaxId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Contact className="h-4 w-4" />
                        Contact Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Primary Contact:</span>
                          <span className="ml-2 text-gray-600">{supplier.primaryContactName}</span>
                        </div>
                        <div>
                          <span className="font-medium">Job Title:</span>
                          <span className="ml-2 text-gray-600">{supplier.contactJobTitle}</span>
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>
                          <span className="ml-2 text-gray-600">{supplier.contactPhone}</span>
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>
                          <span className="ml-2 text-gray-600">{supplier.contactEmail}</span>
                        </div>
                        <div>
                          <span className="font-medium">Website:</span>
                          <a href={supplier.companyWebsite} target="_blank" rel="noopener noreferrer" 
                             className="ml-2 text-blue-600 hover:underline flex items-center gap-1">
                            {supplier.companyWebsite}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {supplier.whatsappNumber && (
                          <div>
                            <span className="font-medium">WhatsApp:</span>
                            <span className="ml-2 text-gray-600">{supplier.whatsappNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Social Media */}
                      {(supplier.socialMediaLinkedIn || supplier.socialMediaYoutube || supplier.socialMediaFacebook || 
                        supplier.socialMediaTiktok || supplier.socialMediaInstagram) && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Social Media</h4>
                          <div className="space-y-1 text-sm">
                            {supplier.socialMediaLinkedIn && (
                              <div>
                                <span className="font-medium">LinkedIn:</span>
                                <a href={supplier.socialMediaLinkedIn} target="_blank" rel="noopener noreferrer" 
                                   className="ml-2 text-blue-600 hover:underline">
                                  View Profile
                                </a>
                              </div>
                            )}
                            {supplier.socialMediaYoutube && (
                              <div>
                                <span className="font-medium">YouTube:</span>
                                <a href={supplier.socialMediaYoutube} target="_blank" rel="noopener noreferrer" 
                                   className="ml-2 text-blue-600 hover:underline">
                                  View Channel
                                </a>
                              </div>
                            )}
                            {supplier.socialMediaFacebook && (
                              <div>
                                <span className="font-medium">Facebook:</span>
                                <a href={supplier.socialMediaFacebook} target="_blank" rel="noopener noreferrer" 
                                   className="ml-2 text-blue-600 hover:underline">
                                  View Page
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Details & Documents */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Business Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Main Category:</span>
                          <span className="ml-2 text-gray-600">{supplier.mainProductCategory}</span>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documents
                        </h4>
                        <div className="space-y-2">
                          {supplier.businessLicenseUrl && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Business License</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.businessLicenseUrl)} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.businessLicenseUrl)} download>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {supplier.productCertificationsUrl && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Product Certifications</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.productCertificationsUrl)} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.productCertificationsUrl)} download>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}

                          {supplier.exportImportLicenseUrl && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Export/Import License</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.exportImportLicenseUrl)} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.exportImportLicenseUrl)} download>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}

                          {supplier.companyProfileUrl && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Company Profile</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.companyProfileUrl)} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={formatFileUrl(supplier.companyProfileUrl)} download>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Registration Date:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(supplier.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Profile Completion:</span>
                        <span className="ml-2 text-green-600">Complete</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingSuppliers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No Pending Suppliers</p>
                    <p className="text-sm">All suppliers have been reviewed.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Rejection Dialog */}
        <Dialog open={selectedSupplier !== null} onOpenChange={() => setSelectedSupplier(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Supplier: {selectedSupplier?.companyName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSupplier(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmReject}
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}