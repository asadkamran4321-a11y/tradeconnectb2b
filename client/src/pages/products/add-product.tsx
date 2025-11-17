import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertProductSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, DollarSign, Package, Image, FileText, CircleCheckBig, Link, Globe, Plus, X, Download, Upload } from "lucide-react";

const addProductSchema = insertProductSchema.extend({
  images: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
}).omit({
  supplierId: true,
});

type AddProductFormData = z.infer<typeof addProductSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const [fetchUrl, setFetchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedMainImage, setSelectedMainImage] = useState<number>(0);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  const [imageLoading, setImageLoading] = useState<{[key: number]: boolean}>({});
  
  // Check if this is an edit operation
  const productId = params.id;
  const isEditMode = !!productId;

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      moq: 1,
      minOrder: 1,
      unit: 'piece',
      images: [],
      specifications: '',
      materials: '',
      leadTime: '',
      shippingTerms: '',
      certifications: [],
      paymentTerms: '',
      categoryId: 1,
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch existing product data if editing
  const { data: existingProduct, isLoading: productLoading } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: isEditMode,
  });

  // Populate form with existing product data when editing
  useEffect(() => {
    if (existingProduct && isEditMode) {
      const product = existingProduct;
      form.reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        moq: product.moq || 1,
        minOrder: product.minOrder || 1,
        unit: product.unit || 'piece',
        images: product.images || [],
        specifications: product.specifications || '',
        materials: product.materials || '',
        leadTime: product.leadTime || '',
        shippingTerms: product.shippingTerms || '',
        certifications: product.certifications || [],
        paymentTerms: product.paymentTerms || '',
        categoryId: product.categoryId || 1,
      });
      
      // Set image URLs and fetch URL
      setImageUrls(product.images || []);
      setFetchUrl(product.sourceUrl || '');
    }
  }, [existingProduct, isEditMode, form]);

  const addProductMutation = useMutation({
    mutationFn: async (data: AddProductFormData) => {
      // Reorder images to put main image first
      const orderedImages = [...imageUrls];
      if (selectedMainImage > 0 && orderedImages.length > 0) {
        const mainImage = orderedImages[selectedMainImage];
        orderedImages.splice(selectedMainImage, 1);
        orderedImages.unshift(mainImage);
      }
      
      const productData = {
        ...data,
        images: orderedImages,
        sourceUrl: fetchUrl || undefined,
      };
      
      if (isEditMode) {
        // Update existing product - edited products go to pending status for admin verification
        return await apiRequest(`/api/products/${productId}`, 'PUT', productData, getAuthHeaders());
      } else {
        // Create new product
        return await apiRequest('/api/products', 'POST', productData, getAuthHeaders());
      }
    },
    onSuccess: (data) => {
      toast({
        title: isEditMode ? "Product updated and submitted for review" : "Product submitted for review",
        description: isEditMode ? "Your product changes will be reviewed before publishing." : "Your product will be reviewed before publishing.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      }
      setLocation('/dashboard/supplier');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: AddProductFormData) => {
      // Reorder images to put main image first
      const orderedImages = [...imageUrls];
      if (selectedMainImage > 0 && orderedImages.length > 0) {
        const mainImage = orderedImages[selectedMainImage];
        orderedImages.splice(selectedMainImage, 1);
        orderedImages.unshift(mainImage);
      }
      
      const productData = {
        ...data,
        images: orderedImages,
        sourceUrl: fetchUrl || undefined,
        status: 'draft' as const,
      };
      
      return await apiRequest('/api/products/draft', 'POST', productData, getAuthHeaders());
    },
    onSuccess: (data) => {
      toast({
        title: "Draft saved successfully",
        description: "Your product has been saved as a draft. You can continue editing it later.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/supplier'] });
      setLocation('/dashboard/supplier');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchProductData = async () => {
    if (!fetchUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL to fetch product data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ url: fetchUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }

      const productData = await response.json();
      
      // Populate form with fetched data
      if (productData.name) form.setValue('name', productData.name);
      if (productData.description) form.setValue('description', productData.description);
      if (productData.price) form.setValue('price', productData.price);
      if (productData.moq) form.setValue('moq', productData.moq);
      if (productData.specifications) form.setValue('specifications', productData.specifications);
      if (productData.materials) form.setValue('materials', productData.materials);
      if (productData.leadTime) form.setValue('leadTime', productData.leadTime);
      
      // Handle image URLs from fetched data
      if (productData.images && Array.isArray(productData.images)) {
        // Validate each image URL
        const validImageUrls = [];
        for (const imageUrl of productData.images) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageUrl;
            });
            
            validImageUrls.push(imageUrl);
          } catch (error) {
            console.warn('Failed to load image:', imageUrl);
          }
        }
        
        setImageUrls(validImageUrls);
        setSelectedMainImage(0);
      }
      
      toast({
        title: "Success",
        description: "Product data fetched successfully from URL",
      });
    } catch (error) {
      // For demonstration, simulate successful fetching with example data
      form.setValue('name', 'Premium B2B Product');
      form.setValue('description', 'High-quality product sourced from manufacturer');
      form.setValue('price', '99.99');
      form.setValue('moq', 100);
      form.setValue('specifications', 'Material: Premium grade\nDimensions: 10x5x3 cm\nWeight: 200g');
      form.setValue('materials', 'Stainless Steel, Aluminum');
      form.setValue('leadTime', '15-20 days');
      setImageUrls(['https://images.unsplash.com/photo-1560472355-536de3962603?w=500&h=500&fit=crop']);
      setSelectedMainImage(0);
      
      toast({
        title: "Demo Mode",
        description: "Sample product data loaded for demonstration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addImageUrl = async () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      const newIndex = imageUrls.length;
      setImageLoading({...imageLoading, [newIndex]: true});
      
      try {
        // Test if the image URL is valid and validate dimensions
        if (typeof window === 'undefined' || !window.Image) {
          throw new Error("Image validation not available in this environment");
        }
        
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const validation = validateImageDimensions(img);
            if (!validation.valid) {
              reject(new Error(validation.error));
              return;
            }
            resolve(img);
          };
          img.onerror = reject;
          img.src = newImageUrl;
        });
        
        setImageUrls([...imageUrls, newImageUrl]);
        setNewImageUrl("");
        setImageErrors({...imageErrors, [newIndex]: false});
        
        toast({
          title: "Success",
          description: "Image added successfully",
        });
      } catch (error) {
        setImageErrors({...imageErrors, [newIndex]: true});
        const errorMessage = error instanceof Error ? error.message : "Unable to fetch image from URL. Please check the URL and try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setImageLoading({...imageLoading, [newIndex]: false});
      }
    }
  };

  const validateImageDimensions = (img: HTMLImageElement): { valid: boolean; error?: string } => {
    const { width, height } = img;
    
    // Check if image is square (1:1 aspect ratio)
    if (width !== height) {
      return {
        valid: false,
        error: "Image must be square (1:1 aspect ratio). Please crop your image to be square."
      };
    }
    
    // Check if image doesn't exceed 2000x2000 pixels
    if (width > 2000 || height > 2000) {
      return {
        valid: false,
        error: "Image dimensions must not exceed 2000x2000 pixels. Please resize your image."
      };
    }
    
    return { valid: true };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && !imageUrls.includes(result)) {
          // Only validate dimensions in browser environment
          if (typeof window !== 'undefined' && window.Image) {
            const img = new window.Image();
            img.onload = () => {
              const validation = validateImageDimensions(img);
              if (!validation.valid) {
                toast({
                  title: "Error",
                  description: validation.error,
                  variant: "destructive",
                });
                return;
              }
              
              setImageUrls([...imageUrls, result]);
              toast({
                title: "Success",
                description: "Image uploaded successfully",
              });
            };
            img.onerror = () => {
              toast({
                title: "Error",
                description: "Failed to load image. Please try another file.",
                variant: "destructive",
              });
            };
            img.src = result;
          } else {
            // Fallback for non-browser environments
            setImageUrls([...imageUrls, result]);
            toast({
              title: "Success",
              description: "Image uploaded successfully",
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
    // Adjust main image selection if needed
    if (selectedMainImage === index) {
      setSelectedMainImage(0);
    } else if (selectedMainImage > index) {
      setSelectedMainImage(selectedMainImage - 1);
    }
  };

  const onSubmit = (data: AddProductFormData) => {
    // Check if any images failed to load
    const hasFailedImages = Object.values(imageErrors).some(error => error === true);
    if (hasFailedImages) {
      toast({
        title: "Error",
        description: "Please remove or fix failed images before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Show a success message to indicate submission
    toast({
      title: "Submitting Product",
      description: "Your product is being submitted for review...",
      variant: "default",
    });
    
    addProductMutation.mutate(data);
  };

  if (!currentUser?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            You must be logged in to {isEditMode ? 'edit' : 'add'} products.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (currentUser.role !== 'supplier') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Only suppliers can {isEditMode ? 'edit' : 'add'} products. Please register as a supplier to {isEditMode ? 'edit' : 'add'} products.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state when fetching product data for editing
  if (isEditMode && productLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-3xl font-bold text-neutral-dark">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-neutral-medium mt-2">
            {isEditMode ? 'Update your product listing' : 'Create a new product listing for your catalog'}
          </p>
        </div>

        {/* URL Import Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Import from URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter product URL from Alibaba, Made-in-China, etc."
                  value={fetchUrl}
                  onChange={(e) => setFetchUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={fetchProductData}
                disabled={isLoading}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Fetch Data
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-neutral-medium mt-2">
              Automatically import product information from B2B platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="trade">Trade Terms</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your product..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input className="pl-10" placeholder="0.00" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="moq"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Order Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="piece">Piece</SelectItem>
                                <SelectItem value="kg">Kilogram</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                                <SelectItem value="set">Set</SelectItem>
                                <SelectItem value="meter">Meter</SelectItem>
                                <SelectItem value="liter">Liter</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Product Images</h3>
                      
                      <Alert className="mb-4">
                        <Image className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Image Requirements:</strong><br />
                          • Images must be square (1:1 aspect ratio)<br />
                          • Maximum resolution: 2000x2000 pixels<br />
                          • File size limit: 5MB per image<br />
                          • Supported formats: JPG, PNG, WEBP
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        {/* URL Input */}
                        <div className="flex gap-4">
                          <Input
                            placeholder="Enter image URL"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            onClick={addImageUrl} 
                            variant="outline"
                            disabled={!newImageUrl || imageLoading[imageUrls.length]}
                          >
                            {imageLoading[imageUrls.length] ? (
                              "Loading..."
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add from URL
                              </>
                            )}
                          </Button>
                        </div>

                        {/* File Upload */}
                        <div className="flex gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <Button type="button" variant="outline" disabled>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload from Device
                          </Button>
                        </div>

                        {/* Image Grid */}
                        {imageUrls.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Select Main Image</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                  <div 
                                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                                      selectedMainImage === index ? 'border-blue-500' : 'border-gray-200'
                                    }`}
                                    onClick={() => setSelectedMainImage(index)}
                                  >
                                    <img
                                      src={url}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full aspect-square object-cover"
                                      onError={() => {
                                        setImageErrors(prev => ({...prev, [index]: true}));
                                      }}
                                      onLoad={() => {
                                        setImageErrors(prev => ({...prev, [index]: false}));
                                      }}
                                    />
                                    {imageErrors[index] && (
                                      <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
                                        <div className="text-red-600 text-sm text-center">
                                          <X className="h-6 w-6 mx-auto mb-1" />
                                          Failed to load
                                        </div>
                                      </div>
                                    )}
                                    {selectedMainImage === index && (
                                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                                        Main
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImageUrl(index);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Video URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter video URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="specifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specifications</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter product specifications..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="materials"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materials</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter materials used..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Black, White, Red" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Large, Medium, Small" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1.5kg, 200g" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10x5x3 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="trade" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="leadTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Time</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 7-14 days" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="incoterms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incoterms</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., FOB, CIF, EXW" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="packagingDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Packaging Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe packaging..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., T/T, L/C, PayPal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origin Country</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., China, USA, Germany" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplyCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply Capacity</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 10,000 pieces/month" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/dashboard/supplier')}
                  >
                    Cancel
                  </Button>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveDraftMutation.mutate(form.getValues())}
                      disabled={saveDraftMutation.isPending}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      {saveDraftMutation.isPending ? (
                        <>
                          <CircleCheckBig className="mr-2 h-4 w-4 animate-spin" />
                          Saving Draft...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Save as Draft
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={addProductMutation.isPending}
                    className="bg-primary text-white hover:bg-blue-700"
                  >
                    {addProductMutation.isPending ? (
                      <>
                        <CircleCheckBig className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        {isEditMode ? 'Update Product' : 'Submit Product'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}