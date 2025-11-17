import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Grid, List, Package, Building2, TrendingUp } from "lucide-react";
import type { Category, Product, Supplier } from "@shared/schema";

interface CategoryWithStats extends Category {
  topProducts?: Product[];
  topSuppliers?: Supplier[];
}

export default function CategoryList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryWithStats[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products to calculate category stats
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Filter categories based on search term
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Enhanced categories with product counts and top items
  const enhancedCategories = filteredCategories.map(category => {
    const categoryProducts = products?.filter(p => p.categoryId === category.id && p.status === 'approved') || [];
    const supplierIdSet = new Set(categoryProducts.map(p => p.supplierId));
    const categorySupplierIds = Array.from(supplierIdSet);
    const categorySuppliers = suppliers?.filter(s => categorySupplierIds.includes(s.id)) || [];

    return {
      ...category,
      productCount: categoryProducts.length,
      topProducts: categoryProducts.slice(0, 3),
      topSuppliers: categorySuppliers.slice(0, 3),
    };
  });

  if (categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="category-list-page">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
          Browse Categories
        </h1>
        <p className="text-lg text-gray-600 mb-6" data-testid="page-description">
          Discover products and suppliers across our comprehensive range of business categories
        </p>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-categories"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="view-grid"
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="view-list"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mr-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold" data-testid="total-categories">
                {enhancedCategories.length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold" data-testid="total-products">
                {enhancedCategories.reduce((sum, cat) => sum + cat.productCount, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-bold" data-testid="total-suppliers">
                {suppliers?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Display */}
      {enhancedCategories.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-500">
            {searchTerm ? `No categories match "${searchTerm}"` : "No categories available"}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {enhancedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryWithStats;
  viewMode: 'grid' | 'list';
}

function CategoryCard({ category, viewMode }: CategoryCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow" data-testid={`category-card-${category.id}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg">
                <i className={`${category.icon} text-2xl text-primary`} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2" data-testid={`category-name-${category.id}`}>
                  {category.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span data-testid={`category-products-${category.id}`}>
                    {category.productCount} products
                  </span>
                  <span data-testid={`category-suppliers-${category.id}`}>
                    {category.topSuppliers?.length || 0} suppliers
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/categories/${category.id}`}>
                <Button size="sm" data-testid={`view-category-${category.id}`}>
                  View Category
                </Button>
              </Link>
              <Link href={`/categories/${category.id}/products`}>
                <Button variant="outline" size="sm" data-testid={`view-products-${category.id}`}>
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group" data-testid={`category-card-${category.id}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
          <i className={`${category.icon} text-3xl text-primary`} />
        </div>
        <CardTitle className="text-xl" data-testid={`category-name-${category.id}`}>
          {category.name}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span data-testid={`category-products-${category.id}`}>
              {category.productCount} products
            </span>
            <span className="text-gray-300">•</span>
            <span data-testid={`category-suppliers-${category.id}`}>
              {category.topSuppliers?.length || 0} suppliers
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="text-xs">Top Products</TabsTrigger>
            <TabsTrigger value="suppliers" className="text-xs">Top Suppliers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-4">
            <div className="space-y-2">
              {category.topProducts?.length ? (
                category.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <Link href={`/products/${product.id}`} className="hover:text-primary truncate flex-1">
                      {product.name}
                    </Link>
                    {product.price && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        ${product.price}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No products yet</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="suppliers" className="mt-4">
            <div className="space-y-2">
              {category.topSuppliers?.length ? (
                category.topSuppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center text-sm">
                    <Link href={`/suppliers/${supplier.id}`} className="hover:text-primary truncate flex-1">
                      {supplier.companyName}
                    </Link>
                    {supplier.verified && (
                      <Badge variant="default" className="ml-2 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No suppliers yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Link href={`/categories/${category.id}`} className="flex-1">
            <Button size="sm" className="w-full" data-testid={`view-category-${category.id}`}>
              View Category
            </Button>
          </Link>
          <Link href={`/categories/${category.id}/products`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" data-testid={`view-products-${category.id}`}>
              Browse Products
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}