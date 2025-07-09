import {
  Edit,
  ArrowLeft,
  Trash2,
  // Calendar,
  // Tag,
  // ShoppingCart,
  Search,
  // Layers,
  Check,
  X,
} from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Product Details | Admin Dashboard",
  description: "View detailed product information.",
};

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Server-side price formatting function
const formatPrice = (price: number) => `${price.toFixed(2)} lei`;

async function getProduct(id: string) {
  try {
    // In development with mock data, return a mock product
    if (
      process.env.NODE_ENV === "development" &&
      process.env.USE_MOCK_DATA === "true"
    ) {
      return {
        id,
        name: "Robotic Building Kit",
        slug: "robotic-building-kit",
        description:
          "An educational robotic kit that teaches children coding and engineering principles. Great for ages 8-14, this kit includes all components needed to build various robot configurations.",
        price: 59.99,
        compareAtPrice: 79.99,
        images: [
          "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Robot+Kit+1",
          "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Robot+Kit+2",
          "https://placehold.co/800x600/4F46E5/FFFFFF.png?text=Robot+Kit+3",
        ],
        categoryId: "cat_1",
        category: { name: "Technology" },
        tags: ["robotics", "coding", "engineering", "electronics"],
        isActive: true,
        attributes: {
          metaTitle: "Robotic Building Kit | STEM Toys",
          metaDescription:
            "Educational robotic kit that teaches children coding and engineering principles. Perfect for beginners and intermediate learners aged 8-14.",
          metaKeywords: ["robotics", "coding", "STEM toys", "educational toys"],
          ageRange: "8-14",
          stemCategory: "technology",
          difficultyLevel: "intermediate",
          learningObjectives: [
            "Learn basic programming concepts",
            "Understand engineering principles",
            "Develop problem-solving skills",
            "Build creative thinking",
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // In production, fetch from database
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return null;
    }

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Extract attributes
  const attributes = (product.attributes as Record<string, any>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">Product ID: {product.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link href={`/products/${product.slug}`}>
              <Search className="mr-2 h-4 w-4" />
              View on Site
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" className="h-9">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Name</div>
                      <div>{product.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Slug</div>
                      <div>{product.slug}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Price</div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-700">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="ml-2 text-lg text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Category</div>
                      <div>{product.category?.name || "Uncategorized"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Status</div>
                      <div className="flex items-center">
                        {product.isActive ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 bg-green-100 text-green-800"
                          >
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Created At</div>
                      <div>
                        {new Date(product.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>{product.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.tags && product.tags.length > 0 ? (
                      product.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No tags assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                  <CardDescription>
                    Search engine optimization data for this product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Meta Title</div>
                    <div>{attributes.metaTitle || product.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">
                      Meta Description
                    </div>
                    <div className="text-sm">
                      {attributes.metaDescription ||
                        product.description?.substring(0, 160)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">
                      Meta Keywords
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attributes.metaKeywords &&
                      attributes.metaKeywords.length > 0 ? (
                        attributes.metaKeywords.map((keyword: string) => (
                          <Badge key={keyword} variant="outline">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">
                          No keywords defined
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-md p-4 bg-muted/50 mt-4">
                    <h3 className="font-medium mb-2">Search Result Preview</h3>
                    <div className="space-y-1.5">
                      <div className="text-blue-600 text-lg font-medium">
                        {attributes.metaTitle || product.name}
                      </div>
                      <div className="text-green-700 text-sm">
                        yourwebsite.com/products/{product.slug}
                      </div>
                      <div className="text-sm text-gray-700">
                        {attributes.metaDescription ||
                          product.description?.substring(0, 160)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>STEM Attributes</CardTitle>
                  <CardDescription>
                    Educational information about this product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Age Range</div>
                      <div>{attributes.ageRange || "Not specified"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        STEM Category
                      </div>
                      <div className="capitalize">
                        {attributes.stemCategory || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">
                        Difficulty Level
                      </div>
                      <div className="capitalize">
                        {attributes.difficultyLevel || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">
                      Learning Objectives
                    </div>
                    {attributes.learningObjectives &&
                    attributes.learningObjectives.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {attributes.learningObjectives.map(
                          (objective: string) => (
                            <li key={objective}>{objective}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No learning objectives defined
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Images & stats */}
        <div className="space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.images && product.images.length > 0 ? (
                  <div className="grid gap-4">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-md overflow-hidden border"
                      >
                        <Image
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs py-1 text-center">
                            Main Image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground">
                    No images available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/products/${product.slug}`}>
                  <Search className="mr-2 h-4 w-4" />
                  View on Site
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
