import EmailVerificationPrompt from "@/components/email-verification-prompt";
import { authService } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function EmailVerificationRequired() {
  const currentUser = authService.getCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user is already verified, redirect to appropriate dashboard
    if (currentUser?.emailVerified) {
      const redirectPath = currentUser.role === 'supplier' ? '/dashboard/supplier' : '/dashboard/buyer';
      setLocation(redirectPath);
    }
    
    // If no user is logged in, redirect to login
    if (!currentUser) {
      setLocation('/login');
    }
  }, [currentUser, setLocation]);

  if (!currentUser || currentUser.emailVerified) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center">
      <EmailVerificationPrompt 
        userEmail={currentUser.email}
        onVerified={() => {
          // Refresh user data and redirect to dashboard
          window.location.reload();
        }}
      />
    </div>
  );
}