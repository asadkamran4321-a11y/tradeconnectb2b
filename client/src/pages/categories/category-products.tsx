import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  Grid, 
  List, 
  Package, 
  Star,
  Eye,
  Heart,
  ShoppingCart
} from "lucide-react";
import type { Category, Product } from "@shared/schema";

export default function CategoryProducts() {
  const params = useParams();
  const categoryId = parseInt(params.id || "0");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'newest' | 'popular'>('name');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch category details
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products
  const { data: allProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const category = categories?.find(c => c.id === categoryId);
  
  // Filter products for this category
  const categoryProducts = allProducts?.filter(p => 
    p.categoryId === categoryId && p.status === 'approved'
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
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

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
    <div className="container mx-auto px-4 py-8" data-testid="category-products-page">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">Home</Link>
        <span className="text-gray-400">/</span>
        <Link href="/categories" className="text-gray-500 hover:text-primary">Categories</Link>
        <span className="text-gray-400">/</span>
        <Link href={`/categories/${categoryId}`} className="text-gray-500 hover:text-primary">{category.name}</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">Products</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/categories/${categoryId}`}>
            <Button variant="outline" size="sm" data-testid="back-to-category">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Category
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className={`${category.icon} text-xl text-primary`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="category-name">
                {category.name} Products
              </h1>
              <p className="text-gray-600" data-testid="products-count">
                {filteredProducts.length} of {categoryProducts.length} products
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
              data-testid="search-products"
            />
          </div>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-48" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="price">Sort by Price</SelectItem>
              <SelectItem value="rating">Sort by Rating</SelectItem>
              <SelectItem value="newest">Sort by Newest</SelectItem>
              <SelectItem value="popular">Sort by Popular</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={(value) => setPriceRange(value as typeof priceRange)}>
            <SelectTrigger className="w-48" data-testid="price-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under $100</SelectItem>
              <SelectItem value="medium">$100 - $1,000</SelectItem>
              <SelectItem value="high">Over $1,000</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Products Grid */}
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
          <p className="text-gray-500 mb-6">
            {searchTerm ? `No products match "${searchTerm}" in ${category.name}` : `No products in ${category.name} yet`}
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      )}
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
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="w-32 h-32 flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
                data-testid={`product-image-${product.id}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-3">
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-semibold text-xl hover:text-primary mb-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                </Link>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {product.price && (
                    <span className="text-2xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                      ${product.price}
                    </span>
                  )}
                  {product.minOrder && (
                    <span className="text-sm text-gray-500">
                      Min order: {product.minOrder} {product.unit || 'pieces'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
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
                  
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button size="sm" data-testid={`view-product-${product.id}`}>
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Inquiry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group" data-testid={`product-${product.id}`}>
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          data-testid={`product-image-${product.id}`}
        />
        <div className="absolute top-3 right-3">
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {product.rating && parseFloat(product.rating.toString()) > 0 && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/80">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              {product.rating}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <Link href={`/products/${product.id}`}>
          <CardTitle className="text-base hover:text-primary line-clamp-2" data-testid={`product-name-${product.id}`}>
            {product.name}
          </CardTitle>
        </Link>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {product.price && (
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                ${product.price}
              </span>
              {product.unit && (
                <span className="text-sm text-gray-500">per {product.unit}</span>
              )}
            </div>
          )}
          
          {product.minOrder && (
            <p className="text-sm text-gray-500">
              Min order: {product.minOrder} {product.unit || 'pieces'}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{product.views || 0} views</span>
            </div>
            {product.inquiries && product.inquiries > 0 && (
              <span>{product.inquiries} inquiries</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link href={`/products/${product.id}`} className="flex-1">
              <Button size="sm" className="w-full" data-testid={`view-product-${product.id}`}>
                View Details
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Inquiry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}