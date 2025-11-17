import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Eye
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProductCard from "@/components/common/product-card";
import ContactModal from "@/components/modals/contact-modal";
import { Supplier, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";

export default function SupplierDetail() {
  const [, params] = useRoute('/suppliers/:id');
  const supplierId = Number(params?.id);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  // SEO data
  const seoData = useMemo(() => {
    if (!supplier) return null;

    const title = `${supplier.companyName} - Verified B2B Supplier | TradeConnect Marketplace`;
    const description = `${supplier.companyDescription || `Professional B2B supplier ${supplier.companyName} from ${supplier.country || 'worldwide'}.`} ${supplier.verified ? 'Verified supplier' : 'Quality supplier'} offering ${products.length} products. ${supplier.businessType || 'Manufacturer and supplier'} with years of experience. Contact for wholesale pricing and bulk orders.`;
    const keywords = `${supplier.companyName}, B2B supplier, ${supplier.country || 'international'} supplier, ${supplier.businessType || 'manufacturer'}, wholesale, bulk orders, ${supplier.primaryProducts || 'business products'}, verified supplier`;
    const image = supplier.logo || '/api/placeholder/1200/630';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Organization",
      "@id": currentUrl,
      "name": supplier.companyName,
      "description": supplier.companyDescription || `Professional B2B supplier specializing in quality products and services.`,
      "url": currentUrl,
      "logo": supplier.logo,
      "image": supplier.logo,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": supplier.country,
        "addressLocality": supplier.city,
        "streetAddress": supplier.address
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": supplier.phone,
        "email": supplier.email,
        "contactType": "sales",
        "availableLanguage": ["en"]
      },
      "foundingDate": supplier.yearEstablished,
      "numberOfEmployees": supplier.employeeCount,
      "aggregateRating": supplier.rating ? {
        "@type": "AggregateRating",
        "ratingValue": supplier.rating,
        "reviewCount": supplier.reviewCount || 1,
        "bestRating": 5,
        "worstRating": 1
      } : undefined,
      "makesOffer": products.map(product => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": product.name,
          "description": product.description
        },
        "priceCurrency": "USD",
        "price": product.price || "0",
        "availability": "https://schema.org/InStock"
      })),
      "hasCredential": supplier.verified ? {
        "@type": "EducationalOccupationalCredential",
        "name": "Verified B2B Supplier",
        "description": "Verified supplier status on TradeConnect B2B Marketplace"
      } : undefined
    };

    return { title, description, keywords, image, url: currentUrl, structuredData };
  }, [supplier, products]);

  const handleContact = () => {
    setContactModalOpen(true);
  };

  const handleProductContact = (product: Product) => {
    setSelectedProduct(product);
    setContactModalOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <SEOHead
          title="Supplier Not Found | TradeConnect B2B Marketplace"
          description="The requested supplier could not be found. Browse our network of verified B2B suppliers and manufacturers worldwide."
          keywords="B2B suppliers, manufacturers, verified suppliers, wholesale, business"
        />
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-neutral-dark mb-2">Supplier not found</h3>
            <p className="text-neutral-medium mb-4">{error.message}</p>
            <Link href="/suppliers">
              <Button className="bg-primary text-white hover:bg-blue-700">
                Browse Suppliers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <SEOHead
          title="Loading Supplier Profile | TradeConnect B2B Marketplace"
          description="Loading supplier profile from our verified B2B supplier network. Find quality suppliers and manufacturers worldwide."
          keywords="B2B suppliers, loading, manufacturers, verified suppliers"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      {seoData && (
        <SEOHead
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          image={seoData.image}
          url={seoData.url}
          type="website"
          structuredData={seoData.structuredData}
        />
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-neutral-medium">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li>/</li>
              <li><Link href="/suppliers" className="hover:text-primary">Suppliers</Link></li>
              <li>/</li>
              <li className="text-neutral-dark">{supplier?.companyName}</li>
            </ol>
          </nav>

          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
              {supplier?.profileImage ? (
                <img 
                  src={supplier.profileImage} 
                  alt={supplier.companyName}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {supplier?.companyName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-dark mb-2">{supplier?.companyName}</h1>
              <div className="flex items-center space-x-4 text-neutral-medium">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{supplier?.location}</span>
                </div>
                {supplier?.verified && (
                  <div className="flex items-center space-x-1">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span className="text-success">Verified Supplier</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{supplier?.rating} rating</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleContact}
              className="bg-primary text-white hover:bg-blue-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Supplier
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Supplier Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-neutral-dark mb-2">Description</h4>
                  <p className="text-neutral-medium text-sm">
                    {supplier?.description || "No description available"}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-neutral-medium" />
                    <span className="text-sm text-neutral-dark">Company</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-neutral-medium" />
                    <span className="text-sm text-neutral-dark">{supplier?.location}</span>
                  </div>
                  
                  {supplier?.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-neutral-medium" />
                      <a 
                        href={supplier.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center space-x-1"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  
                  {supplier?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-neutral-medium" />
                      <span className="text-sm text-neutral-dark">{supplier.phone}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Products Listed</span>
                    <span className="text-neutral-dark font-medium">{products.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Company Rating</span>
                    <span className="text-neutral-dark font-medium">{supplier?.rating}/5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-medium">Member Since</span>
                    <span className="text-neutral-dark font-medium">
                      {supplier?.createdAt ? new Date(supplier.createdAt).getFullYear() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trust & Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-medium">Verified Supplier</span>
                  {supplier?.verified ? (
                    <Badge className="bg-success text-white">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Verified</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-medium">Business License</span>
                  <Badge variant="outline">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-medium">Trade Assurance</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About Company</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product: Product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onContact={handleProductContact}
                      />
                    ))}
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
              
              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-neutral-dark">
                        {supplier?.description || "No detailed description available for this company."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Company Details</h4>
                        <dl className="space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Company Name:</dt>
                            <dd>{supplier?.companyName}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Location:</dt>
                            <dd>{supplier?.location}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Type:</dt>
                            <dd>Supplier</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Performance</h4>
                        <dl className="space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Rating:</dt>
                            <dd className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                              {supplier?.rating}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Products:</dt>
                            <dd>{products.length}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Verified:</dt>
                            <dd>{supplier?.verified ? 'Yes' : 'No'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Get in Touch</h4>
                        <p className="text-neutral-medium text-sm mb-4">
                          Contact {supplier?.companyName} directly for inquiries, quotes, or business partnerships.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier?.phone && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Phone className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-neutral-medium">{supplier.phone}</p>
                            </div>
                          </div>
                        )}
                        
                        {supplier?.website && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Globe className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Website</p>
                              <a 
                                href={supplier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center pt-4">
                        <Button 
                          onClick={handleContact}
                          className="bg-primary text-white hover:bg-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {supplier && (
        <ContactModal 
          supplier={supplier}
          product={selectedProduct || undefined}
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
        />
      )}
    </div>
  );
}
