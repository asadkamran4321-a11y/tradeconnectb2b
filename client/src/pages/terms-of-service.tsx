import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            <CardTitle className="text-3xl text-center">Terms of Service</CardTitle>
            <p className="text-center text-neutral-600">TradeConnect B2B Marketplace</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p>By accessing and using TradeConnect, you accept and agree to be bound by the terms and provision of this agreement.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Registration and Account</h2>
                <p>To use our services, you must register for an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Business Verification</h2>
                <p>Suppliers must complete our verification process, including providing business registration documents, licenses, and other required documentation. All information must be accurate and up-to-date.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Product Listings</h2>
                <p>All product listings must be accurate, complete, and comply with applicable laws. Products requiring special licenses or certifications must include appropriate documentation.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Prohibited Activities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing false or misleading information</li>
                  <li>Uploading illegal or inappropriate content</li>
                  <li>Violating intellectual property rights</li>
                  <li>Engaging in fraudulent activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data and Privacy</h2>
                <p>We collect and process your data in accordance with our Privacy Policy. By using our services, you consent to such processing.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                <p>TradeConnect acts as a platform facilitating connections between buyers and suppliers. We are not responsible for the quality, safety, or legality of products or services listed.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
                <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
                <p>We may update these terms from time to time. Continued use of our services constitutes acceptance of the updated terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
                <p>For questions about these terms, please contact us at legal@tradeconnect.com</p>
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