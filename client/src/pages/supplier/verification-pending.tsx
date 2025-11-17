import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, FileText, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function VerificationPending() {
  const { user } = useAuth();
  
  const { data: supplier } = useQuery<any>({
    queryKey: ['/api/profile/supplier']
  });

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'active':
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'incomplete':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedSteps = supplier.onboardingCompleted ? 6 : (supplier.onboardingStep - 1);
  const progressPercentage = (completedSteps / 6) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Verification Status</h1>
          <p className="text-gray-600">Track your verification progress and status updates</p>
        </div>

        {/* Profile Completion Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Profile Completion
            </CardTitle>
            <CardDescription>Complete all required information to proceed with verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{completedSteps}/6 steps completed</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              {!supplier.onboardingCompleted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Action Required</span>
                  </div>
                  <p className="text-yellow-700 mt-1 text-sm">
                    Please complete your profile information to submit for verification.
                  </p>
                  <Link href="/supplier/enhanced-onboarding">
                    <Button variant="outline" size="sm" className="mt-3">
                      Complete Profile
                    </Button>
                  </Link>
                </div>
              )}

              {supplier.onboardingCompleted && !supplier.verified && supplier.status !== 'rejected' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Under Review</span>
                  </div>
                  <p className="text-blue-700 mt-1 text-sm">
                    Your profile is complete and under admin review. You'll be notified via email once verified.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href="/supplier/profile">
                      <Button variant="outline" size="sm">
                        Update Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {supplier.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Profile Rejected</span>
                  </div>
                  <p className="text-red-700 mt-1 text-sm">
                    Your profile has been rejected and needs to be updated. Please review the feedback and resubmit.
                  </p>
                  <Link href="/supplier/enhanced-onboarding">
                    <Button variant="outline" size="sm" className="mt-3">
                      Update Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(!supplier.onboardingCompleted ? 'incomplete' : 
                            supplier.status === 'rejected' ? 'rejected' :
                            supplier.status === 'active' || supplier.verified ? 'verified' : 'pending')}
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Status:</span>
                <Badge className={getStatusColor(!supplier.onboardingCompleted ? 'incomplete' :
                                                supplier.status === 'rejected' ? 'rejected' :
                                                supplier.status === 'active' || supplier.verified ? 'verified' : 'pending')}>
                  {!supplier.onboardingCompleted ? 'Profile Incomplete' :
                   supplier.status === 'rejected' ? 'Rejected' : 
                   supplier.status === 'active' || supplier.verified ? 'Verified' : 
                   'Pending Review'}
                </Badge>
              </div>

              {supplier.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Profile Rejected</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    {supplier.rejectionReason ? supplier.rejectionReason : 'Your profile needs to be updated before approval.'}
                  </p>
                  <Link href="/supplier/enhanced-onboarding">
                    <Button className="bg-red-600 hover:bg-red-700">
                      Resubmit Profile
                    </Button>
                  </Link>
                </div>
              )}

              {supplier.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Verification Issues</span>
                  </div>
                  <p className="text-red-700 text-sm">{supplier.rejectionReason}</p>
                  <Link href="/supplier/enhanced-onboarding">
                    <Button variant="outline" size="sm" className="mt-3">
                      Update Profile
                    </Button>
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className={`text-center p-4 rounded-lg ${supplier.onboardingCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <FileText className={`h-8 w-8 mx-auto mb-2 ${supplier.onboardingCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                  <h3 className="font-medium text-gray-900">Profile Submitted</h3>
                  <p className="text-sm text-gray-600">
                    {supplier.onboardingCompleted ? 'Complete information provided' : 'Information incomplete'}
                  </p>
                </div>
                
                <div className={`text-center p-4 rounded-lg ${
                  supplier.onboardingCompleted && !supplier.verified && supplier.status !== 'rejected' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <Eye className={`h-8 w-8 mx-auto mb-2 ${
                    supplier.onboardingCompleted && !supplier.verified && supplier.status !== 'rejected' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <h3 className="font-medium text-gray-900">Under Review</h3>
                  <p className="text-sm text-gray-600">
                    {supplier.onboardingCompleted && !supplier.verified && supplier.status !== 'rejected' 
                      ? 'Admin verification in progress' 
                      : 'Waiting for profile submission'}
                  </p>
                </div>
                
                <div className={`text-center p-4 rounded-lg ${
                  supplier.status === 'active' || supplier.verified ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                    supplier.status === 'active' || supplier.verified ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <h3 className="font-medium text-gray-900">Verified</h3>
                  <p className="text-sm text-gray-600">
                    {supplier.status === 'active' || supplier.verified ? 'Ready to list products' : 'Pending verification'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Management Actions - Available after profile completion */}
        {supplier.onboardingCompleted && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profile Management
              </CardTitle>
              <CardDescription>
                {supplier.verified 
                  ? "Your profile is verified. You can still update your information at any time."
                  : "Your profile is complete but you can update it while under review."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/supplier/profile">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                {supplier.verified && (
                  <Link href="/supplier/dashboard">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                If you have questions about the verification process or need assistance, please contact our support team.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Link href="/help/verification">
                  <Button variant="ghost" size="sm">
                    Verification Guide
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}