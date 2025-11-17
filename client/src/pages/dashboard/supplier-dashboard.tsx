import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Mail, Eye, Star, Plus, Upload, Edit, BarChart3, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authService, getAuthHeaders } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Product } from "@shared/schema";
import EmailVerificationPrompt from "@/components/email-verification-prompt";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

export default function SupplierDashboard() {
  const currentUser = authService.getCurrentUser();
  const [, setLocation] = useLocation();
  const [showEmailVerification, setShowEmailVerification] = useState(
    currentUser && !currentUser.emailVerified
  );

  // Block access to dashboard content if email is not verified
  const shouldBlockAccess = currentUser && !currentUser.emailVerified;

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/supplier'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/supplier', {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
    enabled: !!currentUser,
  });

  if (isLoading) {
    return (
      <SimpleNavigationLayout>
        <div className="min-h-screen bg-neutral-light p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SimpleNavigationLayout>
    );
  }

  const { stats, recentProducts } = dashboardData || {};

  return (
    <SimpleNavigationLayout>
      <div className="min-h-screen bg-neutral-light p-8">
        {showEmailVerification && currentUser && (
          <EmailVerificationPrompt 
            userEmail={currentUser.email}
            onVerified={() => {
              setShowEmailVerification(false);
              // Refresh user data
              window.location.reload();
            }}
          />
        )}
        <div className="max-w-7xl mx-auto">
          {!shouldBlockAccess && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-dark mb-2">Supplier Dashboard</h1>
                <p className="text-neutral-medium">Welcome back! Here's what's happening with your business.</p>
              </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.totalProducts || 0}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Active Inquiries</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.activeInquiries || 0}</p>
                </div>
                <Mail className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Profile Views</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.profileViews || 0}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Rating</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.rating || 0}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setLocation('/dashboard/supplier/products')}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
              <Button 
                onClick={() => setLocation('/products/add')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button 
                onClick={() => setLocation('/products/drafts')}
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Drafts & Deleted
              </Button>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button 
                onClick={() => setLocation('/supplier/profile')}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Manage Profile
              </Button>
              <Button 
                onClick={() => setLocation('/supplier/inquiries-dashboard')}
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Inquiry Dashboard
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Products</CardTitle>
              <Link href="/products?my=true">
                <Button variant="ghost" className="text-primary hover:text-blue-700">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts?.length > 0 ? (
                recentProducts.map((product: Product) => (
                  <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <img 
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&h=100&fit=crop"} 
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-dark">{product.name}</h4>
                      <p className="text-sm text-neutral-medium">Category: General</p>
                      <p className="text-sm text-success font-medium">
                        ${product.price || `${product.minPrice} - ${product.maxPrice}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-medium">Views: {product.views || 0}</p>
                      <p className="text-sm text-neutral-medium">Inquiries: {product.inquiries || 0}</p>
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-medium">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No products yet. Start by adding your first product!</p>
                  <Link href="/products/add">
                    <Button className="mt-4 bg-primary text-white hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
      </div>
    </SimpleNavigationLayout>
  );
}
