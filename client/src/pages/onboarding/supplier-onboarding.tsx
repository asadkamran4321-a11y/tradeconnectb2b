import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { 
  Building2, 
  User, 
  Package, 
  FileText, 
  Upload, 
  Truck, 
  Users, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe
} from "lucide-react";

interface OnboardingData {
  // Company Information
  companyName: string;
  businessRegistrationNumber: string;
  countryOfRegistration: string;
  cityOfRegistration: string;
  yearEstablished: number | null;
  legalEntityType: string;
  vatTaxId: string;
  registeredBusinessAddress: string;
  
  // Contact Information
  primaryContactName: string;
  contactJobTitle: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  socialMediaLinkedIn: string;
  whatsappNumber: string;
  
  // Products & Services
  mainProductCategory: string;
  
  // Compliance & Legal
  businessLicenseUrl: string;
  productCertificationsUrl: string;
  exportImportLicenseUrl: string;
  
  // Additional Company Info
  companyProfileUrl: string;
  companyLogoUrl: string;
  factoryPhotosUrl: string;
  introVideoUrl: string;
  auditReportsUrl: string;
  
  // Shipping Methods
  shippingMethods: string[];
  incotermsSupported: string[];
  regionsShippedTo: string[];
  
  // References
  keyClients: string[];
  testimonials: string;
  
  // Agreements
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  declareAccuracy: boolean;
}

const steps = [
  { id: 1, title: "Company Information", icon: Building2 },
  { id: 2, title: "Contact Information", icon: User },
  { id: 3, title: "Products & Services", icon: Package },
  { id: 4, title: "Compliance & Legal", icon: FileText },
  { id: 5, title: "Additional Info", icon: Upload },
  { id: 6, title: "Shipping Methods", icon: Truck },
  { id: 7, title: "References", icon: Users },
];

