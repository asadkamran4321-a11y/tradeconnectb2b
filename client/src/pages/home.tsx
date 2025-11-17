import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, ShoppingCart, Users, Package, Star, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/common/search-bar";
import ProductCard from "@/components/common/product-card";
import SupplierCard from "@/components/common/supplier-card";
import ContactModal from "@/components/modals/contact-modal";
import { SearchFilters } from "@/lib/types";
import { Product, Supplier } from "@shared/schema";

export default function Home() {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: latestProducts = [] } = useQuery({
    queryKey: ['/api/products', { sortBy: 'latest' }],
    queryFn: async () => {
      const response = await fetch('/api/products?sortBy=latest');
      return response.json();
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  const handleSearch = (filters: SearchFilters) => {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    window.location.href = `/products?${searchParams.toString()}`;
  };

  const handleProductContact = (product: Product) => {
    // Find the supplier for this product
    const supplier = suppliers.find((s: Supplier) => s.id === product.supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setSelectedProduct(product);
      setContactModalOpen(true);
    }
  };

  const handleSupplierContact = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedProduct(null);
    setContactModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Connect. Trade. Grow.
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              The premier B2B marketplace connecting suppliers and buyers worldwide. 
              Find quality products, trusted suppliers, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register?role=supplier">
                <Button className="bg-white text-primary px-8 py-3 hover:bg-gray-100 font-medium">
                  <Store className="w-5 h-5 mr-2" />
                  Join as Supplier
                </Button>
              </Link>
              <Link href="/register?role=buyer">
                <Button className="bg-transparent border-2 border-white text-white px-8 py-3 hover:bg-white hover:text-primary font-medium">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Join as Buyer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Featured Categories */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-dark mb-4">Featured Categories</h2>
            <p className="text-neutral-medium max-w-2xl mx-auto">
              Discover products and suppliers across various industries
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.slice(0, 6).map((category: any) => (
              <Link key={category.id} href={`/products?categoryId=${category.id}`}>
                <Card className="text-center p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="text-3xl text-primary mb-3">
                      <Package />
                    </div>
                    <h3 className="font-medium text-neutral-dark mb-1">{category.name}</h3>
                    <p className="text-sm text-neutral-medium">{category.productCount} products</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-dark">Latest Products</h2>
            <Link href="/products">
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {latestProducts.slice(0, 8).map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onContact={handleProductContact}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Verified Suppliers */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-dark mb-4">Verified Suppliers</h2>
            <p className="text-neutral-medium max-w-2xl mx-auto">
              Connect with trusted suppliers who have been verified for quality and reliability
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.filter((s: any) => s.verified).slice(0, 6).map((supplier: any) => (
              <SupplierCard 
                key={supplier.id} 
                supplier={supplier} 
                onContact={handleSupplierContact}
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/suppliers">
              <Button className="bg-primary text-white hover:bg-blue-700">
                View All Suppliers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-12 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-neutral-medium">Active Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-neutral-medium">Products Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">25,000+</div>
              <div className="text-neutral-medium">Registered Buyers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100+</div>
              <div className="text-neutral-medium">Countries</div>
            </div>
          </div>
        </div>
      </section>

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
