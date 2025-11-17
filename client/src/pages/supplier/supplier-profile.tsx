import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Building, 
  Contact, 
  Globe, 
  FileText, 
  Package,
  Edit,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Upload
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierOnboardingSchema, type SupplierOnboardingData } from "@shared/schema";

type SupplierProfile = {
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

const legalEntityTypes = [
  "Corporation",
  "Limited Liability Company (LLC)", 
  "Partnership",
  "Sole Proprietorship",
  "Cooperative",
  "Non-Profit Organization",
  "Other"
];

export default function SupplierProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const form = useForm<SupplierOnboardingData>({
    resolver: zodResolver(supplierOnboardingSchema),
    defaultValues: {
      agreesToTerms: true,
      agreesToPrivacy: true,
      declaresInfoAccurate: true
    }
  });

  // Fetch supplier profile
  const { data: supplier, isLoading } = useQuery<SupplierProfile>({
    queryKey: ['/api/profile/supplier'],
  });

  // Load categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories']
  });

  // Load form data when supplier data is available
  useEffect(() => {
    if (supplier) {
      const formData = {
        companyName: supplier.companyName || '',
        businessRegistrationNumber: supplier.businessRegistrationNumber || '',
        countryOfRegistration: supplier.countryOfRegistration || '',
        cityOfRegistration: supplier.cityOfRegistration || '',
        yearEstablished: supplier.yearEstablished || undefined,
        legalEntityType: supplier.legalEntityType || '',
        registeredBusinessAddress: supplier.registeredBusinessAddress || '',
        vatTaxId: supplier.vatTaxId || '',
        primaryContactName: supplier.primaryContactName || '',
        contactJobTitle: supplier.contactJobTitle || '',
        contactPhone: supplier.contactPhone || '',
        contactEmail: supplier.contactEmail || '',
        companyWebsite: supplier.companyWebsite || '',
        whatsappNumber: supplier.whatsappNumber || '',
        socialMediaLinkedIn: supplier.socialMediaLinkedIn || '',
        socialMediaYoutube: supplier.socialMediaYoutube || '',
        socialMediaFacebook: supplier.socialMediaFacebook || '',
        socialMediaTiktok: supplier.socialMediaTiktok || '',
        socialMediaInstagram: supplier.socialMediaInstagram || '',
        mainProductCategory: supplier.mainProductCategory || '',
        businessLicenseUrl: supplier.businessLicenseUrl || '',
        businessLicenseFileName: supplier.businessLicenseFileName || '',
        productCertificationsUrl: supplier.productCertificationsUrl || '',
        productCertificationsFileName: supplier.productCertificationsFileName || '',
        exportImportLicenseUrl: supplier.exportImportLicenseUrl || '',
        exportImportLicenseFileName: supplier.exportImportLicenseFileName || '',
        companyProfileUrl: supplier.companyProfileUrl || '',
        companyProfileFileName: supplier.companyProfileFileName || '',
        factoryPhotosUrl: supplier.factoryPhotosUrl || '',
        factoryPhotosFileName: supplier.factoryPhotosFileName || '',
        introVideoUrl: supplier.introVideoUrl || '',
        introVideoFileName: supplier.introVideoFileName || '',
        agreesToTerms: true,
        agreesToPrivacy: true,
        declaresInfoAccurate: true,
      };
      form.reset(formData);
    }
  }, [supplier, form]);

  // File upload handler
  const handleFileUpload = async (file: File, fieldName: string) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "File size must not exceed 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(prev => [...prev, fieldName]);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      form.setValue(fieldName as any, result.url);
      form.setValue(`${fieldName}FileName` as any, file.name);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(prev => prev.filter(f => f !== fieldName));
    }
  };

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SupplierOnboardingData) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      return await apiRequest(`/api/suppliers/${supplier?.id}`, 'PUT', data, {
        'user-id': user.id.toString(),
        'Content-Type': 'application/json'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/supplier'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated and submitted for review",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SupplierOnboardingData) => {
    updateMutation.mutate(data);
  };

  const getStatusBadge = () => {
    if (!supplier) return null;
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">Please complete your supplier onboarding first.</p>
            <Button onClick={() => setLocation('/supplier/enhanced-onboarding')}>
              Complete Onboarding
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/supplier/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Profile</h1>
              <p className="text-gray-600">Manage your company profile and verification status</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge()}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className={isEditing ? "" : "bg-blue-600 hover:bg-blue-700"}
              >
                {isEditing ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {supplier.status === 'rejected' && supplier.rejectionReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Profile Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">{supplier.rejectionReason}</p>
                  <p className="text-sm text-red-700 mt-2">Please update your profile and resubmit for review.</p>
                </div>
              </div>
            </div>
          )}

          {supplier.status === 'pending_approval' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Profile Under Review</h3>
                  <p className="text-sm text-yellow-700 mt-1">Your profile is currently being reviewed by our team. You will be notified once the review is complete.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    {...form.register("companyName")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="businessRegistrationNumber">Business Registration Number *</Label>
                  <Input
                    id="businessRegistrationNumber"
                    {...form.register("businessRegistrationNumber")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.businessRegistrationNumber && (
                    <p className="text-sm text-red-600">{form.formState.errors.businessRegistrationNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="countryOfRegistration">Country of Registration *</Label>
                  <Input
                    id="countryOfRegistration"
                    {...form.register("countryOfRegistration")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.countryOfRegistration && (
                    <p className="text-sm text-red-600">{form.formState.errors.countryOfRegistration.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cityOfRegistration">City of Registration *</Label>
                  <Input
                    id="cityOfRegistration"
                    {...form.register("cityOfRegistration")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.cityOfRegistration && (
                    <p className="text-sm text-red-600">{form.formState.errors.cityOfRegistration.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="yearEstablished">Year Established *</Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    {...form.register("yearEstablished", { valueAsNumber: true })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.yearEstablished && (
                    <p className="text-sm text-red-600">{form.formState.errors.yearEstablished.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="legalEntityType">Legal Entity Type *</Label>
                  <Select 
                    value={form.watch("legalEntityType")} 
                    onValueChange={(value) => form.setValue("legalEntityType", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {legalEntityTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.legalEntityType && (
                    <p className="text-sm text-red-600">{form.formState.errors.legalEntityType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="registeredBusinessAddress">Registered Business Address *</Label>
                <Textarea
                  id="registeredBusinessAddress"
                  {...form.register("registeredBusinessAddress")}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  rows={3}
                />
                {form.formState.errors.registeredBusinessAddress && (
                  <p className="text-sm text-red-600">{form.formState.errors.registeredBusinessAddress.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vatTaxId">VAT/Tax ID</Label>
                <Input
                  id="vatTaxId"
                  {...form.register("vatTaxId")}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                  <Input
                    id="primaryContactName"
                    {...form.register("primaryContactName")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.primaryContactName && (
                    <p className="text-sm text-red-600">{form.formState.errors.primaryContactName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactJobTitle">Job Title *</Label>
                  <Input
                    id="contactJobTitle"
                    {...form.register("contactJobTitle")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.contactJobTitle && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactJobTitle.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <Input
                    id="contactPhone"
                    {...form.register("contactPhone")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.contactPhone && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactPhone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    {...form.register("contactEmail")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.contactEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyWebsite">Company Website *</Label>
                  <Input
                    id="companyWebsite"
                    {...form.register("companyWebsite")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                  {form.formState.errors.companyWebsite && (
                    <p className="text-sm text-red-600">{form.formState.errors.companyWebsite.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    {...form.register("whatsappNumber")}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="mainProductCategory">Main Product Category *</Label>
                <Select 
                  value={form.watch("mainProductCategory")} 
                  onValueChange={(value) => form.setValue("mainProductCategory", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue placeholder="Select main product category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.mainProductCategory && (
                  <p className="text-sm text-red-600">{form.formState.errors.mainProductCategory.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessLicense">Business License *</Label>
                <div className="mt-2">
                  {form.watch("businessLicenseUrl") ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                      <span className="text-sm">{form.watch("businessLicenseFileName") || "Business License"}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(form.watch("businessLicenseUrl"), '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {isEditing && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById('businessLicenseFile')?.click()}
                            disabled={uploadingFiles.includes('businessLicenseUrl')}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Replace
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('businessLicenseFile')?.click()}
                        disabled={uploadingFiles.includes('businessLicenseUrl')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFiles.includes('businessLicenseUrl') ? 'Uploading...' : 'Upload Business License'}
                      </Button>
                    )
                  )}
                  <input
                    id="businessLicenseFile"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'businessLicenseUrl');
                    }}
                  />
                </div>
                {form.formState.errors.businessLicenseUrl && (
                  <p className="text-sm text-red-600">{form.formState.errors.businessLicenseUrl.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}