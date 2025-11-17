import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, MessageSquare, Clock, CheckCircle, Package, Trash2, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Inquiry } from "@shared/schema";

export default function SupplierInquiries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const [replies, setReplies] = useState<{[key: number]: string}>({});

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/inquiries/supplier'],
    queryFn: async () => {
      const response = await fetch('/api/inquiries/supplier', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      return response.json();
    },
    enabled: !!currentUser && currentUser.role === 'supplier',
  });

  const replyMutation = useMutation({
    mutationFn: async ({ inquiryId, reply }: { inquiryId: number; reply: string }) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reply }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the buyer",
      });
      setReplies(prev => ({ ...prev, [variables.inquiryId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries/supplier'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete inquiry');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry deleted",
        description: "The inquiry has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries/supplier'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recoverInquiryMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/recover`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to recover inquiry');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry recovered",
        description: "The inquiry has been recovered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries/supplier'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReply = (inquiryId: number) => {
    const reply = replies[inquiryId];
    if (!reply?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }
    
    replyMutation.mutate({ inquiryId, reply });
  };

  const handleReplyChange = (inquiryId: number, value: string) => {
    setReplies(prev => ({ ...prev, [inquiryId]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'replied': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <Package className="h-4 w-4" />;
      case 'deleted': return <Trash2 className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!currentUser || currentUser.role !== 'supplier') {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-medium mb-4">Only suppliers can view inquiries.</p>
            <Link href="/login/supplier">
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
          <Link href="/dashboard/supplier">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-dark mb-2">
            Buyer Inquiries
          </h1>
          <p className="text-neutral-medium">
            Manage and respond to inquiries from potential buyers
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-6 bg-neutral-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded"></div>
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-dark mb-2">
              No inquiries yet
            </h3>
            <p className="text-neutral-medium mb-6">
              When buyers contact you about your products, their inquiries will appear here
            </p>
            <Link href="/products/add">
              <Button>Add More Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.map((inquiry: Inquiry & { buyerName?: string; productName?: string }) => (
              <Card key={inquiry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
                        <p className="text-sm text-neutral-medium">
                          From: {inquiry.buyerName || 'Unknown Buyer'}
                        </p>
                        {inquiry.productName && (
                          <p className="text-sm text-neutral-medium">
                            Product: {inquiry.productName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {getStatusIcon(inquiry.status)}
                        <span className="ml-1 capitalize">{inquiry.status}</span>
                      </Badge>
                      <div className="flex space-x-1">
                        {inquiry.status === 'deleted' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => recoverInquiryMutation.mutate(inquiry.id)}
                            disabled={recoverInquiryMutation.isPending}
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInquiryMutation.mutate(inquiry.id)}
                            disabled={deleteInquiryMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-neutral-dark mb-2">Inquiry Details:</h4>
                      <p className="text-neutral-medium">{inquiry.message}</p>
                      {inquiry.quantity && (
                        <p className="text-sm text-neutral-medium mt-2">
                          Quantity: {inquiry.quantity} units
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-2">
                        Received: {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {inquiry.supplierReply && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">Your Reply:</h4>
                        <p className="text-green-700">{inquiry.supplierReply}</p>
                        <p className="text-xs text-green-600 mt-2">
                          Sent: {inquiry.repliedAt ? new Date(inquiry.repliedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    )}

                    {inquiry.status === 'pending' && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-neutral-dark mb-2">Send Reply:</h4>
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Type your reply to the buyer..."
                            value={replies[inquiry.id] || ''}
                            onChange={(e) => handleReplyChange(inquiry.id, e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleReply(inquiry.id)}
                              disabled={replyMutation.isPending}
                            >
                              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}