"use client";

import Link from "next/link";
import { Package, Upload, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProductEmptyState() {
  const steps = [
    {
      number: "1",
      title: "Add Your First Product",
      description: "Create a single product listing to get started",
      icon: Package,
    },
    {
      number: "2",
      title: "Use Bulk Upload",
      description: "Upload multiple products at once with our template",
      icon: Upload,
    },
    {
      number: "3",
      title: "Review Documentation",
      description: "Learn best practices for product listings",
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Welcome Message */}
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-full bg-blue-50">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome to Your Product Catalog
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You haven't added any products yet. Let's get you started on your
            journey to selling amazing STEM toys!
          </p>
        </div>

        {/* Getting Started Steps */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className="text-left hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Icon className="h-6 w-6 text-blue-600 mb-2" />
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/supplier/products/new">
              <Package className="w-5 h-5 mr-2" />
              Add Your First Product
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/supplier/products/bulk-upload">
              <Upload className="w-5 h-5 mr-2" />
              Bulk Upload Products
            </Link>
          </Button>
        </div>

        {/* Help Resources */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Need help getting started?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/supplier/products/help">
                <BookOpen className="w-4 h-4 mr-2" />
                View Documentation
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="#" onClick={e => e.preventDefault()}>
                <Video className="w-4 h-4 mr-2" />
                Watch Tutorial Video
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
