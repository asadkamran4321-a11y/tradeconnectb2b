import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, Store, ShoppingCart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { Link } from "wouter";

export default function Register() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('supplier');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/auth/register', 'POST', data);
      return response;
    },
    onSuccess: (data) => {
      // Show different messages based on email status
      if (data.emailStatus === 'sent') {
        setSuccess(data.message);
        setError('');
      } else if (data.emailStatus === 'failed') {
        setSuccess('Registration successful! You can now login to your account.');
        if (data.emailError && data.emailError.includes('IP restrictions')) {
          setError('Note: Email verification is temporarily unavailable due to server restrictions. You can request verification from your dashboard.');
        } else {
          setError(`Note: We couldn't send the verification email: ${data.emailError || 'Unknown error'}. You can resend it from your dashboard.`);
        }
      }
      
      // Set the authenticated user and redirect to email verification page
      authService.setCurrentUser(data.user);
      setLocation('/verify-email-required');
    },
    onError: (error) => {
      // Handle case where user already exists and is verified
      if (error.message.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(error.message);
      }
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      role: activeTab,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center">
            <Handshake className="text-primary text-3xl mr-2" />
            <span className="text-2xl font-bold text-neutral-dark">TradeConnect</span>
          </div>
          <CardTitle className="text-center text-xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="supplier" className="flex items-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Supplier</span>
              </TabsTrigger>
              <TabsTrigger value="buyer" className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Buyer</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="supplier" className="space-y-4">
              <div className="text-center text-sm text-neutral-medium mb-4">
                Join as a supplier to list your products and connect with buyers
              </div>
            </TabsContent>
            
            <TabsContent value="buyer" className="space-y-4">
              <div className="text-center text-sm text-neutral-medium mb-4">
                Join as a buyer to discover products and connect with suppliers
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {success && (
              <Alert variant="default" className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-blue-700"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-neutral-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
