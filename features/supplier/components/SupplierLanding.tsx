"use client";

import { ArrowRight, CheckCircle, Building2, Users, TrendingUp, Shield, Clock, Award, Globe, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupplierLanding() {
  const benefits = [
    {
      icon: Building2,
      title: "Professional Platform",
      description: "Access our established e-commerce platform with thousands of customers looking for quality STEM toys."
    },
    {
      icon: Users,
      title: "Dedicated Support",
      description: "Get personalized support from our team to help you succeed and grow your business."
    },
    {
      icon: TrendingUp,
      title: "Growth Opportunities",
      description: "Expand your reach and increase sales through our marketing and promotional campaigns."
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Benefit from our secure payment processing and reliable financial management system."
    },
    {
      icon: Clock,
      title: "Quick Onboarding",
      description: "Get started quickly with our streamlined registration and approval process."
    },
    {
      icon: Award,
      title: "Quality Standards",
      description: "Join a curated marketplace that maintains high quality standards for STEM education."
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Apply Online",
      description: "Complete our simple online application form with your company details."
    },
    {
      step: "02", 
      title: "Review Process",
      description: "Our team reviews your application and verifies your business credentials."
    },
    {
      step: "03",
      title: "Approval & Setup",
      description: "Once approved, we'll help you set up your supplier account and start listing products."
    },
    {
      step: "04",
      title: "Start Selling",
      description: "Begin selling your STEM toys to our community of educators and families."
    }
  ];

  const testimonials = [
    {
      name: "Maria Popescu",
      company: "EduTech Solutions",
      content: "TechTots has helped us reach thousands of families across Romania. The platform is professional and the support team is excellent.",
      rating: 5
    },
    {
      name: "Alexandru Ionescu", 
      company: "Science Toys Pro",
      content: "Since joining TechTots, our sales have increased by 300%. The platform is easy to use and the customer base is exactly what we were looking for.",
      rating: 5
    },
    {
      name: "Elena Dumitrescu",
      company: "Learning Innovations",
      content: "The quality standards and professional approach of TechTots align perfectly with our company values. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section - Compact on Mobile */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-3 sm:mb-4 md:mb-6 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Join Our Supplier Network
            </Badge>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
              Become a <span className="text-blue-600">TechTots</span> Supplier
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto leading-snug sm:leading-normal">
              Partner with Romania's leading STEM toy marketplace. Reach thousands of families 
              and educators looking for quality educational products.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
              <Button size="lg" asChild className="text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6">
                <Link href="/supplier/apply">
                  Start Your Application
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6">
                <Link href="/supplier/benefits">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Compact on Mobile */}
      <section className="py-6 sm:py-10 md:py-16 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Active Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">50K+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">10K+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Products Listed</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">98%</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links - Compact on Mobile */}
      <section className="py-6 sm:py-10 md:py-16 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Get Started
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about becoming a TechTots supplier
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
            <Link href="/supplier/benefits">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Benefits</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Discover the advantages of partnering with TechTots</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/supplier/requirements">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Requirements</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Learn about our quality standards and eligibility criteria</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/supplier/apply">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Apply Now</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600">Start your application to become a TechTots supplier</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section - Compact on Mobile */}
      <section id="benefits" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Why Choose TechTots?
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              Join our network of trusted suppliers and benefit from our professional 
              platform, dedicated support, and growing customer base.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center p-3 sm:p-4 md:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm md:text-base text-gray-600">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Compact on Mobile */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started as a TechTots supplier is simple and straightforward. 
              Follow these four easy steps to begin your partnership.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
                  <span className="text-white font-bold text-base sm:text-lg md:text-xl">{step.step}</span>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2 md:mb-3">{step.title}</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">{step.description}</p>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-blue-200 transform translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Compact on Mobile */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              What Our Suppliers Say
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from successful suppliers who have grown their business with TechTots.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex mb-2 sm:mb-3 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <CheckCircle key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3 md:mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900">{testimonial.name}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact on Mobile with Visible Buttons */}
      <section className="py-6 sm:py-10 md:py-16 lg:py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <div className="container mx-auto px-3 sm:px-4 text-center relative z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
            Ready to Join TechTots?
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-emerald-100 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
            Start your application today and become part of Romania's premier STEM toy marketplace. 
            Our team is ready to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-2 border-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              asChild
            >
              <Link href="/supplier/apply">
                Apply Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-emerald-700 border-2 border-white hover:bg-white hover:text-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              asChild
            >
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
