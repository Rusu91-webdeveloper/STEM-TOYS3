"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, X } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";

export default function NewCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
  });

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCategoryData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-");
      setCategoryData((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setCategoryData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  // Handle image upload
  const handleImageChange = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setCategoryData({ ...categoryData, image: imageUrls[0] });
    } else {
      setCategoryData({ ...categoryData, image: "" });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call the API to create the category
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Failed to create category"
        );
      }

      const createdCategory = await response.json();
      console.log("Category created:", createdCategory);

      // Success - redirect to categories management page
      router.push("/admin/categories");
    } catch (error) {
      console.error("Error creating category:", error);
      alert(
        `Failed to create category: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="mr-4"
          asChild>
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Category</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Enter the details for your new category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={categoryData.name}
                    onChange={handleChange}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={categoryData.slug}
                    onChange={handleChange}
                    placeholder="url-friendly-slug"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used in the URL: categories/
                    {categoryData.slug || "example-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={categoryData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the category"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={categoryData.isActive}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="isActive">
                    {categoryData.isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Image</CardTitle>
                <CardDescription>
                  Upload an image for this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  maxImages={1}
                  onImagesUploaded={handleImageChange}
                  initialImages={categoryData.image ? [categoryData.image] : []}
                  endpoint="categoryImage"
                />
              </CardContent>
            </Card>

            <Card>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/admin/categories")}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Category"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
