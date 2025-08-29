"use client";

import Link from "next/link";
import { 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Shield, 
  Clock, 
  Award, 
  Globe, 
  Zap,
  Star,
  ArrowRight,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupplierBenefits() {
  const mainBenefits = [
    {
      icon: Users,
      title: "Growing Customer Base",
      description: "Access thousands of families and educators actively seeking quality STEM toys",
      stats: "50K+ customers",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: TrendingUp,
      title: "Revenue Growth",
      description: "Increase your sales with our proven platform and marketing support",
      stats: "300% average growth",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Shield,
      title: "Professional Platform",
      description: "Benefit from our established e-commerce infrastructure and security",
      stats: "99.9% uptime",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: Clock,
      title: "Quick Onboarding",
      description: "Get started quickly with our streamlined setup and training process",
      stats: "1-2 weeks setup",
      color: "from-orange-500 to-amber-600"
    }
  ];

  const platformFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive sales reports, customer insights, and performance metrics"
    },
    {
      icon: MessageSquare,
      title: "Dedicated Support",
      description: "Personalized support from our team to help you succeed"
    },
    {
      icon: Settings,
      title: "Easy Management",
      description: "User-friendly dashboard for managing products, orders, and inventory"
    },
    {
      icon: Target,
      title: "Marketing Support",
      description: "Promotional campaigns and marketing assistance to boost sales"
    }
  ];

  const successMetrics = [
    {
      metric: "500+",
      label: "Active Suppliers",
      description: "Growing network of trusted partners"
    },
    {
      metric: "50K+",
      label: "Happy Customers",
      description: "Loyal customer base across Romania"
    },
    {
      metric: "10K+",
      label: "Products Listed",
      description: "Diverse catalog of STEM toys"
    },
    {
      metric: "98%",
      label: "Satisfaction Rate",
      description: "High customer satisfaction scores"
    }
  ];

  const supportFeatures = [
    {
      title: "24/7 Platform Access",
      description: "Manage your business anytime, anywhere with our always-available platform"
    },
    {
      title: "Training & Resources",
      description: "Comprehensive training materials and best practices guides"
    },
    {
      title: "Technical Support",
      description: "Expert technical support for platform and integration issues"
    },
    {
      title: "Business Consulting",
      description: "Strategic advice to help optimize your performance and growth"
    }
  ];

  const testimonials = [
    {
      name: "Maria Popescu",
      company: "EduTech Solutions",
      content: "TechTots has transformed our business. We've seen a 300% increase in sales since joining their platform.",
      rating: 5,
      growth: "+300%"
    },
    {
      name: "Alexandru Ionescu",
      company: "Science Toys Pro",
      content: "The platform is incredibly user-friendly and the support team is always helpful. Highly recommended!",
      rating: 5,
      growth: "+250%"
    },
    {
      name: "Elena Dumitrescu",
      company: "Learning Innovations",
      content: "TechTots helped us reach customers we never could have reached on our own. Excellent partnership!",
      rating: 5,
      growth: "+400%"
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
              <Star className="w-4 h-4 mr-2" />
              Partnership Benefits
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-blue-600">TechTots</span>?
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join our network of successful suppliers and benefit from our professional platform, 
              growing customer base, and comprehensive support system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/supplier/apply">
                  Start Application
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/supplier/requirements">
                  View Requirements
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Key Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover why leading STEM toy suppliers choose TechTots as their preferred platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mainBenefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {benefit.stats}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Platform Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join a thriving marketplace with proven results and growing success.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {successMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">
                  {metric.metric}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to succeed in one comprehensive platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're here to help you succeed every step of the way.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our successful suppliers about their experience with TechTots.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {testimonial.growth} Growth
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Potential */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Revenue Potential
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Our suppliers see significant revenue growth through our platform.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <DollarSign className="w-12 h-12 text-white mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">€50K+</div>
              <div className="text-blue-100">Average Monthly Revenue</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <TrendingUp className="w-12 h-12 text-white mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">300%</div>
              <div className="text-blue-100">Average Growth Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="w-12 h-12 text-white mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-100">New Customers Monthly</div>
            </div>
          </div>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/supplier/apply">
              Start Earning Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful suppliers who have transformed their business with TechTots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/supplier/apply">
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
