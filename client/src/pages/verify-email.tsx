import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const [location] = useLocation();
  const [, params] = useRoute("/verify-email");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Multiple methods to extract token for better compatibility
    let token = null;
    
    // Method 1: From current location
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    token = urlParams.get('token');
    
    // Method 2: From window.location (for deployment compatibility)
    if (!token && typeof window !== 'undefined') {
      const windowParams = new URLSearchParams(window.location.search);
      token = windowParams.get('token');
    }
    
    // Method 3: From hash for single-page app compatibility
    if (!token && typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      token = hashParams.get('token');
    }

    console.log('📍 Current location:', location);
    console.log('🔗 Window search:', typeof window !== 'undefined' ? window.location.search : 'N/A');
    console.log('🎯 Extracted token:', token);
    console.log('🎯 Token length:', token ? token.length : 0);

    if (!token) {
      console.error('❌ No token found in any location method');
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify the email token
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(response => response.json())
      .then(data => {
        console.log('📥 Verification response:', data);
        if (data.verified) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
          // Log debug info if available
          if (data.debug) {
            console.error('🐛 Debug info:', data.debug);
          }
        }
      })
      .catch((error) => {
        console.error('❌ Verification error:', error);
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      });
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              )}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
              {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your email address'}
              {status === 'success' && 'Your account has been successfully verified and approved'}
              {status === 'error' && 'There was an issue verifying your email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' :
              status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                status === 'success' ? 'text-green-700' :
                status === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {message}
              </p>
            </div>

            {status === 'success' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">✅ What's Next:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your account is now approved and active</li>
                    <li>• You can log in and access all features</li>
                    <li>• Start connecting with global suppliers and buyers</li>
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/login'}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">🔧 Troubleshooting</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Check if the link was copied completely</li>
                    <li>• Try opening the link in a new browser tab</li>
                    <li>• Request a new verification email if needed</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => window.location.href = '/resend-verification'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => window.location.href = '/'}
                >
                  Back to Home
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-neutral-medium">
                  This may take a few moments...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}