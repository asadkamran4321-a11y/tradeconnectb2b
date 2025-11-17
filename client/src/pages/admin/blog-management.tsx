import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, FileText, MoreHorizontal, Calendar, Search, Filter, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { adminAuthService } from "@/lib/adminAuth";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

export default function BlogManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/blog/${id}`, 'DELETE', undefined, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/blog/${id}/publish`, 'POST', undefined, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: "Blog post published successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish blog post",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handlePublish = (id: number) => {
    publishMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter blog posts based on search and status
  const filteredPosts = blogPosts.filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <SimpleNavigationLayout>
      <div className="min-h-screen bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neutral-dark">Blog Management</h1>
              <p className="text-neutral-medium mt-2">
                Create and manage blog posts for your marketplace
              </p>
            </div>
            <Link href="/admin/blog/new">
              <Button className="bg-primary text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Total Posts</p>
                  <p className="text-2xl font-bold text-neutral-dark">{blogPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Published</p>
                  <p className="text-2xl font-bold text-neutral-dark">
                    {blogPosts.filter((post: BlogPost) => post.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">Drafts</p>
                  <p className="text-2xl font-bold text-neutral-dark">
                    {blogPosts.filter((post: BlogPost) => post.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-medium">This Month</p>
                  <p className="text-2xl font-bold text-neutral-dark">
                    {blogPosts.filter((post: BlogPost) => {
                      if (!post.createdAt) return false;
                      const postDate = new Date(post.createdAt);
                      const now = new Date();
                      return postDate.getMonth() === now.getMonth() && 
                             postDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium w-4 h-4" />
                  <Input
                    placeholder="Search blog posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-blogs"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Blog Posts ({filteredPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
                <h3 className="text-lg font-semibold text-neutral-dark mb-2">No blog posts yet</h3>
                <p className="text-neutral-medium mb-4">
                  Create your first blog post to get started
                </p>
                <Link href="/admin/blog/new">
                  <Button className="bg-primary text-white hover:bg-blue-700" data-testid="button-create-first-post">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </Link>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
                <h3 className="text-lg font-semibold text-neutral-dark mb-2">No posts found</h3>
                <p className="text-neutral-medium mb-4">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Title</TableHead>
                      <TableHead className="w-[15%]">Status</TableHead>
                      <TableHead className="w-[20%]">Created</TableHead>
                      <TableHead className="w-[15%]">Tags</TableHead>
                      <TableHead className="w-[10%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post: BlogPost) => (
                      <TableRow key={post.id} className="hover:bg-neutral-light/50">
                        <TableCell>
                          <div>
                            <h3 className="font-semibold text-neutral-dark truncate" data-testid={`text-title-${post.id}`}>
                              {post.title}
                            </h3>
                            <p className="text-sm text-neutral-medium truncate mt-1" data-testid={`text-excerpt-${post.id}`}>
                              {post.excerpt || 'No excerpt available'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div data-testid={`badge-status-${post.id}`}>
                            {getStatusBadge(post.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div data-testid={`text-created-${post.id}`}>
                              {format(new Date(post.createdAt!), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-neutral-medium">
                              {formatDistanceToNow(new Date(post.createdAt!))} ago
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.tags && post.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-tag-${post.id}-${index}`}>
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-medium text-sm">No tags</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {post.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handlePublish(post.id)}
                                disabled={publishMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-publish-${post.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`button-menu-${post.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/admin/blog/edit/${post.id}`} className="flex items-center w-full" data-testid={`link-edit-${post.id}`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                {post.status === 'published' && (
                                  <DropdownMenuItem>
                                    <Link href={`/blog/${post.slug}`} className="flex items-center w-full" data-testid={`link-view-${post.id}`}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(post.id, post.title)}
                                  className="text-red-600"
                                  data-testid={`button-delete-${post.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </SimpleNavigationLayout>
  );
}