export default function SupplierOnboarding() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<OnboardingData>({
    companyName: "",
    businessRegistrationNumber: "",
    countryOfRegistration: "",
    cityOfRegistration: "",
    yearEstablished: null,
    legalEntityType: "",
    vatTaxId: "",
    registeredBusinessAddress: "",
    primaryContactName: "",
    contactJobTitle: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    socialMediaLinkedIn: "",
    whatsappNumber: "",
    mainProductCategory: "",
    businessLicenseUrl: "",
    productCertificationsUrl: "",
    exportImportLicenseUrl: "",
    companyProfileUrl: "",
    companyLogoUrl: "",
    factoryPhotosUrl: "",
    introVideoUrl: "",
    auditReportsUrl: "",
    shippingMethods: [],
    incotermsSupported: [],
    regionsShippedTo: [],
    keyClients: [],
    testimonials: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
    declareAccuracy: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Load existing supplier data if in edit mode
  const { data: existingSupplier } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!user,
  });

  // Pre-populate form with existing data
  useEffect(() => {
    if (existingSupplier?.profile) {
      const profile = existingSupplier.profile;
      setFormData({
        companyName: profile.companyName || '',
        businessRegistrationNumber: profile.businessRegistrationNumber || '',
        countryOfRegistration: profile.countryOfRegistration || '',
        cityOfRegistration: profile.cityOfRegistration || '',
        yearEstablished: profile.yearEstablished || null,
        legalEntityType: profile.legalEntityType || '',
        vatTaxId: profile.vatTaxId || '',
        registeredBusinessAddress: profile.registeredBusinessAddress || '',
        primaryContactName: profile.primaryContactName || '',
        contactJobTitle: profile.contactJobTitle || '',
        contactEmail: profile.contactEmail || '',
        contactPhone: profile.contactPhone || '',
        website: profile.website || '',
        socialMediaLinkedIn: profile.socialMediaLinkedIn || '',
        whatsappNumber: profile.whatsappNumber || '',
        mainProductCategory: profile.mainProductCategory || '',
        businessLicenseUrl: profile.businessLicenseUrl || '',
        productCertificationsUrl: profile.productCertificationsUrl || '',
        exportImportLicenseUrl: profile.exportImportLicenseUrl || '',
        companyProfileUrl: profile.companyProfileUrl || '',
        companyLogoUrl: profile.companyLogoUrl || '',
        factoryPhotosUrl: profile.factoryPhotosUrl || '',
        introVideoUrl: profile.introVideoUrl || '',
        auditReportsUrl: profile.auditReportsUrl || '',
        shippingMethods: profile.shippingMethods || [],
        incotermsSupported: profile.incotermsSupported || [],
        regionsShippedTo: profile.regionsShippedTo || [],
        keyClients: profile.keyClients || [],
        testimonials: profile.testimonials || '',
        agreeToTerms: profile.agreeToTerms || false,
        agreeToPrivacy: profile.agreeToPrivacy || false,
        declareAccuracy: profile.declareAccuracy || false,
      });
    }
  }, [existingSupplier]);

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const result = await apiRequest('/api/suppliers/onboarding', 'POST', data, getAuthHeaders());
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Onboarding completed!",
        description: "Your supplier profile has been submitted for verification.",
      });
      // If updating existing profile, go to dashboard; if new, go to verification
      if (existingSupplier?.profile) {
        navigate('/dashboard/supplier');
      } else {
        navigate('/verification/supplier');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error completing onboarding",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.agreeToTerms || !formData.agreeToPrivacy || !formData.declareAccuracy) {
      toast({
        title: "Please accept all agreements",
        variant: "destructive",
      });
      return;
    }
    onboardingMutation.mutate(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (as legally registered) *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Company Ltd."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessRegistrationNumber">Business Registration/License Number *</Label>
                <Input
                  id="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                  placeholder="123456789"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfRegistration">Country of Registration *</Label>
                <Select value={formData.countryOfRegistration} onValueChange={(value) => handleInputChange('countryOfRegistration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityOfRegistration">City of Registration *</Label>
                <Input
                  id="cityOfRegistration"
                  value={formData.cityOfRegistration}
                  onChange={(e) => handleInputChange('cityOfRegistration', e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearEstablished">Year Established *</Label>
                <Input
                  id="yearEstablished"
                  type="number"
                  value={formData.yearEstablished || ''}
                  onChange={(e) => handleInputChange('yearEstablished', parseInt(e.target.value) || null)}
                  placeholder="2020"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalEntityType">Legal Entity Type *</Label>
                <Select value={formData.legalEntityType} onValueChange={(value) => handleInputChange('legalEntityType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LLC">LLC</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatTaxId">VAT / Tax ID Number</Label>
                <Input
                  id="vatTaxId"
                  value={formData.vatTaxId}
                  onChange={(e) => handleInputChange('vatTaxId', e.target.value)}
                  placeholder="VAT123456789"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registeredBusinessAddress">Registered Business Address *</Label>
              <Textarea
                id="registeredBusinessAddress"
                value={formData.registeredBusinessAddress}
                onChange={(e) => handleInputChange('registeredBusinessAddress', e.target.value)}
                placeholder="123 Business Street, City, State, ZIP Code"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactJobTitle">Contact Job Title *</Label>
                <Input
                  id="contactJobTitle"
                  value={formData.contactJobTitle}
                  onChange={(e) => handleInputChange('contactJobTitle', e.target.value)}
                  placeholder="Sales Manager"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone Number *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialMediaLinkedIn">Social Media (LinkedIn, etc.)</Label>
                <Input
                  id="socialMediaLinkedIn"
                  value={formData.socialMediaLinkedIn}
                  onChange={(e) => handleInputChange('socialMediaLinkedIn', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number (Optional)</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mainProductCategory">Choose Main Category of Product *</Label>
              <Select value={formData.mainProductCategory} onValueChange={(value) => handleInputChange('mainProductCategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select main product category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessLicenseUrl">Business License (Upload) *</Label>
              <Input
                id="businessLicenseUrl"
                value={formData.businessLicenseUrl}
                onChange={(e) => handleInputChange('businessLicenseUrl', e.target.value)}
                placeholder="Upload business license document"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCertificationsUrl">Product Certifications (Upload) (Optional)</Label>
              <Input
                id="productCertificationsUrl"
                value={formData.productCertificationsUrl}
                onChange={(e) => handleInputChange('productCertificationsUrl', e.target.value)}
                placeholder="Upload product certifications"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exportImportLicenseUrl">Export/Import License (if applicable) (Optional)</Label>
              <Input
                id="exportImportLicenseUrl"
                value={formData.exportImportLicenseUrl}
                onChange={(e) => handleInputChange('exportImportLicenseUrl', e.target.value)}
                placeholder="Upload export/import license"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyProfileUrl">Company Profile/Brochure (PDF)</Label>
              <Input
                id="companyProfileUrl"
                value={formData.companyProfileUrl}
                onChange={(e) => handleInputChange('companyProfileUrl', e.target.value)}
                placeholder="Upload company profile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLogoUrl">Company Logo (Upload)</Label>
              <Input
                id="companyLogoUrl"
                value={formData.companyLogoUrl}
                onChange={(e) => handleInputChange('companyLogoUrl', e.target.value)}
                placeholder="Upload company logo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factoryPhotosUrl">Factory/Office/Team Photos</Label>
              <Input
                id="factoryPhotosUrl"
                value={formData.factoryPhotosUrl}
                onChange={(e) => handleInputChange('factoryPhotosUrl', e.target.value)}
                placeholder="Upload factory/office photos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="introVideoUrl">Introductory Company Video</Label>
              <Input
                id="introVideoUrl"
                value={formData.introVideoUrl}
                onChange={(e) => handleInputChange('introVideoUrl', e.target.value)}
                placeholder="Upload company introduction video"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditReportsUrl">Third-party Audit Reports</Label>
              <Input
                id="auditReportsUrl"
                value={formData.auditReportsUrl}
                onChange={(e) => handleInputChange('auditReportsUrl', e.target.value)}
                placeholder="Upload audit reports"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shipping Methods</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Express", "Air Freight", "Sea Freight", "Ground Shipping"].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={formData.shippingMethods.includes(method)}
                      onCheckedChange={() => handleArrayChange('shippingMethods', method)}
                    />
                    <Label htmlFor={method}>{method}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Incoterms Supported</Label>
              <div className="grid grid-cols-3 gap-2">
                {["FOB", "CIF", "EXW", "DDP", "CFR", "DAP"].map((term) => (
                  <div key={term} className="flex items-center space-x-2">
                    <Checkbox
                      id={term}
                      checked={formData.incotermsSupported.includes(term)}
                      onCheckedChange={() => handleArrayChange('incotermsSupported', term)}
                    />
                    <Label htmlFor={term}>{term}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Regions/Countries Shipped To</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Worldwide", "North America", "Europe", "Southeast Asia", "Middle East", "Africa"].map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={region}
                      checked={formData.regionsShippedTo.includes(region)}
                      onCheckedChange={() => handleArrayChange('regionsShippedTo', region)}
                    />
                    <Label htmlFor={region}>{region}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyClients">Key Clients / Brands Worked With (Optional)</Label>
              <Textarea
                id="keyClients"
                value={formData.keyClients.join(', ')}
                onChange={(e) => handleInputChange('keyClients', e.target.value.split(', ').filter(Boolean))}
                placeholder="Major Brand A, International Retailer B"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonials">Testimonials or Case Studies (Optional)</Label>
              <Textarea
                id="testimonials"
                value={formData.testimonials}
                onChange={(e) => handleInputChange('testimonials', e.target.value)}
                placeholder="Customer testimonials or case studies"
                rows={4}
              />
            </div>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">Agreements</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="declareAccuracy"
                    checked={formData.declareAccuracy}
                    onCheckedChange={(checked) => handleInputChange('declareAccuracy', checked)}
                  />
                  <Label htmlFor="declareAccuracy" className="text-sm">
                    I declare that all the information provided is true and accurate to the best of my knowledge.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I have read and agree to the Terms of Service.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeToPrivacy"
                    checked={formData.agreeToPrivacy}
                    onCheckedChange={(checked) => handleInputChange('agreeToPrivacy', checked)}
                  />
                  <Label htmlFor="agreeToPrivacy" className="text-sm">
                    I have read and agree to the Privacy Policy.
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingSupplier?.profile ? 'Edit Supplier Profile' : 'Supplier Verification'}
          </h1>
          <p className="text-gray-600">
            {existingSupplier?.profile 
              ? 'Update your supplier profile information' 
              : 'Complete your supplier profile to get verified and start selling'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{currentStep} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-between mb-8 overflow-x-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-center hidden md:block">{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const IconComponent = steps[currentStep - 1].icon;
                return <IconComponent className="w-5 h-5" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep === steps.length ? (
            <Button
              onClick={handleSubmit}
              disabled={onboardingMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {onboardingMutation.isPending 
                ? "Saving..." 
                : existingSupplier?.profile 
                  ? "Update Profile" 
                  : "Submit for Verification"
              }
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}