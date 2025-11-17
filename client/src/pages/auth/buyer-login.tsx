import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function BuyerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();
      
      if (result.user.role !== 'buyer') {
        setError("This login is only for buyers. Please use the correct login page for your account type.");
        setLoading(false);
        return;
      }

      if (!result.user.approved) {
        setError("Your buyer account is pending admin approval. Please wait for approval before logging in.");
        setLoading(false);
        return;
      }

      // Set the authenticated user
      authService.setCurrentUser(result.user);
      
      // Invalidate auth query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      toast({
        title: "Login successful",
        description: "Welcome to TradeConnect!",
      });
      
      // Small delay to ensure auth state propagates before redirect
      setTimeout(() => {
        setLocation("/dashboard/buyer");
      }, 200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">TradeConnect</h2>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Buyer Login</CardTitle>
            <CardDescription className="text-center">
              Access your buyer dashboard and find suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-red-600 hover:underline text-sm">
                Forgot password?
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have a buyer account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-gray-600 hover:text-primary inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to general login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}