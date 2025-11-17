import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Package, 
  Send,
  Building,
  User,
  Calendar,
  Eye,
  MessageCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

export default function BuyerInquiries() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/inquiries/buyer'],
    queryFn: async () => {
      const response = await fetch('/api/inquiries/buyer', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    enabled: !!currentUser && currentUser.role === 'buyer',
  });

  const replyMutation = useMutation({
    mutationFn: async ({ inquiryId, reply }: { inquiryId: number; reply: string }) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/buyer-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reply }),
      });
      
      if (!response.ok) throw new Error('Failed to send reply');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the supplier",
      });
      setReplyText("");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries/buyer'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'replied': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <Package className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedInquiry) {
      replyMutation.mutate({ inquiryId: selectedInquiry.id, reply: replyText });
    }
  };

  // Access control check
  if (!currentUser || currentUser.role !== 'buyer') {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-medium mb-4">Only buyers can view inquiries.</p>
            <Link href="/login/buyer">
              <Button>Sign In as Buyer</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-medium">Loading your inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/buyer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-dark">My Inquiries</h1>
              <p className="text-neutral-medium">Track your product inquiries and supplier responses</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {inquiries.length} Total Inquiries
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {inquiries.filter(i => i.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Replied</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inquiries.filter(i => i.status === 'replied').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{inquiries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-neutral-light mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Inquiries Yet</h3>
                  <p className="text-neutral-medium mb-4">You haven't sent any product inquiries yet.</p>
                  <Link href="/">
                    <Button>Browse Products</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            inquiries.map((inquiry: any) => (
              <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-neutral-dark">{inquiry.subject}</h3>
                        <Badge className={`${getStatusColor(inquiry.status)} text-xs`}>
                          {getStatusIcon(inquiry.status)}
                          <span className="ml-1 capitalize">{inquiry.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-neutral-medium mb-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>{inquiry.productName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>Quantity: {inquiry.quantity}</span>
                        </div>
                      </div>

                      <div className="bg-neutral-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-neutral-dark">{inquiry.message}</p>
                      </div>

                      {/* Supplier Reply */}
                      {inquiry.supplierReply && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Supplier Response</span>
                            <span className="text-xs text-neutral-medium">
                              {new Date(inquiry.repliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-dark">{inquiry.supplierReply}</p>
                        </div>
                      )}

                      {/* Your Reply */}
                      {inquiry.buyerReply && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Your Reply</span>
                            <span className="text-xs text-neutral-medium">
                              {new Date(inquiry.buyerRepliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-dark">{inquiry.buyerReply}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {inquiry.supplierReply && !inquiry.buyerReply && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reply to Supplier</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-neutral-dark">{selectedInquiry?.supplierReply}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-neutral-dark mb-2">
                                  Your Reply
                                </label>
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="min-h-[100px]"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={handleSendReply}
                                  disabled={replyMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}