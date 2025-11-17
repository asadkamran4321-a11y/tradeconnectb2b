import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Info, Star, MessageCircle } from "lucide-react";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product & {
    supplier?: {
      companyName: string;
      location: string;
      verified: boolean;
    };
    category?: {
      name: string;
    };
  };
  onContact?: (product: Product) => void;
}

export default function ProductCard({ product, onContact }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();

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

    saveMutation.mutate(product.id);
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

    onContact?.(product);
  };

  const displayPrice = product.price 
    ? `$${product.price}` 
    : product.minPrice && product.maxPrice
    ? `$${product.minPrice} - $${product.maxPrice}`
    : 'Contact for price';

  const displayRating = product.rating ? Number(product.rating) : 0;
  const displayMOQ = product.moq || product.minOrder || 1;
  const displayUnit = product.unit || 'units';

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="relative">
        <img 
          src={product.images?.[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop"} 
          alt={product.name}
          className="w-full aspect-square object-cover rounded-t-lg"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 bg-white hover:bg-gray-50 h-8 w-8"
          onClick={handleLike}
          disabled={saveMutation.isPending}
        >
          <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </Button>
      </div>
      
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="font-medium text-neutral-dark mb-1 line-clamp-2 text-sm leading-tight">{product.name}</h3>
          <p className="text-xs text-neutral-medium mb-2 line-clamp-1">{product.category?.name}</p>
          
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-2.5 w-2.5 ${i < Math.floor(displayRating) ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="text-xs text-neutral-medium">({displayRating.toFixed(1)})</span>
          </div>
          
          <div className="mb-2">
            <span className="text-sm font-bold text-success block">{displayPrice}</span>
            <span className="text-xs text-neutral-medium">Min: {displayMOQ} {displayUnit}</span>
          </div>
          
          {product.supplier && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {product.supplier.companyName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-medium line-clamp-1">
                  {product.supplier.companyName}
                </p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-neutral-medium truncate">{product.supplier.location}</span>
                  {product.supplier.verified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-1 mt-2">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button 
              className="w-full bg-primary text-white hover:bg-blue-700 h-8 text-xs"
              size="sm"
            >
              View
            </Button>
          </Link>
          <Button 
            onClick={handleContact}
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
