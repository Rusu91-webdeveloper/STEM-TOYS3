"use client";

import Link from "next/link";
import { 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  ArrowRight,
  FileText,
  Users,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupplierRegistrationSuccess() {
  const nextSteps = [
    {
      step: "01",
      title: "Application Review",
      description: "Our team reviews your application and verifies business credentials",
      duration: "2-3 business days",
      icon: FileText
    },
    {
      step: "02",
      title: "Quality Assessment",
      description: "We evaluate your products and business practices against our standards",
      duration: "3-5 business days",
      icon: Users
    },
    {
      step: "03",
      title: "Final Decision",
      description: "You receive our approval decision with next steps or feedback",
      duration: "1-2 business days",
      icon: CheckCircle
    },
    {
      step: "04",
      title: "Onboarding",
      description: "If approved, we guide you through account setup and product listing",
      duration: "1-2 weeks",
      icon: TrendingUp
    }
  ];

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      description: "supplier@techtots.ro",
      action: "Send us an email"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+40 XXX XXX XXX",
      action: "Call us directly"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your interest in becoming a TechTots supplier. 
            We've received your application and will review it carefully.
          </p>
          <Badge variant="secondary" className="mt-4">
            <Clock className="w-4 h-4 mr-2" />
            Review Time: 5-7 business days
          </Badge>
        </div>

        {/* Next Steps */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              What Happens Next?
            </CardTitle>
            <CardDescription className="text-lg">
              Here's our review process and what you can expect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Step {step.step}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {step.duration}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Email Confirmation */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Important:</strong> Please check your email (including spam folder) for our confirmation message. 
                    We'll use this email address to communicate with you about your application.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">What you'll receive:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Application confirmation email</li>
                    <li>• Application reference number</li>
                    <li>• Next steps and timeline</li>
                    <li>• Contact information for questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Have questions about your application? We're here to help!
                </p>
                <div className="space-y-3">
                  {contactInfo.map((contact, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <contact.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{contact.title}</h4>
                        <p className="text-sm text-gray-600">{contact.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Details */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Application Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Application Date</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  SUP-{Date.now().toString().slice(-6)}
                </div>
                <div className="text-sm text-gray-600">Reference Number</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  Pending
                </div>
                <div className="text-sm text-gray-600">Current Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/supplier">
                Back to Supplier Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">While You Wait</h3>
            <p className="text-gray-600 text-sm mb-4">
              Take some time to explore our platform and learn more about what makes TechTots special.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/supplier/benefits">
                  View Benefits
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/supplier/requirements">
                  Review Requirements
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/about">
                  About TechTots
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
