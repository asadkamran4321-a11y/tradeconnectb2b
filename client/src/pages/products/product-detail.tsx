import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Heart, Share2, Star, MapPin, ShieldCheck, Eye, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import ContactModal from "@/components/modals/contact-modal";
import { Product, Supplier } from "@shared/schema";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";

export default function ProductDetail() {
  const [, params] = useRoute('/products/:id');
  const productId = Number(params?.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();


  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      return response.json();
    },
    enabled: !!productId,
  });

  const { data: supplier } = useQuery({
    queryKey: ['/api/suppliers', product?.supplierId],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${product.supplierId}`);
      if (!response.ok) {
        throw new Error('Supplier not found');
      }
      return response.json();
    },
    enabled: !!product?.supplierId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['/api/products', { categoryId: product?.categoryId }],
    queryFn: async () => {
      const response = await fetch(`/api/products?categoryId=${product.categoryId}`);
      return response.json();
    },
    enabled: !!product?.categoryId,
  });

  // SEO data
  const seoData = useMemo(() => {
    if (!product || !supplier) return null;

    const title = `${product.name} - ${supplier.companyName} | TradeConnect B2B Marketplace`;
    const description = `${product.description || `High quality ${product.name} from verified supplier ${supplier.companyName}.`} Minimum order: ${product.minOrderQty || 'Contact for details'}. ${product.price ? `Price: $${product.price}` : 'Request quote'}. Contact us for wholesale pricing and bulk orders.`;
    const keywords = `${product.name}, ${supplier.companyName}, B2B marketplace, wholesale, bulk orders, ${product.category || 'business products'}, supplier, manufacturer`;
    const image = product.images?.[0] || '/api/placeholder/1200/630';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `High quality ${product.name} from ${supplier.companyName}`,
      "image": product.images || [image],
      "brand": {
        "@type": "Brand",
        "name": supplier.companyName
      },
      "manufacturer": {
        "@type": "Organization",
        "name": supplier.companyName,
        "address": {
          "@type": "PostalAddress",
          "addressCountry": supplier.country,
          "addressLocality": supplier.city
        }
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": product.price || "0",
        "priceSpecification": product.price ? {
          "@type": "PriceSpecification",
          "price": product.price,
          "priceCurrency": "USD",
          "valueAddedTaxIncluded": false
        } : undefined,
        "availability": product.status === 'approved' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": supplier.companyName,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": supplier.country,
            "addressLocality": supplier.city
          }
        },
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "category": product.category || "Business Products",
      "mpn": product.id.toString(),
      "sku": product.sku || product.id.toString(),
      "url": currentUrl,
      "aggregateRating": product.rating ? {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount || 1,
        "bestRating": 5,
        "worstRating": 1
      } : undefined
    };

    return { title, description, keywords, image, url: currentUrl, structuredData };
  }, [product, supplier]);

  const saveMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', '/api/saved-products', 
        { productId }, 
        getAuthHeaders()
      );
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(true);
      toast({
        title: "Product saved",
        description: "Product has been added to your saved list",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-products'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save products",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.role !== 'buyer') {
      toast({
        title: "Not available",
        description: "Only buyers can save products",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(productId);
  };

  const handleContact = () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to contact suppliers",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.role !== 'buyer') {
      toast({
        title: "Not available",
        description: "Only buyers can contact suppliers",
        variant: "destructive",
      });
      return;
    }

    setContactModalOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <SEOHead
          title="Product Not Found | TradeConnect B2B Marketplace"
          description="The requested product could not be found. Browse our extensive catalog of B2B products from verified suppliers worldwide."
          keywords="B2B marketplace, products, suppliers, wholesale, business"
        />
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-neutral-dark mb-2">Product not found</h3>
            <p className="text-neutral-medium mb-4">{error.message}</p>
            <Link href="/products">
              <Button className="bg-primary text-white hover:bg-blue-700">
                Browse Products
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
          title="Loading Product | TradeConnect B2B Marketplace"
          description="Loading product details from our B2B marketplace. Find quality products from verified suppliers worldwide."
          keywords="B2B marketplace, loading, products, suppliers"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="flex space-x-2 mt-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-16 rounded" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-6 w-1/3 mb-6" />
              <Skeleton className="h-20 w-full mb-6" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = product?.images || ["https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop"];
  const displayPrice = product?.price 
    ? `$${product.price}` 
    : product?.minPrice && product?.maxPrice
    ? `$${product.minPrice} - $${product.maxPrice}`
    : 'Contact for price';

  return (
    <div className="min-h-screen bg-neutral-light">
      {seoData && (
        <SEOHead
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          image={seoData.image}
          url={seoData.url}
          type="product"
          structuredData={seoData.structuredData}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-neutral-medium">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-primary">Products</Link></li>
            <li>/</li>
            <li className="text-neutral-dark">{product?.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div>
            <div className="relative mb-4">
              <img 
                src={images[selectedImageIndex]} 
                alt={product?.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === images.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 aspect-square rounded border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product?.name} ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark mb-2">{product?.name}</h1>
            
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(Number(product?.rating)) ? 'fill-current' : ''}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-medium">({product?.rating})</span>
              <span className="text-sm text-neutral-medium">•</span>
              <span className="text-sm text-neutral-medium">{product?.views || 0} views</span>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-2xl font-bold text-success">{displayPrice}</span>
              <Badge variant="outline">Min order: {product?.minOrder} {product?.unit}</Badge>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <Button 
                onClick={handleContact}
                className="flex-1 bg-primary text-white hover:bg-blue-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Supplier
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLike}
                disabled={saveMutation.isPending}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            
            {supplier && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">
                        {supplier.companyName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-dark">{supplier.companyName}</h3>
                      <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                        <MapPin className="h-4 w-4" />
                        <span>{supplier.location}</span>
                        {supplier.verified && (
                          <>
                            <span>•</span>
                            <ShieldCheck className="h-4 w-4 text-success" />
                            <span className="text-success">Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/suppliers/${supplier.id}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="company">Company Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-4">
                <div className="prose max-w-none">
                  <p className="text-neutral-dark">
                    {product?.description || "No description available for this product."}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Product Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-1">
                        <dt className="text-neutral-medium">Minimum Order:</dt>
                        <dd className="font-medium">{product?.minOrder || product?.moq || 1} {product?.unit || 'pieces'}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <dt className="text-neutral-medium">Unit:</dt>
                        <dd className="font-medium">{product?.unit || 'pieces'}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <dt className="text-neutral-medium">Price Range:</dt>
                        <dd className="font-medium text-success">{displayPrice}</dd>
                      </div>
                      {product?.materials && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Materials:</dt>
                          <dd className="font-medium">{product.materials}</dd>
                        </div>
                      )}
                      {product?.color && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Color:</dt>
                          <dd className="font-medium">{product.color}</dd>
                        </div>
                      )}
                      {product?.size && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Size:</dt>
                          <dd className="font-medium">{product.size}</dd>
                        </div>
                      )}
                      {product?.weight && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Weight:</dt>
                          <dd className="font-medium">{product.weight}</dd>
                        </div>
                      )}
                      {product?.dimensions && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Dimensions:</dt>
                          <dd className="font-medium">{product.dimensions}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Shipping & Trade</h4>
                    <dl className="space-y-2">
                      {product?.leadTime && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Lead Time:</dt>
                          <dd className="font-medium">{product.leadTime}</dd>
                        </div>
                      )}
                      {product?.incoterms && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Incoterms:</dt>
                          <dd className="font-medium">{product.incoterms}</dd>
                        </div>
                      )}
                      {product?.packagingDetails && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Packaging:</dt>
                          <dd className="font-medium">{product.packagingDetails}</dd>
                        </div>
                      )}
                      {product?.paymentTerms && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Payment Terms:</dt>
                          <dd className="font-medium">{product.paymentTerms}</dd>
                        </div>
                      )}
                      {product?.origin && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Origin:</dt>
                          <dd className="font-medium">{product.origin}</dd>
                        </div>
                      )}
                      {product?.supplyCapacity && (
                        <div className="flex justify-between border-b pb-1">
                          <dt className="text-neutral-medium">Supply Capacity:</dt>
                          <dd className="font-medium">{product.supplyCapacity}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {product?.specifications && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Technical Specifications</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-neutral-dark whitespace-pre-line">
                        {typeof product.specifications === 'string' 
                          ? product.specifications 
                          : JSON.stringify(product.specifications, null, 2)}
                      </p>
                    </div>
                  </div>
                )}
                
                {product?.certifications && product.certifications.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Certifications & Quality</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                    {product?.qualityGrade && (
                      <p className="text-sm text-neutral-medium mt-2">
                        Quality Grade: <span className="font-medium">{product.qualityGrade}</span>
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="company" className="mt-4">
                {supplier && (
                  <div>
                    <h4 className="font-semibold mb-2">{supplier.companyName}</h4>
                    <p className="text-neutral-dark mb-4">
                      {supplier.description || "No company description available."}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Contact Information</h5>
                        <dl className="space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Location:</dt>
                            <dd>{supplier.location}</dd>
                          </div>
                          {supplier.website && (
                            <div className="flex justify-between">
                              <dt className="text-neutral-medium">Website:</dt>
                              <dd>
                                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {supplier.website}
                                </a>
                              </dd>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex justify-between">
                              <dt className="text-neutral-medium">Phone:</dt>
                              <dd>{supplier.phone}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Company Stats</h5>
                        <dl className="space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Rating:</dt>
                            <dd className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                              {supplier.rating}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-neutral-medium">Verified:</dt>
                            <dd className="flex items-center">
                              {supplier.verified ? (
                                <span className="text-success">Yes</span>
                              ) : (
                                <span className="text-neutral-medium">No</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.filter((p: Product) => p.id !== productId).slice(0, 4).map((product: Product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <img 
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop"} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                      <CardContent className="p-4">
                        <h4 className="font-medium text-neutral-dark mb-1 line-clamp-1">{product.name}</h4>
                        <p className="text-success font-medium">
                          ${product.price || `${product.minPrice} - ${product.maxPrice}`}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Modal */}
      {supplier && (
        <ContactModal 
          supplier={supplier}
          product={product}
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
        />
      )}
    </div>
  );
}
