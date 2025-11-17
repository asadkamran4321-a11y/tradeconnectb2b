import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, X, Plus, Upload, FileImage } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InsertBlogPost } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminAuthService } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/queryClient";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function BlogEditor() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!id && id !== 'new';

  const { data: blogPost, isLoading } = useQuery({
    queryKey: ['/api/blog', id],
    queryFn: async () => {
      if (!isEditing) return null;
      const response = await fetch(`/api/blog/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }
      return response.json();
    },
    enabled: isEditing,
  });

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      status: "draft",
      tags: [],
      metaTitle: "",
      metaDescription: "",
    },
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Update form when blog post data is loaded
  useEffect(() => {
    if (blogPost && isEditing) {
      form.reset({
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        excerpt: blogPost.excerpt || "",
        featuredImage: blogPost.featuredImage || "",
        status: blogPost.status,
        tags: blogPost.tags || [],
        metaTitle: blogPost.metaTitle || "",
        metaDescription: blogPost.metaDescription || "",
      });
      setCurrentTags(blogPost.tags || []);
    }
  }, [blogPost, isEditing, form]);

  // Auto-generate slug when title changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title && !isEditing) {
        const slug = generateSlug(value.title);
        form.setValue('slug', slug);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const url = isEditing ? `/api/blog/${id}` : '/api/blog';
      const method = isEditing ? 'PUT' : 'POST';
      
      return await apiRequest(url, method, {
        ...data,
        tags: currentTags,
      }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: `Blog post ${isEditing ? 'updated' : 'created'} successfully`,
      });
      navigate('/admin/blog');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing) {
        throw new Error('Cannot publish unsaved post');
      }
      return await apiRequest(`/api/blog/${id}/publish`, 'POST', undefined, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: "Blog post published successfully",
      });
      navigate('/admin/blog');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      return await apiRequest('/api/upload/image', 'POST', formData, adminAuthService.getAuthHeaders());
    },
    onSuccess: (data) => {
      setIsUploading(false);
      form.setValue('featuredImage', data.url);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      form.setValue('featuredImage', `https://picsum.photos/800/400?random=${Date.now()}`);
      toast({
        title: "Error",
        description: "Image upload failed. Using placeholder URL instead.",
        variant: "destructive",
      });
    },
  });

  // Save as draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const url = isEditing ? `/api/blog/${id}` : '/api/blog';
      const method = isEditing ? 'PUT' : 'POST';
      
      return await apiRequest(url, method, {
        ...data,
        status: 'draft',
        tags: currentTags,
      }, adminAuthService.getAuthHeaders());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: "Blog post saved as draft",
      });
      if (!isEditing) {
        navigate(`/admin/blog/edit/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publish directly
  const publishDirectlyMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const url = isEditing ? `/api/blog/${id}` : '/api/blog';
      const method = isEditing ? 'PUT' : 'POST';
      
      return await apiRequest(url, method, {
        ...data,
        status: 'published',
        tags: currentTags,
      }, adminAuthService.getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Success",
        description: "Blog post published successfully",
      });
      navigate('/admin/blog');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const onSubmit = (data: BlogPostFormData) => {
    saveMutation.mutate(data);
  };

  const handleSaveDraft = () => {
    const formData = form.getValues();
    saveDraftMutation.mutate(formData);
  };

  const handlePublishDirectly = () => {
    const formData = form.getValues();
    publishDirectlyMutation.mutate(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setCurrentTags([...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const insertFormatting = (type: string) => {
    const currentContent = form.getValues('content') || '';
    const textareaElement = document.getElementById('content') as HTMLTextAreaElement;
    const start = textareaElement?.selectionStart || currentContent.length;
    const end = textareaElement?.selectionEnd || currentContent.length;
    const selectedText = currentContent.substring(start, end);
    
    let insertion = '';
    
    switch (type) {
      case 'h1':
        insertion = `<h1>${selectedText || 'Heading 1'}</h1>`;
        break;
      case 'h2':
        insertion = `<h2>${selectedText || 'Heading 2'}</h2>`;
        break;
      case 'h3':
        insertion = `<h3>${selectedText || 'Heading 3'}</h3>`;
        break;
      case 'p':
        insertion = `<p>${selectedText || 'Your paragraph text here.'}</p>`;
        break;
      case 'strong':
        insertion = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'em':
        insertion = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'link':
        const url = prompt('Enter the URL:') || '#';
        insertion = `<a href="${url}" target="_blank" rel="noopener">${selectedText || 'link text'}</a>`;
        break;
      case 'nofollow-link':
        const nofollowUrl = prompt('Enter the URL:') || '#';
        insertion = `<a href="${nofollowUrl}" target="_blank" rel="noopener nofollow">${selectedText || 'link text'}</a>`;
        break;
      default:
        insertion = selectedText;
    }
    
    const newContent = currentContent.substring(0, start) + insertion + currentContent.substring(end);
    form.setValue('content', newContent);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaElement?.focus();
      textareaElement?.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  const handlePublish = () => {
    if (isEditing) {
      publishMutation.mutate();
    } else {
      // Save as published
      const formData = form.getValues();
      saveMutation.mutate({ ...formData, status: 'published' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-neutral-dark">
              {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={handlePublishDirectly}
              disabled={publishDirectlyMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Enter blog post title"
                      className="mt-1"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      {...form.register('slug')}
                      placeholder="post-url-slug"
                      className="mt-1"
                    />
                    {form.formState.errors.slug && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.slug.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      {...form.register('excerpt')}
                      placeholder="Brief description of the post"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <div className="mt-1 space-y-2">
                      {/* Rich Text Formatting Toolbar */}
                      <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-t-md bg-gray-50">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('h1')}
                          className="text-xs"
                        >
                          H1
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('h2')}
                          className="text-xs"
                        >
                          H2
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('h3')}
                          className="text-xs"
                        >
                          H3
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('p')}
                          className="text-xs"
                        >
                          Paragraph
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('strong')}
                          className="text-xs"
                        >
                          <strong>Bold</strong>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('em')}
                          className="text-xs"
                        >
                          <em>Italic</em>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('link')}
                          className="text-xs"
                        >
                          Link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertFormatting('nofollow-link')}
                          className="text-xs"
                        >
                          No-Follow Link
                        </Button>
                      </div>
                      
                      <Textarea
                        id="content"
                        {...form.register('content')}
                        placeholder="Write your blog post content using HTML tags for formatting..."
                        rows={20}
                        className="font-mono text-sm border-t-0 rounded-t-none"
                      />
                      
                      {/* Content Preview */}
                      <div className="border border-gray-200 rounded-md p-4 bg-white">
                        <div className="text-xs text-gray-500 mb-2">Preview:</div>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: form.watch('content') || '<p>Start typing to see preview...</p>' }}
                        />
                      </div>
                    </div>
                    {form.formState.errors.content && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.content.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      {...form.register('metaTitle')}
                      placeholder="SEO title (leave empty to use post title)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      {...form.register('metaDescription')}
                      placeholder="SEO description for search engines"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.watch('status')}
                      onValueChange={(value) => form.setValue('status', value as any)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="imageUpload">Upload Image</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('imageUpload')?.click()}
                        disabled={isUploading || uploadImageMutation.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="featuredImage">Image URL</Label>
                    <Input
                      id="featuredImage"
                      {...form.register('featuredImage')}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>
                  
                  {form.watch('featuredImage') && (
                    <div>
                      <Label>Preview</Label>
                      <div className="mt-1 relative">
                        <img
                          src={form.watch('featuredImage')}
                          alt="Featured image preview"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}