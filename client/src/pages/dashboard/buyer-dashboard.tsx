import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Users, CheckCircle, Search, List, Edit, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authService, getAuthHeaders } from "@/lib/auth";
import { Link } from "wouter";
import ProductCard from "@/components/common/product-card";
import { Product } from "@shared/schema";
import EmailVerificationPrompt from "@/components/email-verification-prompt";
import { SimpleNavigationLayout } from "@/components/layout/simple-navigation-sidebar";

export default function BuyerDashboard() {
  const currentUser = authService.getCurrentUser();
  const [showEmailVerification, setShowEmailVerification] = useState(
    currentUser && !currentUser.emailVerified
  );

  // Block access to dashboard content if email is not verified
  const shouldBlockAccess = currentUser && !currentUser.emailVerified;

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/buyer'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/buyer', {
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

  const { stats, recommendedProducts } = dashboardData || {};

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
              <h1 className="text-3xl font-bold text-neutral-dark mb-2">Buyer Dashboard</h1>
              <p className="text-neutral-medium">Welcome back! Discover new products and manage your business relationships.</p>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Saved Products</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.savedProducts || 0}</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
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
                  <p className="text-neutral-medium text-sm">Following Suppliers</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.followingSuppliers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-medium text-sm">Successful Orders</p>
                  <p className="text-2xl font-bold text-neutral-dark">{stats?.successfulOrders || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
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
              <Link href="/suppliers">
                <Button className="bg-primary text-white hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Find Suppliers
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <List className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Link href="/buyer/saved-products">
                <Button variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Saved Products
                </Button>
              </Link>
              <Link href="/buyer/followed-suppliers">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Followed Suppliers
                </Button>
              </Link>
              <Link href="/buyer/inquiries">
                <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  My Inquiries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Products */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recommended for You</CardTitle>
              <Link href="/products">
                <Button variant="ghost" className="text-primary hover:text-blue-700">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recommendedProducts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-medium">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No recommendations yet. Start browsing products to get personalized suggestions!</p>
                <Link href="/products">
                  <Button className="mt-4 bg-primary text-white hover:bg-blue-700">
                    <List className="w-4 h-4 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
      </div>
    </SimpleNavigationLayout>
  );
}
