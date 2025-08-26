import { Metadata } from "next";
import { CheckCircle, Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Registration Submitted | TechTots Supplier Portal",
  description: "Your supplier application has been submitted successfully. We'll review it and contact you soon.",
  robots: "noindex, nofollow",
};

export default function SupplierRegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600">
            Thank you for your interest in becoming a TechTots supplier. 
            We've received your application and will review it carefully.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              What Happens Next?
            </CardTitle>
            <CardDescription>
              Here's what you can expect during our review process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Application Review</h3>
                <p className="text-gray-600 text-sm">
                  Our team will review your application and verify your business credentials within 2-3 business days.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contact & Interview</h3>
                <p className="text-gray-600 text-sm">
                  We'll contact you to discuss your products, business model, and answer any questions you may have.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Approval & Onboarding</h3>
                <p className="text-gray-600 text-sm">
                  Once approved, we'll help you set up your supplier account and guide you through the onboarding process.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-semibold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Start Selling</h3>
                <p className="text-gray-600 text-sm">
                  Begin listing your products and reaching thousands of families looking for quality STEM toys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Stay Connected
            </CardTitle>
            <CardDescription>
              We'll keep you updated throughout the process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> Please check your email (including spam folder) for our confirmation message. 
                We'll use this email address to communicate with you about your application.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Email Updates</h3>
                <p className="text-gray-600 text-sm">
                  Receive status updates and important information via email
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Phone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                <p className="text-gray-600 text-sm">
                  Call us if you have questions about your application
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/supplier">
                Back to Supplier Portal
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Application Reference: <span className="font-mono bg-gray-100 px-2 py-1 rounded">SUP-{Date.now().toString().slice(-6)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
