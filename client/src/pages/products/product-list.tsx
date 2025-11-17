import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid, List, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/common/search-bar";
import ProductCard from "@/components/common/product-card";
import ContactModal from "@/components/modals/contact-modal";
import { SearchFilters } from "@/lib/types";
import { Product, Supplier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";

export default function ProductList() {
  const [location] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const initialFilters: SearchFilters = {};
    
    if (urlParams.get('search')) initialFilters.search = urlParams.get('search')!;
    if (urlParams.get('categoryId')) initialFilters.categoryId = Number(urlParams.get('categoryId'));
    if (urlParams.get('location')) initialFilters.location = urlParams.get('location')!;
    if (urlParams.get('minPrice')) initialFilters.minPrice = Number(urlParams.get('minPrice'));
    if (urlParams.get('maxPrice')) initialFilters.maxPrice = Number(urlParams.get('maxPrice'));
    if (urlParams.get('sortBy')) initialFilters.sortBy = urlParams.get('sortBy')!;
    
    setFilters(initialFilters);
  }, [location]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
  });

  // SEO data
  const seoData = useMemo(() => {
    const hasSearch = filters.search;
    const hasCategory = filters.categoryId;
    const hasLocation = filters.location;
    
    let title = "B2B Products | TradeConnect Marketplace";
    let description = "Browse quality B2B products from verified suppliers worldwide. Find wholesale and bulk products from trusted manufacturers and suppliers.";
    let keywords = "B2B products, wholesale products, bulk orders, suppliers, manufacturers, business products";

    if (hasSearch) {
      title = `${filters.search} Products | B2B Marketplace - TradeConnect`;
      description = `Find ${filters.search} products from verified suppliers. Browse quality ${filters.search} for wholesale and bulk orders. Compare prices and contact suppliers directly.`;
      keywords = `${filters.search}, ${filters.search} suppliers, B2B ${filters.search}, wholesale ${filters.search}, ${keywords}`;
    }

    if (hasCategory && hasLocation) {
      title = `B2B Products in ${filters.location} | Category ${filters.categoryId} - TradeConnect`;
      description = `Browse B2B products in ${filters.location} from category ${filters.categoryId}. Find local suppliers and manufacturers for wholesale business products.`;
    } else if (hasLocation) {
      title = `B2B Products in ${filters.location} | TradeConnect Marketplace`;
      description = `Find B2B products and suppliers in ${filters.location}. Browse local wholesale products from verified manufacturers and suppliers.`;
      keywords = `B2B products ${filters.location}, suppliers in ${filters.location}, ${filters.location} manufacturers, ${keywords}`;
    } else if (hasCategory) {
      title = `Category ${filters.categoryId} Products | B2B Marketplace - TradeConnect`;
      description = `Browse B2B products in category ${filters.categoryId}. Find quality wholesale products from verified suppliers and manufacturers.`;
    }

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const productCount = products.length;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": title,
      "description": description,
      "url": currentUrl,
      "numberOfItems": productCount,
      "itemListElement": products.slice(0, 20).map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "@id": `/products/${product.id}`,
          "name": product.name,
          "description": product.description,
          "image": product.images?.[0] || '/api/placeholder/400/400',
          "url": `/products/${product.id}`,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": product.price || "0",
            "availability": "https://schema.org/InStock"
          }
        }
      }))
    };

    return { title, description, keywords, url: currentUrl, structuredData };
  }, [filters, products]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    
    // Update URL
    const searchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const newUrl = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleSortChange = (sortBy: string) => {
    const newFilters = { ...filters, sortBy };
    handleSearch(newFilters);
  };

  const handleProductContact = (product: Product) => {
    const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setSelectedProduct(product);
      setContactModalOpen(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <SearchBar onSearch={handleSearch} initialFilters={filters} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">Failed to load products</h3>
              <p className="text-neutral-medium">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        type="website"
        structuredData={seoData.structuredData}
      />
      <SearchBar onSearch={handleSearch} initialFilters={filters} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">Products</h1>
            <p className="text-neutral-medium">
              {isLoading ? 'Loading...' : `${products.length} products found`}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={filters.sortBy || 'latest'} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border border-gray-300 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {Object.keys(filters).length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="px-3 py-1">
                  Search: {filters.search}
                </Badge>
              )}
              {filters.categoryId && (
                <Badge variant="secondary" className="px-3 py-1">
                  Category: {filters.categoryId}
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="px-3 py-1">
                  Location: {filters.location}
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="px-3 py-1">
                  Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearch({})}
                className="text-neutral-medium hover:text-neutral-dark"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">No products found</h3>
              <p className="text-neutral-medium">Try adjusting your search criteria or filters</p>
              <Button 
                onClick={() => handleSearch({})}
                className="mt-4 bg-primary text-white hover:bg-blue-700"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Button */}
        {products.length > 0 && products.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button className="bg-primary text-white hover:bg-blue-700">
              Load More Products
            </Button>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedSupplier && (
        <ContactModal 
          supplier={selectedSupplier}
          product={selectedProduct || undefined}
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
        />
      )}
    </div>
  );
}
