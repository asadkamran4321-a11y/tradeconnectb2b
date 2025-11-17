import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Package, 
  Trash2, 
  RotateCcw,
  Send,
  Search,
  Filter,
  Archive,
  Eye,
  Calendar,
  User,
  Building,
  MessageCircle,
  Plus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InquiriesDashboard() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is properly authenticated on mount and set up auto-refresh
  useEffect(() => {
    const authUser = authService.getCurrentUser();
    console.log('Auth user from service:', authUser);
    if (authUser && authUser.role === 'supplier') {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries/supplier"] });
      
      // Set up periodic refresh for new inquiries every 30 seconds
      const intervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/inquiries/supplier"] });
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [queryClient]);

  const { data: currentUser, isLoading: isUserLoading } = useQuery<{
    id: number;
    email: string;
    role: string;
    approved: boolean;
  }>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/auth/user", {
        headers: {
          ...headers,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const { data: inquiries = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/inquiries/supplier'],
    enabled: !!currentUser && currentUser.role === 'supplier',
    queryFn: async () => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/inquiries/supplier", {
        headers: {
          ...headers,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ inquiryId, reply }: { inquiryId: number; reply: string }) => {
      return apiRequest(`/api/inquiries/${inquiryId}/reply`, 'POST', { reply }, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      setReplyText("");
      setIsDialogOpen(false);
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
      return apiRequest(`/api/inquiries/${inquiryId}`, 'DELETE', {}, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Inquiry deleted",
        description: "The inquiry has been moved to archive",
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
      return apiRequest(`/api/inquiries/${inquiryId}/recover`, 'POST', {}, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Inquiry recovered",
        description: "The inquiry has been restored",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'replied': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <Package className="h-4 w-4" />;
      case 'deleted': return <Archive className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (quantity: number) => {
    if (quantity >= 100) return 'bg-red-100 text-red-800 border-red-200';
    if (quantity >= 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getPriorityLabel = (quantity: number) => {
    if (quantity >= 100) return 'High Volume';
    if (quantity >= 50) return 'Medium Volume';
    return 'Low Volume';
  };

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch = inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inquiry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = inquiries.filter((i: any) => i.status === 'pending').length;
  const repliedCount = inquiries.filter((i: any) => i.status === 'replied').length;
  const deletedCount = inquiries.filter((i: any) => i.status === 'deleted').length;

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

  // Show loading state while checking authentication
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-medium">Checking authentication...</p>
          <div className="mt-4 text-xs text-gray-500">
            Auth Service User: {JSON.stringify(authService.getCurrentUser())}
          </div>
        </div>
      </div>
    );
  }

  // Check both query result and auth service for authentication
  const authServiceUser = authService.getCurrentUser();
  const authenticatedUser = currentUser || authServiceUser;

  // Access control - only show after authentication check is complete
  if (!authenticatedUser || authenticatedUser.role !== 'supplier') {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-medium mb-4">Only suppliers can view inquiries.</p>
            <div className="text-xs text-gray-500 mb-4">
              Query User: {JSON.stringify(currentUser)}<br/>
              Auth Service: {JSON.stringify(authServiceUser)}<br/>
              Headers: {JSON.stringify(getAuthHeaders())}
            </div>
            <Button 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                queryClient.invalidateQueries({ queryKey: ["/api/inquiries/supplier"] });
              }}
              className="mb-2 w-full"
            >
              Retry Authentication
            </Button>
            <Link href="/login/supplier">
              <Button variant="outline" className="w-full">Sign In as Supplier</Button>
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
          <p className="text-neutral-medium">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/supplier">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-dark">Inquiry Management</h1>
              <p className="text-neutral-medium">Manage and respond to buyer inquiries</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {inquiries.length} Total Inquiries
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
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
                  <p className="text-2xl font-bold text-green-600">{repliedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full">
                  <Archive className="h-4 w-4 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Archived</p>
                  <p className="text-2xl font-bold text-red-600">{deletedCount}</p>
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

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-medium" />
                  <Input
                    placeholder="Search inquiries by subject, buyer, or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="deleted">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInquiries.map((inquiry: any) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-neutral-dark mb-2">
                      {inquiry.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {getStatusIcon(inquiry.status)}
                        <span className="ml-1 capitalize">{inquiry.status}</span>
                      </Badge>
                      <Badge className={getPriorityColor(inquiry.quantity)}>
                        {getPriorityLabel(inquiry.quantity)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog open={isDialogOpen && selectedInquiry?.id === inquiry.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {inquiry.status === 'deleted' ? <MessageCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            {inquiry.status === 'deleted' && <Trash2 className="h-5 w-5 text-red-600" />}
                            <span>{inquiry.subject}</span>
                            {inquiry.status === 'deleted' && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                In Trash
                              </Badge>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        <InquiryDetailView 
                          inquiry={inquiry} 
                          replyText={replyText}
                          setReplyText={setReplyText}
                          onSendReply={handleSendReply}
                          isReplying={replyMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                    <Building className="h-4 w-4" />
                    <span>{inquiry.buyerName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                    <Package className="h-4 w-4" />
                    <span>{inquiry.productName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-medium">
                    <span className="font-medium">Quantity:</span>
                    <span>{inquiry.quantity?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="bg-neutral-light p-3 rounded-lg">
                  <p className="text-sm text-neutral-dark line-clamp-3">
                    {inquiry.message}
                  </p>
                </div>
                {inquiry.supplierReply && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800">
                      <strong>Your Reply:</strong> {inquiry.supplierReply}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInquiries.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 text-neutral-medium mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-dark mb-2">No inquiries found</h3>
              <p className="text-neutral-medium">
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter criteria" 
                  : "You haven't received any inquiries yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InquiryDetailView({ 
  inquiry, 
  replyText, 
  setReplyText, 
  onSendReply, 
  isReplying 
}: {
  inquiry: any;
  replyText: string;
  setReplyText: (text: string) => void;
  onSendReply: () => void;
  isReplying: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Inquiry Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-neutral-medium" />
            <span className="text-sm font-medium">Buyer:</span>
            <span className="text-sm">{inquiry.buyerName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-neutral-medium" />
            <span className="text-sm font-medium">Email:</span>
            <span className="text-sm">{inquiry.buyerEmail}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-neutral-medium" />
            <span className="text-sm font-medium">Product:</span>
            <span className="text-sm">{inquiry.productName}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-neutral-medium" />
            <span className="text-sm font-medium">Date:</span>
            <span className="text-sm">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Quantity:</span>
            <span className="text-sm">{inquiry.quantity?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
              {inquiry.status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Conversation */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Conversation</h3>
          {inquiry.status === 'deleted' && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <Trash2 className="h-4 w-4" />
              <span>This conversation is in trash</span>
            </div>
          )}
        </div>
        <div className={`border rounded-lg p-4 ${inquiry.status === 'deleted' ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4 pr-4">
              {/* Original Message */}
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-blue-800">{inquiry.buyerName}</span>
                        <Badge variant="outline" className="text-xs">Buyer</Badge>
                      </div>
                      <span className="text-xs text-blue-600">
                        {new Date(inquiry.createdAt).toLocaleDateString()} at {new Date(inquiry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">{inquiry.message}</p>
                    <div className="mt-3 flex items-center space-x-4 text-xs text-blue-700">
                      <span>📦 {inquiry.productName}</span>
                      <span>📊 Quantity: {inquiry.quantity?.toLocaleString()}</span>
                      <span>✉️ {inquiry.buyerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Reply */}
              {inquiry.supplierReply && (
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-green-800">You (Supplier)</span>
                          <Badge variant="outline" className="text-xs bg-green-100">Reply</Badge>
                        </div>
                        <span className="text-xs text-green-600">
                          {new Date(inquiry.repliedAt).toLocaleDateString()} at {new Date(inquiry.repliedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-green-900 leading-relaxed">{inquiry.supplierReply}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Reply */}
              {inquiry.buyerReply && (
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-blue-800">{inquiry.buyerName}</span>
                          <Badge variant="outline" className="text-xs">Follow-up</Badge>
                        </div>
                        <span className="text-xs text-blue-600">
                          {new Date(inquiry.buyerRepliedAt).toLocaleDateString()} at {new Date(inquiry.buyerRepliedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-900 leading-relaxed">{inquiry.buyerReply}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* End of conversation indicator */}
              <div className="text-center py-4">
                <div className="text-xs text-gray-400 flex items-center justify-center space-x-2">
                  <div className="w-8 h-px bg-gray-300"></div>
                  <span>End of conversation</span>
                  <div className="w-8 h-px bg-gray-300"></div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Reply Section */}
      {inquiry.status === 'pending' && (
        <div className="space-y-4">
          <Separator />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Send Reply</h3>
            <Textarea
              placeholder="Type your reply to the buyer..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={onSendReply}
                disabled={isReplying || !replyText.trim()}
              >
                {isReplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Inquiry Actions */}
      {inquiry.status === 'deleted' && (
        <div className="space-y-4">
          <Separator />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">This inquiry is in trash</h4>
                  <p className="text-xs text-red-600">You can view the conversation history and recover if needed</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => {
                  // This would trigger the recover mutation from the parent component
                  console.log('Recover inquiry:', inquiry.id);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Recover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}