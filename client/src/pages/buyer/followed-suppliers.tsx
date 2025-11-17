import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Building, UserMinus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@shared/schema";
import ContactModal from "@/components/modals/contact-modal";

export default function FollowedSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const { data: followedSuppliers = [], isLoading } = useQuery({
    queryKey: ['/api/followed-suppliers'],
    enabled: !!currentUser && currentUser.role === 'buyer',
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
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
      toast({
        title: "Supplier unfollowed",
        description: "Supplier has been removed from your followed list",
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

  const handleUnfollow = (supplierId: number) => {
    unfollowMutation.mutate(supplierId);
  };

  const handleContact = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
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
            <p className="text-neutral-medium mb-4">Only buyers can view followed suppliers.</p>
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
            Followed Suppliers
          </h1>
          <p className="text-neutral-medium">
            Suppliers you're following for updates and new products
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-neutral-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                      <div className="h-3 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-neutral-200 rounded mb-4"></div>
                  <div className="h-8 bg-neutral-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : followedSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">
              No followed suppliers yet
            </h3>
            <p className="text-neutral-medium mb-6">
              Start following suppliers to stay updated on their latest products
            </p>
            <Link href="/suppliers">
              <Button>Browse Suppliers</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedSuppliers.map((followedSupplier: any) => {
              const supplier = suppliers.find((s: any) => s.id === followedSupplier.supplierId);
              
              if (!supplier) return null;
              
              return (
                <Card key={followedSupplier.id} className="hover:shadow-md transition-shadow">
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
                        <Link href={`/suppliers/${supplier.id}`}>
                          <h3 className="font-semibold text-neutral-dark hover:text-primary cursor-pointer">
                            {supplier.companyName}
                          </h3>
                        </Link>
                        <p className="text-sm text-neutral-medium">
                          {supplier.location}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {supplier.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          <span className="text-xs text-neutral-medium">
                            ⭐ {supplier.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-neutral-medium line-clamp-2">
                        {supplier.description || "No description available"}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleContact(supplier)}
                        className="flex-1"
                      >
                        Contact
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(supplier.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
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
        supplier={selectedSupplier}
        product={null}
      />
    </div>
  );
}