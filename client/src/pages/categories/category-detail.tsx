import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Building2, 
  Package, 
  Star,
  MapPin,
  Eye,
  MessageCircle
} from "lucide-react";
import type { Category, Product, Supplier } from "@shared/schema";

export default function CategoryDetail() {
  const params = useParams();
  const categoryId = parseInt(params.id || "0");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'newest'>('name');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers'>('products');

  // Fetch category details
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products
  const { data: allProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch suppliers
  const { data: allSuppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const category = categories?.find(c => c.id === categoryId);
  
  // Filter products for this category
  const categoryProducts = allProducts?.filter(p => 
    p.categoryId === categoryId && p.status === 'approved'
  ) || [];

  // Get suppliers for this category  
  const supplierIdSet = new Set(categoryProducts.map(p => p.supplierId));
  const categorySupplierIds = Array.from(supplierIdSet);
  const categorySuppliers = allSuppliers?.filter(s => 
    categorySupplierIds.includes(s.id)
  ) || [];

  // Filter and sort products
  const filteredProducts = categoryProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesPrice = true;
      if (priceRange !== 'all' && product.price) {
        const price = parseFloat(product.price.toString());
        switch (priceRange) {
          case 'low':
            matchesPrice = price < 100;
            break;
          case 'medium':
            matchesPrice = price >= 100 && price < 1000;
            break;
          case 'high':
            matchesPrice = price >= 1000;
            break;
        }
      }
      
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const priceA = parseFloat(a.price?.toString() || '0');
          const priceB = parseFloat(b.price?.toString() || '0');
          return priceA - priceB;
        case 'rating':
          const ratingA = parseFloat(a.rating?.toString() || '0');
          const ratingB = parseFloat(b.rating?.toString() || '0');
          return ratingB - ratingA;
        case 'newest':
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return dateB - dateA;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Filter suppliers
  const filteredSuppliers = categorySuppliers.filter(supplier =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link href="/categories">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="category-detail-page">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">Home</Link>
        <span className="text-gray-400">/</span>
        <Link href="/categories" className="text-gray-500 hover:text-primary">Categories</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 mb-8">
        <div className="flex items-center mb-6">
          <Link href="/categories">
            <Button variant="outline" size="sm" data-testid="back-to-categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-sm">
            <i className={`${category.icon} text-4xl text-primary`} />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="category-name">
              {category.name}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Explore {category.name.toLowerCase()} products and suppliers
            </p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700" data-testid="products-count">
                  {categoryProducts.length} products
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700" data-testid="suppliers-count">
                  {categorySuppliers.length} suppliers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'products' | 'suppliers')}>
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Suppliers ({filteredSuppliers.length})
            </TabsTrigger>
          </TabsList>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                  data-testid="search-input"
                />
              </div>

              {activeTab === 'products' && (
                <>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="price">Sort by Price</SelectItem>
                      <SelectItem value="rating">Sort by Rating</SelectItem>
                      <SelectItem value="newest">Sort by Newest</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priceRange} onValueChange={(value) => setPriceRange(value as typeof priceRange)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="low">Under $100</SelectItem>
                      <SelectItem value="medium">$100 - $1,000</SelectItem>
                      <SelectItem value="high">Over $1,000</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="view-grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="products">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  {searchTerm ? `No products match "${searchTerm}"` : `No products in ${category.name} yet`}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers">
            {suppliersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading suppliers...</p>
                </div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
                <p className="text-gray-500">
                  {searchTerm ? `No suppliers match "${searchTerm}"` : `No suppliers in ${category.name} yet`}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} viewMode={viewMode} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  const imageUrl = product.images?.length ? product.images[0] : '/api/placeholder/300/200';
  
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow" data-testid={`product-${product.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg"
              data-testid={`product-image-${product.id}`}
            />
            <div className="flex-1 min-w-0">
              <Link href={`/products/${product.id}`}>
                <h3 className="font-semibold text-lg hover:text-primary truncate mb-1" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h3>
              </Link>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {product.price && (
                    <span className="text-lg font-bold text-primary" data-testid={`product-price-${product.id}`}>
                      ${product.price}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>{product.views || 0}</span>
                  </div>
                </div>
                <Link href={`/products/${product.id}`}>
                  <Button size="sm" data-testid={`view-product-${product.id}`}>View Details</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group" data-testid={`product-${product.id}`}>
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          data-testid={`product-image-${product.id}`}
        />
      </div>
      <CardHeader className="pb-2">
        <Link href={`/products/${product.id}`}>
          <CardTitle className="text-base hover:text-primary line-clamp-2" data-testid={`product-name-${product.id}`}>
            {product.name}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {product.price && (
            <p className="text-lg font-bold text-primary" data-testid={`product-price-${product.id}`}>
              ${product.price}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{product.views || 0}</span>
            </div>
            {product.rating && parseFloat(product.rating.toString()) > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{product.rating}</span>
              </div>
            )}
          </div>
          <Link href={`/products/${product.id}`} className="block">
            <Button size="sm" className="w-full" data-testid={`view-product-${product.id}`}>
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface SupplierCardProps {
  supplier: Supplier;
  viewMode: 'grid' | 'list';
}

function SupplierCard({ supplier, viewMode }: SupplierCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow" data-testid={`supplier-${supplier.id}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Link href={`/suppliers/${supplier.id}`}>
                  <h3 className="font-semibold text-lg hover:text-primary" data-testid={`supplier-name-${supplier.id}`}>
                    {supplier.companyName}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {supplier.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.location}</span>
                    </div>
                  )}
                  {supplier.verified && (
                    <Badge variant="default" className="text-xs">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/suppliers/${supplier.id}`}>
              <Button size="sm" data-testid={`view-supplier-${supplier.id}`}>View Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`supplier-${supplier.id}`}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <Link href={`/suppliers/${supplier.id}`}>
          <CardTitle className="text-lg hover:text-primary" data-testid={`supplier-name-${supplier.id}`}>
            {supplier.companyName}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {supplier.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{supplier.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            {supplier.verified && (
              <Badge variant="default" className="text-xs">Verified</Badge>
            )}
            {supplier.rating && parseFloat(supplier.rating.toString()) > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{supplier.rating}</span>
              </div>
            )}
          </div>
          <Link href={`/suppliers/${supplier.id}`} className="block">
            <Button size="sm" className="w-full" data-testid={`view-supplier-${supplier.id}`}>
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}