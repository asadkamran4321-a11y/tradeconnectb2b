import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Privacy Policy</CardTitle>
            <p className="text-center text-neutral-600">TradeConnect B2B Marketplace</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <div className="space-y-3">
                  <h3 className="font-medium">Personal Information:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name, email address, phone number</li>
                    <li>Company information and business details</li>
                    <li>Business registration documents</li>
                    <li>Product information and images</li>
                  </ul>
                  
                  <h3 className="font-medium">Usage Information:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Pages visited and features used</li>
                    <li>Search queries and preferences</li>
                    <li>Communication logs and inquiries</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify business credentials and maintain platform security</li>
                  <li>Facilitate connections between buyers and suppliers</li>
                  <li>Process and display product listings</li>
                  <li>Send important account and service notifications</li>
                  <li>Improve our services and user experience</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                <p>We do not sell your personal information. We may share information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>With other platform users as part of your public profile</li>
                  <li>With service providers who assist in platform operations</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In case of business transfer or merger</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <p>We implement appropriate security measures to protect your information, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encrypted data transmission and storage</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Employee training on data protection</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Download your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
                <p>We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
                <p>We retain your information for as long as necessary to provide our services, comply with legal obligations, and resolve disputes. Account data is typically retained for 7 years after account closure.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. International Transfers</h2>
                <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
                <p>Our services are not intended for children under 16. We do not knowingly collect personal information from children.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
                <p>For questions about this privacy policy or your data, contact us at:</p>
                <div className="ml-4">
                  <p>Email: privacy@tradeconnect.com</p>
                  <p>Address: TradeConnect Privacy Office</p>
                </div>
              </section>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> July 25, 2025<br/>
                  <strong>Effective Date:</strong> July 25, 2025
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}