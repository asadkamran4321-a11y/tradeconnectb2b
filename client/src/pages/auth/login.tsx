import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, Building2, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <Handshake className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">TradeConnect</h2>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Choose Login Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/login/supplier" className="block">
                <Button 
                  variant="outline" 
                  className="w-full h-16 flex items-center justify-start space-x-4 text-left hover:bg-blue-50 border-2 hover:border-blue-500"
                >
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Supplier Login</p>
                    <p className="text-sm text-gray-500">Access your supplier dashboard</p>
                  </div>
                </Button>
              </Link>
              
              <Link href="/login/buyer" className="block">
                <Button 
                  variant="outline" 
                  className="w-full h-16 flex items-center justify-start space-x-4 text-left hover:bg-green-50 border-2 hover:border-green-500"
                >
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Buyer Login</p>
                    <p className="text-sm text-gray-500">Find suppliers and products</p>
                  </div>
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
