"use client";

import Link from "next/link";
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Award, 
  Globe, 
  Clock, 
  FileText, 
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupplierRequirements() {
  const eligibilityCriteria = [
    {
      icon: Building2,
      title: "Established Business",
      description: "Minimum 1 year of business operations with proven track record",
      required: true
    },
    {
      icon: Shield,
      title: "Legal Compliance",
      description: "Valid business registration and tax compliance in Romania or EU",
      required: true
    },
    {
      icon: Award,
      title: "Quality Standards",
      description: "Products must meet EU safety standards and educational value",
      required: true
    },
    {
      icon: Users,
      title: "Customer Service",
      description: "Ability to provide excellent customer support and after-sales service",
      required: true
    },
    {
      icon: TrendingUp,
      title: "Growth Potential",
      description: "Demonstrated ability to scale and meet growing demand",
      required: false
    },
    {
      icon: Star,
      title: "Innovation Focus",
      description: "Commitment to developing innovative STEM educational products",
      required: false
    }
  ];

  const qualityStandards = [
    {
      category: "Safety Standards",
      requirements: [
        "CE Marking compliance",
        "EN 71 safety standard for toys",
        "RoHS compliance (Restriction of Hazardous Substances)",
        "REACH compliance (Registration, Evaluation, Authorization of Chemicals)",
        "Age-appropriate safety features"
      ]
    },
    {
      category: "Educational Value",
      requirements: [
        "Clear learning objectives",
        "Age-appropriate complexity",
        "STEM learning outcomes",
        "Educational documentation",
        "Teacher/parent guides"
      ]
    },
    {
      category: "Product Quality",
      requirements: [
        "Durable materials and construction",
        "Clear instructions and packaging",
        "Consistent quality across batches",
        "Warranty and support information",
        "Replacement parts availability"
      ]
    },
    {
      category: "Business Standards",
      requirements: [
        "Reliable shipping and delivery",
        "Professional customer service",
        "Clear return and refund policies",
        "Transparent pricing",
        "Regular product updates"
      ]
    }
  ];

  const applicationProcess = [
    {
      step: "01",
      title: "Submit Application",
      description: "Complete our comprehensive online application form with all required information",
      duration: "15-30 minutes"
    },
    {
      step: "02",
      title: "Initial Review",
      description: "Our team reviews your application and verifies business credentials",
      duration: "2-3 business days"
    },
    {
      step: "03",
      title: "Quality Assessment",
      description: "We evaluate your products and business practices against our standards",
      duration: "3-5 business days"
    },
    {
      step: "04",
      title: "Final Decision",
      description: "You receive our approval decision with next steps or feedback",
      duration: "1-2 business days"
    },
    {
      step: "05",
      title: "Onboarding",
      description: "If approved, we guide you through account setup and product listing",
      duration: "1-2 weeks"
    }
  ];

  const commissionStructure = [
    {
      tier: "Standard",
      rate: "15%",
      requirements: "All approved suppliers",
      features: ["Standard listing", "Basic analytics", "Email support"]
    },
    {
      tier: "Premium",
      rate: "12%",
      requirements: "€10k+ monthly sales",
      features: ["Featured listings", "Advanced analytics", "Priority support", "Marketing assistance"]
    },
    {
      tier: "Elite",
      rate: "10%",
      requirements: "€50k+ monthly sales",
      features: ["Premium placement", "Dedicated account manager", "Custom marketing campaigns", "Exclusive events"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Quality Standards
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Supplier <span className="text-blue-600">Requirements</span> & Guidelines
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Learn about our quality standards, eligibility criteria, and what it takes to become a trusted TechTots supplier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/supplier/apply">
                  Start Application
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/supplier/benefits">
                  View Benefits
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Criteria */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Eligibility Criteria
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To ensure the highest quality for our customers, we have established clear criteria for supplier partnerships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eligibilityCriteria.map((criterion, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <criterion.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl flex items-center justify-center gap-2">
                    {criterion.title}
                    {criterion.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {criterion.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Quality Standards
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We maintain high standards to ensure the best educational experience for children and families.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {qualityStandards.map((standard, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    {standard.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {standard.requirements.map((requirement, reqIndex) => (
                      <li key={reqIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Application Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process ensures a smooth experience from application to approval.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {applicationProcess.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-2">{step.description}</p>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.duration}
                </Badge>
                {index < applicationProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-blue-200 transform translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Commission Structure
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Competitive commission rates that reward success and growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commissionStructure.map((tier, index) => (
              <Card key={index} className={`border-0 shadow-lg ${index === 1 ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.tier}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600">{tier.rate}</div>
                  <CardDescription className="text-sm">
                    {tier.requirements}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Application Review</h4>
                    <p className="text-gray-600 text-sm">
                      All applications are reviewed within 5-7 business days. We may request additional information or product samples during the review process.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Quality Assurance</h4>
                    <p className="text-gray-600 text-sm">
                      Approved suppliers must maintain our quality standards. Regular audits and customer feedback help ensure continued compliance.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">EU Compliance</h4>
                    <p className="text-gray-600 text-sm">
                      All products must comply with EU regulations and safety standards. We provide guidance on compliance requirements.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Partnership Terms</h4>
                    <p className="text-gray-600 text-sm">
                      Supplier partnerships are reviewed annually. Performance metrics and customer satisfaction are key factors in continued partnership.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Apply?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            If you meet our requirements and are ready to join our network of trusted STEM toy suppliers, start your application today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/supplier/apply">
                Start Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
