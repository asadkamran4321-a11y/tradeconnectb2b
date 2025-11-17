import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ShieldCheck, Star, MapPin, Calendar, UserPlus, UserCheck } from "lucide-react";
import { Supplier } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface SupplierCardProps {
  supplier: Supplier & {
    productCount?: number;
    experience?: string;
  };
  onContact?: (supplier: Supplier) => void;
  isFollowed?: boolean;
}

export default function SupplierCard({ supplier, onContact, isFollowed = false }: SupplierCardProps) {
  const [isFollowing, setIsFollowing] = useState(isFollowed);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();

  const followMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const response = await apiRequest('POST', '/api/follow-supplier', 
        { supplierId }, 
        getAuthHeaders()
      );
      return response.json();
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast({
        title: "Supplier followed",
        description: "You are now following this supplier",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/followed-suppliers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const response = await apiRequest('DELETE', '/api/unfollow-supplier', 
        { supplierId }, 
        getAuthHeaders()
      );
      return response.json();
    },
    onSuccess: () => {
      setIsFollowing(false);
      toast({
        title: "Supplier unfollowed",
        description: "You have unfollowed this supplier",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/followed-suppliers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleContact = () => {
    onContact?.(supplier);
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
        title: "Not available",
        description: "Only buyers can follow suppliers",
        variant: "destructive",
      });
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate(supplier.id);
    } else {
      followMutation.mutate(supplier.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            {supplier.profileImage ? (
              <img 
                src={supplier.profileImage} 
                alt={supplier.companyName}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-white text-xl font-bold">
                {supplier.companyName.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-dark">{supplier.companyName}</h3>
            <div className="flex items-center space-x-2 text-sm text-neutral-medium">
              <MapPin className="h-4 w-4" />
              <span>{supplier.location}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {supplier.verified && (
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-xs text-success">Verified</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-xs text-neutral-medium">{supplier.rating}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-neutral-medium line-clamp-2">
            {supplier.description || "No description available"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-neutral-medium">
          <div>
            <span className="font-medium">{supplier.productCount || 0}</span>
            <span className="ml-1">Products</span>
          </div>
          <div>
            <span className="font-medium">{supplier.experience || "New"}</span>
            <span className="ml-1">Experience</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/suppliers/${supplier.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Profile
            </Button>
          </Link>
          <Button 
            onClick={handleContact}
            size="icon" 
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Mail className="h-4 w-4" />
          </Button>
          {currentUser && currentUser.role === 'buyer' && (
            <Button 
              onClick={handleFollow}
              size="icon" 
              variant={isFollowing ? "default" : "outline"}
              className={isFollowing ? "bg-success text-white" : ""}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
