import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2, Edit, Play, RefreshCw, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";

export default function ProductDrafts() {
  const currentUser = authService.getCurrentUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading: draftsLoading } = useQuery({
    queryKey: ['/api/products/drafts'],
    queryFn: () => apiRequest('/api/products/drafts', 'GET', undefined, getAuthHeaders()),
  });

  const { data: deletedProducts = [], isLoading: deletedLoading } = useQuery({
    queryKey: ['/api/products/deleted'],
    queryFn: () => apiRequest('/api/products/deleted', 'GET', undefined, getAuthHeaders()),
  });

  const publishDraftMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/products/draft/${productId}/publish`, 'POST', undefined, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
      toast({
        title: "Draft published successfully",
        description: "Your product has been submitted for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recoverProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/products/${productId}/recover`, 'POST', undefined, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
      toast({
        title: "Product recovered successfully",
        description: "Your product has been restored and is now pending review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/products/${productId}`, 'DELETE', undefined, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
      toast({
        title: "Product deleted successfully",
        description: "Your product has been moved to the deleted section.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (currentUser?.role !== 'supplier') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">Only suppliers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard/supplier')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-neutral-dark">Product Management</h1>
          <p className="text-neutral-medium mt-2">
            Manage your draft and deleted products
          </p>
        </div>

        <Tabs defaultValue="drafts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drafts">Draft Products</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Products</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Draft Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {draftsLoading ? (
                  <div className="text-center py-8">Loading drafts...</div>
                ) : drafts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drafts.map((product: any) => (
                      <Card key={product.id} className="border-dashed border-2 border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Price: ${parseFloat(product.price || 0).toFixed(2)}
                          </p>
                          <Badge variant="secondary" className="mb-4">
                            <FileText className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/products/edit/${product.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => publishDraftMutation.mutate(product.id)}
                              disabled={publishDraftMutation.isPending}
                              className="bg-primary text-white hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No draft products found</p>
                    <p className="text-sm">You can save products as drafts while creating them</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deleted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Deleted Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deletedLoading ? (
                  <div className="text-center py-8">Loading deleted products...</div>
                ) : deletedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deletedProducts.map((product: any) => (
                      <Card key={product.id} className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover opacity-60"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Price: ${parseFloat(product.price || 0).toFixed(2)}
                          </p>
                          <Badge variant="destructive" className="mb-4">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Deleted
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => recoverProductMutation.mutate(product.id)}
                              disabled={recoverProductMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Recover
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No deleted products found</p>
                    <p className="text-sm">Deleted products will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}