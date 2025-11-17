import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailRequired() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Check if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      // Redirect based on role to appropriate onboarding/dashboard
      if (user.role === 'supplier') {
        window.location.href = '/supplier/enhanced-onboarding';
      } else if (user.role === 'buyer') {
        window.location.href = '/buyer/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  }, [user]);

  const resendVerification = async () => {
    if (!user?.email) return;
    
    setStatus('sending');
    setError('');
    setMessage('');
    
    try {
      const response = await apiRequest('/api/auth/resend-verification', 'POST', {
        email: user.email
      });
      
      setStatus('sent');
      setMessage(response.message || 'Verification email sent successfully!');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to send verification email');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <p>Please log in to continue.</p>
            <Button onClick={() => window.location.href = '/login'} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Click the link in your email to verify your account and continue to your {user.role} dashboard.
              </p>
              
              {status === 'sent' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-3">Didn't receive the email?</p>
                <Button 
                  onClick={resendVerification}
                  disabled={status === 'sending'}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {status === 'sending' ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
            </div>
            
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-gray-600 mb-3">
                Need to use a different email?
              </p>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout and Register Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}