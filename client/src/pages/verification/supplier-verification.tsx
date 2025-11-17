import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertCircle, FileText, Award, Globe } from "lucide-react";

export default function SupplierVerification() {
  const [, navigate] = useLocation();
  
  const verificationSteps = [
    {
      id: 1,
      title: "Company Information",
      status: "completed",
      description: "Legal company registration and basic details verified",
      icon: FileText,
    },
    {
      id: 2,
      title: "Business License",
      status: "completed",
      description: "Business license and registration documents validated",
      icon: Award,
    },
    {
      id: 3,
      title: "Contact Verification",
      status: "in-progress",
      description: "Phone and email verification in progress",
      icon: Globe,
    },
    {
      id: 4,
      title: "Quality Assessment",
      status: "pending",
      description: "Product quality and manufacturing capabilities review",
      icon: CheckCircle,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Verification</h1>
          <p className="text-gray-600">Your supplier profile is being verified by our team</p>
        </div>

        {/* Status Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900">50% Complete</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="text-lg font-semibold text-gray-900">2-3 Business Days</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Steps</h2>
          <div className="space-y-4">
            {verificationSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <Card key={step.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{step.title}</h3>
                          {getStatusBadge(step.status)}
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Contact Verification</h4>
                  <p className="text-sm text-gray-600">
                    We'll call your registered phone number to verify your contact information.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quality Assessment</h4>
                  <p className="text-sm text-gray-600">
                    Our team will review your product samples and manufacturing capabilities.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Profile Activation</h4>
                  <p className="text-sm text-gray-600">
                    Once verified, your supplier profile will be activated and visible to buyers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about the verification process?
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/contact')}
            className="mr-4"
          >
            Contact Support
          </Button>
          <Button 
            onClick={() => navigate('/dashboard/supplier')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}