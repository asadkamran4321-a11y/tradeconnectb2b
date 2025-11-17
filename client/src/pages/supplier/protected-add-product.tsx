import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AddProduct from "@/pages/products/add-product";
import VerificationPending from "./verification-pending";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ProtectedAddProduct() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: supplier, isLoading } = useQuery<any>({
    queryKey: ['/api/profile/supplier']
  });

  useEffect(() => {
    if (!user || user.role !== 'supplier') {
      setLocation('/login/supplier');
      return;
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if supplier has completed onboarding and is verified
  if (!supplier?.onboardingCompleted || !supplier?.verified) {
    return <VerificationPending />;
  }

  // If everything is good, show the add product page
  return <AddProduct />;
}