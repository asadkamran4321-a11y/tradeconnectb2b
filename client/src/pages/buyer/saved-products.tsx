import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Package, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import ContactModal from "@/components/modals/contact-modal";

export default function SavedProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { data: savedProducts = [], isLoading } = useQuery({
    queryKey: ['/api/saved-products'],
    enabled: !!currentUser && currentUser.role === 'buyer',
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('DELETE', '/api/saved-products', 
        { productId }, 
        getAuthHeaders()
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product removed",
        description: "Product has been removed from your saved list",
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

  const handleRemove = (productId: number) => {
    removeMutation.mutate(productId);
  };

  const handleContact = (product: Product) => {
    setSelectedProduct(product);
    setContactModalOpen(true);
  };

  if (!currentUser || currentUser.role !== 'buyer') {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-medium mb-4">Only buyers can view saved products.</p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">
            Saved Products
          </h1>
          <p className="text-neutral-medium">
            Products you've saved for later consideration
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="w-full h-48 bg-neutral-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded mb-4"></div>
                  <div className="h-8 bg-neutral-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">
              No saved products yet
            </h3>
            <p className="text-neutral-medium mb-6">
              Start exploring products and save the ones you're interested in
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedProducts.map((savedProduct: any) => {
              const product = savedProduct.product;
              const supplier = suppliers.find((s: any) => s.id === product?.supplierId);
              
              return (
                <Card key={savedProduct.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <div className="w-full h-48 bg-neutral-200 rounded-lg overflow-hidden">
                        {product?.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Package className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        onClick={() => handleRemove(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-neutral-dark hover:text-primary cursor-pointer line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-neutral-medium">
                        by {supplier?.companyName || 'Unknown Supplier'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-bold text-primary">
                        ${product.price}
                      </div>
                      <Badge variant="outline">
                        MOQ: {product.moq} {product.unit}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/products/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => handleContact(product)}
                        className="flex-1"
                      >
                        Contact Supplier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        supplier={selectedProduct ? suppliers.find((s: any) => s.id === selectedProduct.supplierId) : null}
        product={selectedProduct}
      />
    </div>
  );
}