import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Contact, 
  Package, 
  FileCheck, 
  Upload, 
  Truck, 
  FileText,
  AlertCircle,
  CheckCircle,
  Save,
  Send,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Validation schema
const supplierOnboardingSchema = z.object({
  // Company Information (Required)
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationNumber: z.string().min(1, "Business registration number is required"),
  countryOfRegistration: z.string().min(1, "Country is required"),
  cityOfRegistration: z.string().min(1, "City is required"),
  yearEstablished: z.number().min(1800, "Invalid year").max(new Date().getFullYear(), "Cannot be future year"),
  legalEntityType: z.string().min(1, "Legal entity type is required"),
  registeredBusinessAddress: z.string().min(1, "Registered address is required"),
  vatTaxId: z.string().optional(),

  // Contact Information (Required)
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  contactJobTitle: z.string().min(1, "Contact job title is required"),
  contactPhone: z.string().min(1, "Contact phone number is required"),
  contactEmail: z.string().email("Valid email is required"),
  companyWebsite: z.string().url("Valid website URL is required"),
  
  // Optional contact info
  whatsappNumber: z.string().optional(),
  socialMediaLinkedIn: z.string().optional(),
  socialMediaYoutube: z.string().optional(),
  socialMediaFacebook: z.string().optional(),
  socialMediaTiktok: z.string().optional(),
  socialMediaInstagram: z.string().optional(),

  // Main Product Category (Required)
  mainProductCategory: z.string().min(1, "Main product category is required"),

  // File uploads (Required: Business License)
  businessLicenseUrl: z.string().min(1, "Business license is required"),
  businessLicenseFileName: z.string().optional(),
  
  // Optional file uploads
  productCertificationsUrl: z.string().optional(),
  productCertificationsFileName: z.string().optional(),
  exportImportLicenseUrl: z.string().optional(),
  exportImportLicenseFileName: z.string().optional(),
  companyProfileUrl: z.string().optional(),
  companyProfileFileName: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  companyLogoFileName: z.string().optional(),
  factoryPhotosUrl: z.string().optional(),
  factoryPhotosFileName: z.string().optional(),
  auditReportsUrl: z.string().optional(),
  auditReportsFileName: z.string().optional(),
  introVideoUrl: z.string().optional(),

  // Agreements (Required)
  agreesToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms of Service" }) }),
  agreesToPrivacy: z.literal(true, { errorMap: () => ({ message: "You must agree to the Privacy Policy" }) }),
  declaresInfoAccurate: z.literal(true, { errorMap: () => ({ message: "You must declare that information is accurate" }) })
});

type SupplierOnboardingData = z.infer<typeof supplierOnboardingSchema>;

const legalEntityTypes = [
  "Corporation",
  "Limited Liability Company (LLC)", 
  "Partnership",
  "Sole Proprietorship",
  "Cooperative",
  "Non-Profit Organization",
  "Other"
];

