import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Search, 
  Plus, 
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, getAuthHeaders } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const replySchema = z.object({
  reply: z.string().min(1, "Reply is required").max(1000, "Reply must be less than 1000 characters")
});

export default function SupplierProducts() {
  const currentUser = authService.getCurrentUser();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      reply: "",
    },
  });

  // Fetch all products (including deleted ones)
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/dashboard/supplier'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/supplier', {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch supplier inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/inquiries/supplier'],
    queryFn: async () => {
      const response = await fetch('/api/inquiries/supplier', {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!currentUser,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('DELETE', `/api/products/${productId}`, {}, getAuthHeaders());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "Product has been moved to trash",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const recoverProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest('POST', `/api/products/${productId}/recover`, {}, getAuthHeaders());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product recovered",
        description: "Product has been restored",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to recover product",
        variant: "destructive",
      });
    },
  });

  const replyToInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, reply }: { inquiryId: number; reply: string }) => {
      const response = await apiRequest('POST', `/api/inquiries/${inquiryId}/reply`, { reply }, getAuthHeaders());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the buyer",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries/supplier'] });
      setSelectedInquiry(null);
      replyForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const allProducts = productsData?.recentProducts || [];
  const activeProducts = allProducts.filter((p: Product) => !p.deletedAt);
  const deletedProducts = allProducts.filter((p: Product) => p.deletedAt);

  const filteredActiveProducts = activeProducts.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeletedProducts = deletedProducts.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const ProductCard = ({ product, isDeleted = false }: { product: Product; isDeleted?: boolean }) => (
    <Card className={`${isDeleted ? 'opacity-60 border-red-200' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(product.status)}
            {isDeleted && <Badge variant="destructive">Deleted</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-semibold">${product.price}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">MOQ</p>
            <p className="font-semibold">{product.moq} {product.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Views</p>
            <p className="font-semibold">{product.views}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Inquiries</p>
            <p className="font-semibold">{product.inquiries}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/products/${product.id}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            {!isDeleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/products/edit/${product.id}`)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isDeleted ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteProductMutation.mutate(product.id)}
                disabled={deleteProductMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => recoverProductMutation.mutate(product.id)}
                disabled={recoverProductMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Recover
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const InquiryCard = ({ inquiry }: { inquiry: any }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">From: {inquiry.buyerName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(inquiry.status)}
            {inquiry.quantity && <Badge variant="outline">{inquiry.quantity} units</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{inquiry.message}</p>
        
        {inquiry.supplierReply && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-700 font-medium">Your Reply:</p>
            <p className="text-sm text-blue-600">{inquiry.supplierReply}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {new Date(inquiry.createdAt).toLocaleDateString()}
          </p>
          
          {inquiry.status === 'pending' && !inquiry.supplierReply && (
            <Button
              size="sm"
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (productsLoading || inquiriesLoading) {
    return (
      <div className="min-h-screen bg-neutral-light p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">Product Management</h1>
          <p className="text-neutral-medium">Manage your products and inquiries</p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active Products ({activeProducts.length})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Products ({deletedProducts.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="add">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setLocation('/products/add')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActiveProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredActiveProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No active products found</p>
                <p className="text-sm text-gray-500">Create your first product to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deleted" className="space-y-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deleted products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeletedProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} isDeleted={true} />
              ))}
            </div>

            {filteredDeletedProducts.length === 0 && (
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No deleted products found</p>
                <p className="text-sm text-gray-500">Deleted products will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inquiries.map((inquiry: any) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} />
              ))}
            </div>

            {inquiries.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No inquiries yet</p>
                <p className="text-sm text-gray-500">Customer inquiries will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setLocation('/products/add')}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Product
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reply to Inquiry Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Inquiry</DialogTitle>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium">{selectedInquiry.subject}</h4>
                  <p className="text-sm text-gray-600 mt-2">{selectedInquiry.message}</p>
                </div>
                
                <Form {...replyForm}>
                  <form onSubmit={replyForm.handleSubmit((data) => {
                    replyToInquiryMutation.mutate({
                      inquiryId: selectedInquiry.id,
                      reply: data.reply
                    });
                  })}>
                    <FormField
                      control={replyForm.control}
                      name="reply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Reply</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write your reply..."
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedInquiry(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={replyToInquiryMutation.isPending}
                      >
                        {replyToInquiryMutation.isPending ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}