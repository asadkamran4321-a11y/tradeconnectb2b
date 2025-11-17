import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, X, CheckCircle, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EmailVerificationPromptProps {
  userEmail: string;
  onVerified?: () => void;
}

export default function EmailVerificationPrompt({ userEmail, onVerified }: EmailVerificationPromptProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/resend-verification', 'POST', { email: userEmail });
      return response;
    },
    onSuccess: (data) => {
      setMessage(data.message);
      setError('');
    },
    onError: (error) => {
      setError(error.message);
      setMessage('');
    },
  });

  const handleResend = () => {
    setError('');
    setMessage('');
    resendMutation.mutate();
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">{/* Removed close button */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription>
            Email verification is required to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error.includes('IP restrictions') ? (
                  <div>
                    <p className="font-semibold mb-2">Email Service Temporarily Unavailable</p>
                    <p className="text-sm">Due to server IP restrictions, email verification is currently not working. This is a temporary technical issue on our email provider's side.</p>
                    <p className="text-sm mt-2">You can continue using TradeConnect without email verification, or contact support for manual verification.</p>
                  </div>
                ) : error}
              </AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📧 Email Address</h4>
            <p className="text-sm text-blue-700 break-words">{userEmail}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              We've sent a verification email to your address. Click the link in the email to verify your account and get full access to TradeConnect.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>Didn't receive the email?</strong> Check your spam folder or click the button below to resend.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleResend}
            className="w-full" 
            disabled={resendMutation.isPending}
            variant="outline"
          >
            {resendMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Resend Verification Email
              </div>
            )}
          </Button>



          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Why verify?</strong> Email verification ensures account security and enables important notifications about your marketplace activities.
            </p>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Having trouble with verification?
            </p>
            <Button 
              variant="outline" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => {
                // Clear user data and redirect to login
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
            >
              Log Out and Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}