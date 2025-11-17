import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [location] = useLocation();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    console.log('🔍 Reset password page loaded, extracting token...');
    console.log('📍 Current location:', location);
    
    // Multiple methods to extract token from URL
    let resetToken = '';
    
    // Method 1: URL parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    resetToken = urlParams.get('token') || '';
    console.log('🎫 Token from URL params:', resetToken);
    
    // Method 2: Hash parameters  
    if (!resetToken && location.includes('#')) {
      const hashParams = new URLSearchParams(location.split('#')[1] || '');
      resetToken = hashParams.get('token') || '';
      console.log('🎫 Token from hash:', resetToken);
    }
    
    // Method 3: Direct path extraction
    if (!resetToken) {
      const tokenMatch = location.match(/[?&#]token=([a-f0-9]{64})/i);
      if (tokenMatch) {
        resetToken = tokenMatch[1];
        console.log('🎫 Token from regex match:', resetToken);
      }
    }
    
    if (!resetToken) {
      console.error('❌ No token found in URL');
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    console.log('✅ Token extracted successfully:', resetToken.substring(0, 10) + '...');
    setToken(resetToken);
  }, [location]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      console.log('📡 Sending reset password request:', { 
        token: data.token.substring(0, 10) + '...', 
        passwordLength: data.newPassword.length 
      });
      
      const response = await apiRequest('/api/auth/reset-password', 'POST', data);
      console.log('📡 Reset password response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Password reset successful:', data);
      setMessage(data.message);
      setError('');
      setIsSuccess(true);
    },
    onError: (error) => {
      console.error('❌ Password reset failed:', error);
      setError(error.message);
      setMessage('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    console.log('🔄 Reset password form submitted');
    console.log('🎫 Token available:', token ? 'YES' : 'NO');
    console.log('🔑 Password length:', password.length);

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('✅ Form validation passed, submitting reset request');
    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  if (!token && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-neutral-medium">Loading reset form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <KeyRound className="h-8 w-8 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isSuccess ? 'Password Reset Successful' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? 'Your password has been updated successfully' 
                : 'Enter your new password below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">{message}</AlertDescription>
              </Alert>
            )}

            {isSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Password Updated</h4>
                  <p className="text-sm text-green-700">
                    You can now log in with your new password.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/login'}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    🔒 Password must be at least 6 characters long
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}