export default function EnhancedSupplierOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraft, setIsDraft] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<SupplierOnboardingData>({
    resolver: zodResolver(supplierOnboardingSchema),
    defaultValues: {
      agreesToTerms: undefined,
      agreesToPrivacy: undefined,
      declaresInfoAccurate: undefined
    }
  });

  // Load categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories']
  });

  // Load draft data
  const { data: supplier } = useQuery<any>({
    queryKey: ['/api/profile/supplier']
  });

  // Load draft data or rejected profile data on component mount
  useEffect(() => {
    if (supplier?.profileDraftData) {
      try {
        const draftData = JSON.parse(supplier.profileDraftData);
        form.reset(draftData);
        setIsDraft(true);
      } catch (error) {
        console.error('Failed to load draft data:', error);
      }
    } else if (supplier?.status === 'rejected' && supplier.onboardingCompleted) {
      // Load existing profile data for rejected suppliers to allow modification
      const existingData = {
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
        productCategories: supplier.productCategories || [],
        // Initialize checkboxes as undefined for proper validation
        agreesToTerms: undefined,
        agreesToPrivacy: undefined,
        declaresInfoAccurate: undefined,
      };
      form.reset(existingData);
    }
  }, [supplier, form]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form.formState.isDirty]);

  const saveDraft = async () => {
    try {
      const draftData = form.getValues();
      await apiRequest('/api/suppliers/save-draft', 'POST', { 
        profileDraftData: JSON.stringify(draftData) 
      });
      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Your progress has been automatically saved",
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

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
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        form.setValue(fieldName as any, result.url);
        form.setValue((fieldName.replace('Url', 'FileName')) as any, file.name);
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Upload Failed", 
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(prev => prev.filter(f => f !== fieldName));
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: SupplierOnboardingData) => {
      console.log('Sending data to API:', data);
      
      // Get user ID for authentication headers
      const userId = (user as any)?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      return await apiRequest('/api/suppliers/complete-onboarding', 'POST', data, {
        'user-id': userId.toString(),
        'Content-Type': 'application/json'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/supplier'] });
      toast({
        title: "Profile Submitted",
        description: "Your supplier profile has been submitted for review",
      });
      window.location.href = '/supplier/verification-pending';
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    console.log('Form submission started with data:', data);
    console.log('Form errors:', form.formState.errors);
    
    // Validate checkboxes before submission
    if (!data.agreesToTerms || !data.agreesToPrivacy || !data.declaresInfoAccurate) {
      toast({
        title: "Please accept all agreements",
        description: "You must accept all terms and agreements to submit your profile",
        variant: "destructive"
      });
      return;
    }
    
    submitMutation.mutate(data);
  };

  // Step validation functions
  const validateStep = (stepNumber: number): boolean => {
    const values = form.getValues();
    
    switch (stepNumber) {
      case 1: // Company Information
        return !!(values.companyName && 
                 values.businessRegistrationNumber && 
                 values.countryOfRegistration && 
                 values.cityOfRegistration && 
                 values.yearEstablished && 
                 values.legalEntityType && 
                 values.registeredBusinessAddress);
      
      case 2: // Contact Information
        return !!(values.primaryContactName && 
                 values.contactJobTitle && 
                 values.contactPhone && 
                 values.contactEmail && 
                 values.companyWebsite);
      
      case 3: // Product Category
        return !!(values.mainProductCategory);
      
      case 4: // Compliance & Legal
        return !!(values.businessLicenseUrl);
      
      case 5: // Additional Information (optional)
        return true; // No required fields in this step
      
      case 6: // Agreements
        return !!(values.agreesToTerms && values.agreesToPrivacy && values.declaresInfoAccurate);
      
      default:
        return false;
    }
  };

  // Check if user can navigate to a specific step
  const canNavigateToStep = (stepNumber: number): boolean => {
    if (stepNumber <= currentStep) return true; // Can go back
    if (stepNumber === currentStep + 1) {
      return completedSteps.includes(currentStep) || validateStep(currentStep);
    }
    return false; // Can't skip steps
  };

  // Update completed steps when current step is valid
  useEffect(() => {
    if (validateStep(currentStep) && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
  }, [form.watch(), currentStep, completedSteps]);

  const steps = [
    { number: 1, title: "Company Information", icon: Building },
    { number: 2, title: "Contact Information", icon: Contact },
    { number: 3, title: "Product Category", icon: Package },
    { number: 4, title: "Compliance & Legal", icon: FileCheck },
    { number: 5, title: "Additional Information", icon: Upload },
    { number: 6, title: "Agreements", icon: FileText }
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            {supplier?.status === 'rejected' ? 'Update Your Supplier Profile' : 'Complete Your Supplier Profile'}
          </h1>
          <p className="text-center text-neutral-600 mb-6">
            {supplier?.status === 'rejected' 
              ? 'Please review and update your information based on the feedback provided'
              : 'Fill out all required information to start listing your products'
            }
          </p>
          
          {isDraft && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You have a saved draft. You can continue where you left off.
              </AlertDescription>
            </Alert>
          )}

          {supplier?.status === 'rejected' && supplier?.rejectionReason && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Profile Rejected:</strong> {supplier.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          <Progress value={progress} className="mb-6" />
          
          {/* Step Completion Status */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}: {validateStep(currentStep) ? '✓ Complete' : 'Incomplete'}
            </p>
            {!validateStep(currentStep) && currentStep < steps.length && (
              <p className="text-xs text-red-600 mt-1">
                Fill in all required fields to proceed to the next step
              </p>
            )}
          </div>
          
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps.includes(step.number);
              const canNavigate = canNavigateToStep(step.number);
              
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-red-100 text-red-600' :
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    canNavigate ? 'bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100' :
                    'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => canNavigate && setCurrentStep(step.number)}
                  title={!canNavigate ? 'Complete previous steps first' : ''}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs text-center">{step.title}</span>
                  {isCompleted && <CheckCircle className="h-3 w-3 mt-1" />}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep - 1]?.icon && (() => {
                  const IconComponent = steps[currentStep - 1].icon;
                  return <IconComponent className="h-5 w-5" />;
                })()}
                Step {currentStep}: {steps[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Enter your company's basic information and registration details"}
                {currentStep === 2 && "Provide contact information for your company"}
                {currentStep === 3 && "Select your main product category"}
                {currentStep === 4 && "Upload required legal documents and certifications"}
                {currentStep === 5 && "Add additional company information and media"}
                {currentStep === 6 && "Review and accept our terms and policies"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1: Company Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        {...form.register("companyName")}
                        placeholder="Enter your company name"
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
                        placeholder="Enter registration number"
                      />
                      {form.formState.errors.businessRegistrationNumber && (
                        <p className="text-sm text-red-600">{form.formState.errors.businessRegistrationNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="countryOfRegistration">Country *</Label>
                      <Input
                        id="countryOfRegistration"
                        {...form.register("countryOfRegistration")}
                        placeholder="Enter country"
                      />
                      {form.formState.errors.countryOfRegistration && (
                        <p className="text-sm text-red-600">{form.formState.errors.countryOfRegistration.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="cityOfRegistration">City *</Label>
                      <Input
                        id="cityOfRegistration"
                        {...form.register("cityOfRegistration")}
                        placeholder="Enter city"
                      />
                      {form.formState.errors.cityOfRegistration && (
                        <p className="text-sm text-red-600">{form.formState.errors.cityOfRegistration.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearEstablished">Year Established *</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        {...form.register("yearEstablished", { valueAsNumber: true })}
                        placeholder="e.g., 2010"
                      />
                      {form.formState.errors.yearEstablished && (
                        <p className="text-sm text-red-600">{form.formState.errors.yearEstablished.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="legalEntityType">Legal Entity Type *</Label>
                      <Select onValueChange={(value) => form.setValue("legalEntityType", value)}>
                        <SelectTrigger>
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
                      placeholder="Enter complete business address"
                      rows={3}
                    />
                    {form.formState.errors.registeredBusinessAddress && (
                      <p className="text-sm text-red-600">{form.formState.errors.registeredBusinessAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="vatTaxId">VAT/Tax ID (Optional)</Label>
                    <Input
                      id="vatTaxId"
                      {...form.register("vatTaxId")}
                      placeholder="Enter VAT or Tax ID if applicable"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                      <Input
                        id="primaryContactName"
                        {...form.register("primaryContactName")}
                        placeholder="Enter contact person name"
                      />
                      {form.formState.errors.primaryContactName && (
                        <p className="text-sm text-red-600">{form.formState.errors.primaryContactName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="contactJobTitle">Contact Job Title *</Label>
                      <Input
                        id="contactJobTitle"
                        {...form.register("contactJobTitle")}
                        placeholder="e.g., Sales Manager"
                      />
                      {form.formState.errors.contactJobTitle && (
                        <p className="text-sm text-red-600">{form.formState.errors.contactJobTitle.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone Number *</Label>
                      <Input
                        id="contactPhone"
                        {...form.register("contactPhone")}
                        placeholder="Enter phone number with country code"
                      />
                      {form.formState.errors.contactPhone && (
                        <p className="text-sm text-red-600">{form.formState.errors.contactPhone.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="contactEmail">Contact Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...form.register("contactEmail")}
                        placeholder="Enter business email"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companyWebsite">Company Website *</Label>
                    <Input
                      id="companyWebsite"
                      {...form.register("companyWebsite")}
                      placeholder="https://www.yourcompany.com"
                    />
                    {form.formState.errors.companyWebsite && (
                      <p className="text-sm text-red-600">{form.formState.errors.companyWebsite.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsappNumber">WhatsApp Number (Optional)</Label>
                      <Input
                        id="whatsappNumber"
                        {...form.register("whatsappNumber")}
                        placeholder="Enter WhatsApp number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="socialMediaLinkedIn">LinkedIn (Optional)</Label>
                      <Input
                        id="socialMediaLinkedIn"
                        {...form.register("socialMediaLinkedIn")}
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialMediaYoutube">YouTube (Optional)</Label>
                      <Input
                        id="socialMediaYoutube"
                        {...form.register("socialMediaYoutube")}
                        placeholder="YouTube channel URL"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="socialMediaFacebook">Facebook (Optional)</Label>
                      <Input
                        id="socialMediaFacebook"
                        {...form.register("socialMediaFacebook")}
                        placeholder="Facebook page URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialMediaTiktok">TikTok (Optional)</Label>
                      <Input
                        id="socialMediaTiktok"
                        {...form.register("socialMediaTiktok")}
                        placeholder="TikTok profile URL"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="socialMediaInstagram">Instagram (Optional)</Label>
                      <Input
                        id="socialMediaInstagram"
                        {...form.register("socialMediaInstagram")}
                        placeholder="Instagram profile URL"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Product Category */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mainProductCategory">Main Product Category *</Label>
                    <Select onValueChange={(value) => form.setValue("mainProductCategory", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your main product category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category: any) => (
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
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Choose the category that best represents your primary product offerings. You can add additional categories later when creating product listings.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 4: Compliance & Legal */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">Business License * (Required)</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload your business registration certificate or license (Max 5MB)</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'businessLicenseUrl');
                            }}
                            className="hidden"
                            id="businessLicense"
                          />
                          <Label 
                            htmlFor="businessLicense" 
                            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md inline-flex items-center"
                          >
                            {uploadingFiles.includes('businessLicenseUrl') ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </Label>
                          <p className="text-sm text-gray-500">PDF, JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                      
                      {form.watch("businessLicenseUrl") && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-700">
                              {form.watch("businessLicenseFileName") || "File uploaded successfully"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(form.watch("businessLicenseUrl"), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {form.formState.errors.businessLicenseUrl && (
                      <p className="text-sm text-red-600">{form.formState.errors.businessLicenseUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Product Certifications (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload relevant product certifications (ISO, CE, etc.)</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'productCertificationsUrl');
                        }}
                        className="hidden"
                        id="productCertifications"
                      />
                      <Label 
                        htmlFor="productCertifications" 
                        className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                      >
                        {uploadingFiles.includes('productCertificationsUrl') ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </Label>
                      
                      {form.watch("productCertificationsUrl") && (
                        <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                          <span className="text-sm text-green-700">
                            {form.watch("productCertificationsFileName") || "File uploaded"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(form.watch("productCertificationsUrl"), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Export/Import License (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload if applicable to your business</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'exportImportLicenseUrl');
                        }}
                        className="hidden"
                        id="exportImportLicense"
                      />
                      <Label 
                        htmlFor="exportImportLicense" 
                        className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                      >
                        {uploadingFiles.includes('exportImportLicenseUrl') ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </Label>
                      
                      {form.watch("exportImportLicenseUrl") && (
                        <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                          <span className="text-sm text-green-700">
                            {form.watch("exportImportLicenseFileName") || "File uploaded"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(form.watch("exportImportLicenseUrl"), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Additional Information */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold">Company Profile/Brochure (Optional)</Label>
                      <p className="text-sm text-gray-600 mb-3">PDF brochure or company profile</p>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'companyProfileUrl');
                          }}
                          className="hidden"
                          id="companyProfile"
                        />
                        <Label 
                          htmlFor="companyProfile" 
                          className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                        >
                          {uploadingFiles.includes('companyProfileUrl') ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose PDF
                            </>
                          )}
                        </Label>
                        
                        {form.watch("companyProfileUrl") && (
                          <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                            <span className="text-sm text-green-700">
                              {form.watch("companyProfileFileName") || "PDF uploaded"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(form.watch("companyProfileUrl"), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Company Logo (Optional)</Label>
                      <p className="text-sm text-gray-600 mb-3">Upload your company logo</p>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'companyLogoUrl');
                          }}
                          className="hidden"
                          id="companyLogo"
                        />
                        <Label 
                          htmlFor="companyLogo" 
                          className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                        >
                          {uploadingFiles.includes('companyLogoUrl') ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Image
                            </>
                          )}
                        </Label>
                        
                        {form.watch("companyLogoUrl") && (
                          <div className="mt-2">
                            <img 
                              src={form.watch("companyLogoUrl")} 
                              alt="Company Logo" 
                              className="w-24 h-24 object-contain mx-auto rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Factory/Office/Team Photos (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload photos of your facilities or team</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'factoryPhotosUrl');
                        }}
                        className="hidden"
                        id="factoryPhotos"
                      />
                      <Label 
                        htmlFor="factoryPhotos" 
                        className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                      >
                        {uploadingFiles.includes('factoryPhotosUrl') ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Images
                          </>
                        )}
                      </Label>
                      
                      {form.watch("factoryPhotosUrl") && (
                        <div className="mt-2">
                          <img 
                            src={form.watch("factoryPhotosUrl")} 
                            alt="Factory Photos" 
                            className="w-32 h-24 object-cover mx-auto rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Introductory Company Video (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-3">YouTube or Vimeo URL for company introduction video</p>
                    <Input
                      {...form.register("introVideoUrl")}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Third-party Audit Reports (Optional)</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload any third-party audit or quality reports</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'auditReportsUrl');
                        }}
                        className="hidden"
                        id="auditReports"
                      />
                      <Label 
                        htmlFor="auditReports" 
                        className="cursor-pointer flex items-center justify-center p-4 hover:bg-gray-50"
                      >
                        {uploadingFiles.includes('auditReportsUrl') ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose PDF
                          </>
                        )}
                      </Label>
                      
                      {form.watch("auditReportsUrl") && (
                        <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                          <span className="text-sm text-green-700">
                            {form.watch("auditReportsFileName") || "Report uploaded"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(form.watch("auditReportsUrl"), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Agreements */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please review and accept the following agreements to complete your supplier profile.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id="declaresInfoAccurate"
                        checked={form.watch("declaresInfoAccurate") === true}
                        onCheckedChange={(checked) => form.setValue("declaresInfoAccurate", checked as true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="declaresInfoAccurate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Information Declaration *
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I declare that all the information provided is true and accurate to the best of my knowledge.
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.declaresInfoAccurate && (
                      <p className="text-sm text-red-600">{form.formState.errors.declaresInfoAccurate.message}</p>
                    )}

                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id="agreesToTerms"
                        checked={form.watch("agreesToTerms") === true}
                        onCheckedChange={(checked) => form.setValue("agreesToTerms", checked as true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="agreesToTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Terms of Service *
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I have read and agree to the{" "}
                          <a href="/terms-of-service" target="_blank" className="text-red-600 hover:underline">
                            Terms of Service
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.agreesToTerms && (
                      <p className="text-sm text-red-600">{form.formState.errors.agreesToTerms.message}</p>
                    )}

                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id="agreesToPrivacy"
                        checked={form.watch("agreesToPrivacy") === true}
                        onCheckedChange={(checked) => form.setValue("agreesToPrivacy", checked as true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="agreesToPrivacy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Privacy Policy *
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I have read and agree to the{" "}
                          <a href="/privacy-policy" target="_blank" className="text-red-600 hover:underline">
                            Privacy Policy
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.agreesToPrivacy && (
                      <p className="text-sm text-red-600">{form.formState.errors.agreesToPrivacy.message}</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          After submitting your profile, it will be reviewed by our team. You will be notified via email once the review is complete. Only approved suppliers can list products on our platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveDraft}
                    disabled={!form.formState.isDirty}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                </div>

                <div className="flex gap-2">
                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep(currentStep)) {
                          setCurrentStep(currentStep + 1);
                        } else {
                          toast({
                            title: "Please complete all required fields",
                            description: "Fill in all required information before proceeding to the next step",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={!validateStep(currentStep)}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        console.log('Submit button clicked!');
                        e.preventDefault();
                        const formData = form.getValues();
                        console.log('Current form data:', formData);
                        console.log('Form errors:', form.formState.errors);
                        onSubmit(formData);
                      }}
                    >
                      {submitMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {supplier?.status === 'rejected' ? 'Resubmit Profile' : 'Submit Profile'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}