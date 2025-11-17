import { useState, useMemo, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Star, 
  Building, 
  Calendar,
  ExternalLink,
  MessageCircle,
  User,
  FileText,
  Factory,
  Contact,
  Award,
  Hash,
  Image,
  Eye,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  UserPlus,
  UserCheck
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import ProductCard from "@/components/common/product-card";
import ContactModal from "@/components/modals/contact-modal";
import DocumentPreviewModal from "@/components/modals/document-preview-modal";
import FactoryPhotosModal from "@/components/modals/factory-photos-modal";
import { Supplier, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";

export default function SupplierDetail() {
  const [, params] = useRoute('/suppliers/:id');
  const supplierId = Number(params?.id);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    title: string;
    url: string;
    fileName?: string;
    type: 'business-license' | 'certification' | 'export-license' | 'company-profile' | 'audit-report';
    verified?: boolean;
  } | null>(null);
  const [factoryPhotosModalOpen, setFactoryPhotosModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();

  const { data: supplier, isLoading, error } = useQuery({
    queryKey: ['/api/suppliers', supplierId],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${supplierId}`);
      if (!response.ok) {
        throw new Error('Supplier not found');
      }
      return response.json();
    },
    enabled: !!supplierId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products', { supplierId }],
    queryFn: async () => {
      const response = await fetch(`/api/products?supplierId=${supplierId}`);
      return response.json();
    },
    enabled: !!supplierId,
  });

  // Check if current user follows this supplier
  const { data: followedSuppliers = [] } = useQuery({
    queryKey: ['/api/followed-suppliers'],
    queryFn: async () => {
      if (!currentUser || currentUser.role !== 'buyer') return [];
      const response = await fetch('/api/followed-suppliers', {
        headers: getAuthHeaders()
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUser && currentUser.role === 'buyer',
  });

  // Check if this supplier is followed
  const isSupplierFollowed = followedSuppliers.some(
    (s: any) => s.id === supplierId
  );

  // SEO data
  const seoData = useMemo(() => {
    if (!supplier) return null;

    const title = `${supplier.companyName} - Verified B2B Supplier | TradeConnect Marketplace`;
    const description = `${supplier.description || `Professional B2B supplier ${supplier.companyName} from ${supplier.countryOfRegistration || 'worldwide'}.`} ${supplier.verified ? 'Verified supplier' : 'Quality supplier'} offering ${products.length} products. Contact for wholesale pricing and bulk orders.`;
    const keywords = `${supplier.companyName}, B2B supplier, ${supplier.countryOfRegistration || 'international'} supplier, manufacturer, wholesale, bulk orders, ${supplier.mainProductCategory || 'business products'}, verified supplier`;
    const image = supplier.companyLogoUrl || '/api/placeholder/1200/630';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Organization",
      "@id": currentUrl,
      "name": supplier.companyName,
      "description": supplier.description || `Professional B2B supplier specializing in quality products and services.`,
      "url": currentUrl,
      "logo": supplier.companyLogoUrl,
      "image": supplier.companyLogoUrl,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": supplier.countryOfRegistration,
        "addressLocality": supplier.cityOfRegistration,
        "streetAddress": supplier.registeredBusinessAddress
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "business",
        "telephone": supplier.contactPhone,
        "email": supplier.contactEmail
      },
      "foundingDate": supplier.yearEstablished?.toString(),
      "taxID": supplier.vatTaxId,
      "duns": supplier.businessRegistrationNumber
    };

    return { title, description, keywords, image, structuredData };
  }, [supplier, products]);

  const handleContact = () => {
    setContactModalOpen(true);
  };

  const handleProductContact = (product: Product) => {
    setSelectedProduct(product);
    setContactModalOpen(true);
  };

  const handleDocumentClick = (title: string, url: string, fileName: string, type: 'business-license' | 'certification' | 'export-license' | 'company-profile' | 'audit-report', verified = true) => {
    setSelectedDocument({ title, url, fileName, type, verified });
    setDocumentModalOpen(true);
  };

  const handleFactoryPhotosClick = () => {
    setFactoryPhotosModalOpen(true);
  };

  const handleFollow = () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to follow suppliers",
        variant: "destructive",
      });
      return;
    }
    
    if (currentUser.role !== 'buyer') {
      toast({
        title: "Only buyers can follow suppliers",
        description: "Please log in as a buyer to follow suppliers",
        variant: "destructive",
      });
      return;
    }

    if (isSupplierFollowed) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // Parse factory photos from JSON file or direct URLs
  const [factoryPhotos, setFactoryPhotos] = useState<string[]>([]);
  
  useEffect(() => {
    if (!supplier?.factoryPhotosUrl) {
      setFactoryPhotos([]);
      return;
    }
    
    // If it's already an array
    if (Array.isArray(supplier.factoryPhotosUrl)) {
      setFactoryPhotos(supplier.factoryPhotosUrl);
      return;
    }
    
    // If it's a JSON file, fetch and parse it
    if (supplier.factoryPhotosUrl.endsWith('.json')) {
      fetch(supplier.factoryPhotosUrl)
        .then(response => response.json())
        .then((data: {url: string, caption: string}[]) => {
          const photoUrls = data.map(photo => photo.url);
          setFactoryPhotos(photoUrls);
        })
        .catch(error => {
          console.error('Error fetching factory photos:', error);
          setFactoryPhotos([]);
        });
    } else {
      // If it's a single URL or comma-separated URLs
      const urls = supplier.factoryPhotosUrl.split(',').map((url: string) => url.trim()).filter(Boolean);
      setFactoryPhotos(urls);
    }
  }, [supplier?.factoryPhotosUrl]);

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/follow-supplier', 'POST', { supplierId }, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Supplier followed",
        description: `You are now following ${supplier?.companyName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/followed-suppliers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow supplier",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/unfollow-supplier', 'DELETE', { supplierId }, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Supplier unfollowed",
        description: `You have unfollowed ${supplier?.companyName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/followed-suppliers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow supplier",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Supplier Not Found</h2>
            <p className="text-neutral-medium mb-4">
              The supplier you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/suppliers">
              <Button>Browse All Suppliers</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <SEOHead 
        title={seoData?.title || ''}
        description={seoData?.description || ''}
        keywords={seoData?.keywords}
        image={seoData?.image}
        structuredData={seoData?.structuredData}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Company Name and Location */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {supplier.companyLogoUrl && (
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg border bg-white p-2 flex items-center justify-center">
                    <img 
                      src={supplier.companyLogoUrl} 
                      alt={`${supplier.companyName} Logo`}
                      className="max-w-full max-h-full object-contain"
                      data-testid="img-company-logo"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full text-gray-400 text-sm font-medium">${supplier.companyName.split(' ').map(word => word.charAt(0)).join('').slice(0,3)}</div>`;
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-neutral-dark mb-2" data-testid="text-company-name">
                  {supplier.companyName}
                </h1>
                <div className="flex items-center gap-4 text-neutral-medium mb-4">
                  {supplier.countryOfRegistration && (
                    <div className="flex items-center gap-2" data-testid="text-location">
                      <MapPin className="h-4 w-4" />
                      {supplier.cityOfRegistration}, {supplier.countryOfRegistration}
                    </div>
                  )}
                  {supplier.yearEstablished && (
                    <div className="flex items-center gap-2" data-testid="text-established">
                      <Calendar className="h-4 w-4" />
                      Est. {supplier.yearEstablished}
                    </div>
                  )}
                  {supplier.verified && (
                    <div className="flex items-center gap-2 text-green-600" data-testid="badge-verified">
                      <ShieldCheck className="h-4 w-4" />
                      Verified Supplier
                    </div>
                  )}
                </div>
                {supplier.description && (
                  <p className="text-neutral-medium max-w-2xl" data-testid="text-description">
                    {supplier.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" data-testid="text-rating">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-semibold">{supplier.rating}/5</span>
              </div>
              <Button 
                onClick={handleContact}
                className="bg-primary text-white hover:bg-blue-700"
                data-testid="button-contact-supplier"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Supplier
              </Button>
              
              {/* Follow/Unfollow Button - Only for buyers */}
              {currentUser?.role === 'buyer' && (
                <Button
                  onClick={handleFollow}
                  variant={isSupplierFollowed ? "outline" : "default"}
                  className={isSupplierFollowed ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  data-testid="button-follow-supplier"
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <><User className="w-4 h-4 mr-2" />Processing...</>
                  ) : isSupplierFollowed ? (
                    <><UserCheck className="w-4 h-4 mr-2" />Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" />Follow Supplier</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Overview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Quick Facts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {supplier.mainProductCategory && (
                    <div className="flex justify-between" data-testid="text-category">
                      <span className="text-neutral-medium">Category:</span>
                      <span className="font-medium">{supplier.mainProductCategory}</span>
                    </div>
                  )}
                  {supplier.legalEntityType && (
                    <div className="flex justify-between" data-testid="text-entity-type">
                      <span className="text-neutral-medium">Entity Type:</span>
                      <span>{supplier.legalEntityType}</span>
                    </div>
                  )}
                  <div className="flex justify-between" data-testid="text-products-count">
                    <span className="text-neutral-medium">Products:</span>
                    <span className="font-medium">{products.length}</span>
                  </div>
                  <div className="flex justify-between" data-testid="text-member-since">
                    <span className="text-neutral-medium">Member Since:</span>
                    <span>{supplier.yearEstablished || new Date(supplier.createdAt).getFullYear()}</span>
                  </div>
                </div>

                <Separator />

                {/* Quick Contact */}
                <div className="space-y-2">
                  {supplier.contactPhone && (
                    <div className="flex items-center gap-2" data-testid="text-phone">
                      <Phone className="h-4 w-4 text-neutral-medium" />
                      <span className="text-sm">{supplier.contactPhone}</span>
                    </div>
                  )}
                  {supplier.companyWebsite && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-neutral-medium" />
                      <a 
                        href={supplier.companyWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                        data-testid="link-website"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about" data-testid="tab-about">About Company</TabsTrigger>
                <TabsTrigger value="contact" data-testid="tab-contact">Contact Info</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                <TabsTrigger value="products" data-testid="tab-products">Products ({products.length})</TabsTrigger>
              </TabsList>

              {/* About Company Tab */}
              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Company Details</h4>
                        <dl className="space-y-2 text-sm">
                          {supplier.businessRegistrationNumber && (
                            <div className="flex justify-between" data-testid="text-registration-number">
                              <dt className="text-neutral-medium">Registration Number:</dt>
                              <dd className="font-mono text-xs">{supplier.businessRegistrationNumber}</dd>
                            </div>
                          )}
                          {supplier.legalEntityType && (
                            <div className="flex justify-between" data-testid="text-legal-entity">
                              <dt className="text-neutral-medium">Legal Entity:</dt>
                              <dd>{supplier.legalEntityType}</dd>
                            </div>
                          )}
                          {supplier.vatTaxId && (
                            <div className="flex justify-between" data-testid="text-vat-id">
                              <dt className="text-neutral-medium">VAT/Tax ID:</dt>
                              <dd className="font-mono text-xs">{supplier.vatTaxId}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Performance</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between" data-testid="text-rating-detail">
                            <dt className="text-neutral-medium">Rating:</dt>
                            <dd className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              {supplier.rating}/5
                            </dd>
                          </div>
                          <div className="flex justify-between" data-testid="text-verification-status">
                            <dt className="text-neutral-medium">Status:</dt>
                            <dd>
                              <Badge variant={supplier.verified ? 'default' : 'secondary'}>
                                {supplier.verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {supplier.registeredBusinessAddress && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Registered Address
                        </h4>
                        <p className="text-sm text-neutral-medium" data-testid="text-registered-address">
                          {supplier.registeredBusinessAddress}
                        </p>
                      </div>
                    )}

                    {/* Factory Photos Section */}
                    {factoryPhotos.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Factory className="h-4 w-4" />
                          Factory Photos
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {factoryPhotos.slice(0, 6).map((photo, index) => (
                            <div 
                              key={index} 
                              className="relative group cursor-pointer rounded-lg overflow-hidden border hover:shadow-md transition-all duration-200"
                              onClick={handleFactoryPhotosClick}
                              data-testid={`factory-photo-preview-${index}`}
                            >
                              <img
                                src={photo}
                                alt={`Factory photo ${index + 1}`}
                                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                              {index === 5 && factoryPhotos.length > 6 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-xs font-semibold">+{factoryPhotos.length - 6} more</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {factoryPhotos.length > 6 && (
                          <div className="mt-3 text-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleFactoryPhotosClick}
                              data-testid="button-view-all-factory-photos"
                            >
                              <Image className="h-4 w-4 mr-2" />
                              View All {factoryPhotos.length} Photos
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Info Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Contact className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Primary Contact Person */}
                      {(supplier.primaryContactName || supplier.contactJobTitle) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Primary Contact
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {supplier.primaryContactName && (
                              <div data-testid="text-contact-name">
                                <span className="text-sm text-neutral-medium">Contact Person</span>
                                <p className="font-medium">{supplier.primaryContactName}</p>
                              </div>
                            )}
                            {supplier.contactJobTitle && (
                              <div data-testid="text-contact-title">
                                <span className="text-sm text-neutral-medium">Position</span>
                                <p>{supplier.contactJobTitle}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Methods */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier.contactPhone && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg" data-testid="contact-phone">
                            <Phone className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Business Phone</p>
                              <p className="text-sm text-neutral-medium">{supplier.contactPhone}</p>
                            </div>
                          </div>
                        )}

                        {supplier.contactEmail && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg" data-testid="contact-email">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Business Email</p>
                              <a href={`mailto:${supplier.contactEmail}`} className="text-sm text-primary hover:underline">
                                {supplier.contactEmail}
                              </a>
                            </div>
                          </div>
                        )}

                        {supplier.companyWebsite && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg" data-testid="contact-website">
                            <Globe className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Company Website</p>
                              <a 
                                href={supplier.companyWebsite} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          </div>
                        )}

                        {supplier.whatsappNumber && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg" data-testid="contact-whatsapp">
                            <Phone className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">WhatsApp</p>
                              <a 
                                href={`https://wa.me/${supplier.whatsappNumber.replace(/[^\\d]/g, '')}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:underline"
                              >
                                {supplier.whatsappNumber}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Social Media Links */}
                      {(supplier.socialMediaLinkedIn || supplier.socialMediaFacebook || supplier.socialMediaInstagram || supplier.socialMediaYoutube || supplier.socialMediaTiktok || supplier.socialMediaX || supplier.socialMediaPinterest) && (
                        <div>
                          <h5 className="font-medium mb-3">Social Media Presence</h5>
                          <div className="flex flex-wrap gap-2">
                            {supplier.socialMediaLinkedIn && (
                              <Button variant="outline" size="sm" asChild data-testid="link-linkedin">
                                <a href={supplier.socialMediaLinkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <Linkedin className="h-4 w-4" />
                                  LinkedIn
                                </a>
                              </Button>
                            )}
                            {supplier.socialMediaFacebook && (
                              <Button variant="outline" size="sm" asChild data-testid="link-facebook">
                                <a href={supplier.socialMediaFacebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <Facebook className="h-4 w-4" />
                                  Facebook
                                </a>
                              </Button>
                            )}
                            {supplier.socialMediaInstagram && (
                              <Button variant="outline" size="sm" asChild data-testid="link-instagram">
                                <a href={supplier.socialMediaInstagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <Instagram className="h-4 w-4" />
                                  Instagram
                                </a>
                              </Button>
                            )}
                            {supplier.socialMediaYoutube && (
                              <Button variant="outline" size="sm" asChild data-testid="link-youtube">
                                <a href={supplier.socialMediaYoutube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <Youtube className="h-4 w-4" />
                                  YouTube
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents & Certifications Tab */}
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Business Documents & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-neutral-medium text-sm mb-4">
                        View verified business documents and certifications for {supplier.companyName}.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier.businessLicenseUrl && (
                          <div className="border rounded-lg p-4" data-testid="document-business-license">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">Business License</h5>
                              <Badge variant="secondary">Verified</Badge>
                            </div>
                            <p className="text-sm text-neutral-medium mb-3">
                              {supplier.businessLicenseFileName || 'Business License Document'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDocumentClick(
                                'Business License',
                                supplier.businessLicenseUrl,
                                supplier.businessLicenseFileName || 'Business_License.pdf',
                                'business-license',
                                true
                              )}
                              data-testid="button-view-business-license"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        )}

                        {supplier.productCertificationsUrl && (
                          <div className="border rounded-lg p-4" data-testid="document-certifications">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">Product Certifications</h5>
                              <Badge variant="secondary">Available</Badge>
                            </div>
                            <p className="text-sm text-neutral-medium mb-3">
                              {supplier.productCertificationsFileName || 'Product Certification Documents'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDocumentClick(
                                'Product Certifications',
                                supplier.productCertificationsUrl,
                                supplier.productCertificationsFileName || 'Product_Certifications.pdf',
                                'certification',
                                true
                              )}
                              data-testid="button-view-certifications"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Certifications
                            </Button>
                          </div>
                        )}

                        {supplier.exportImportLicenseUrl && (
                          <div className="border rounded-lg p-4" data-testid="document-export-license">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">Export/Import License</h5>
                              <Badge variant="secondary">Available</Badge>
                            </div>
                            <p className="text-sm text-neutral-medium mb-3">
                              {supplier.exportImportLicenseFileName || 'Export/Import License Document'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDocumentClick(
                                'Export/Import License',
                                supplier.exportImportLicenseUrl,
                                supplier.exportImportLicenseFileName || 'Export_Import_License.pdf',
                                'export-license',
                                true
                              )}
                              data-testid="button-view-export-license"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View License
                            </Button>
                          </div>
                        )}

                        {supplier.companyProfileUrl && (
                          <div className="border rounded-lg p-4" data-testid="document-company-profile">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">Company Profile</h5>
                              <Badge variant="secondary">Available</Badge>
                            </div>
                            <p className="text-sm text-neutral-medium mb-3">
                              {supplier.companyProfileFileName || 'Company Profile Document'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDocumentClick(
                                'Company Profile',
                                supplier.companyProfileUrl,
                                supplier.companyProfileFileName || 'Company_Profile.pdf',
                                'company-profile',
                                true
                              )}
                              data-testid="button-view-company-profile"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                {products.length > 0 ? (
                  <div className="relative px-12">
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {products.map((product: Product) => (
                          <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                            <ProductCard 
                              product={product} 
                              onContact={handleProductContact}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0 bg-white border shadow-lg hover:bg-gray-50" />
                      <CarouselNext className="right-0 bg-white border shadow-lg hover:bg-gray-50" />
                    </Carousel>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-neutral-dark mb-2">No products listed</h3>
                      <p className="text-neutral-medium">This supplier hasn't listed any products yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        open={contactModalOpen}
        onOpenChange={(open) => {
          setContactModalOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        supplier={supplier}
        product={selectedProduct || undefined}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={documentModalOpen}
        onOpenChange={(open) => {
          setDocumentModalOpen(open);
          if (!open) setSelectedDocument(null);
        }}
        document={selectedDocument}
      />

      {/* Factory Photos Modal */}
      <FactoryPhotosModal
        open={factoryPhotosModalOpen}
        onOpenChange={setFactoryPhotosModalOpen}
        photos={factoryPhotos}
        companyName={supplier.companyName}
      />
    </div>
  );
}