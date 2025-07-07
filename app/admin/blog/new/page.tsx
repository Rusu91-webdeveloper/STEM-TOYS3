"use client";

import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Define the Category type
type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
};

export default function NewBlogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blogData, setBlogData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    categoryId: "",
    stemCategory: "GENERAL",
    tags: "",
    isPublished: false,
    language: "en",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setBlogData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-");
      setBlogData((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setBlogData((prev) => ({
      ...prev,
      isPublished: checked,
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setBlogData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add handler for cover image upload
  const handleCoverImageChange = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setBlogData({ ...blogData, coverImage: imageUrls[0] });
    } else {
      setBlogData({ ...blogData, coverImage: "" });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate category is selected
    if (!blogData.categoryId) {
      alert(
        "Please select a category. If no categories are available, you need to create a category first."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the API to create the blog post
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Failed to create blog post"
        );
      }

      const createdBlog = await response.json();
      console.log("Blog post created:", createdBlog);

      // Success - redirect to blog management page
      router.push("/admin/blog");
    } catch (error) {
      console.error("Error creating blog post:", error);
      alert(
        `Failed to create blog post: ${error instanceof Error ? error.message : "Unknown error"}`
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
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
                <CardDescription>
                  Write your blog post content here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={blogData.title}
                    onChange={handleChange}
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={blogData.slug}
                    onChange={handleChange}
                    placeholder="url-friendly-slug"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used in the URL: blog/post/
                    {blogData.slug || "example-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={blogData.excerpt}
                    onChange={handleChange}
                    placeholder="Brief summary of the blog post"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={blogData.content}
                    onChange={handleChange}
                    placeholder="Write your blog post content here..."
                    rows={15}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
                <CardDescription>
                  Configure publishing settings for your blog post.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublished"
                    checked={blogData.isPublished}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="isPublished">
                    {blogData.isPublished ? "Published" : "Draft"}
                  </Label>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="stemCategory">STEM Category</Label>
                  <Select
                    value={blogData.stemCategory}
                    onValueChange={(value) =>
                      handleSelectChange("stemCategory", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select STEM category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCIENCE">Science (S)</SelectItem>
                      <SelectItem value="TECHNOLOGY">Technology (T)</SelectItem>
                      <SelectItem value="ENGINEERING">
                        Engineering (E)
                      </SelectItem>
                      <SelectItem value="MATHEMATICS">
                        Mathematics (M)
                      </SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={blogData.language}
                    onValueChange={(value) =>
                      handleSelectChange("language", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English 🇬🇧</SelectItem>
                      <SelectItem value="ro">Romanian 🇷🇴</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Content Category</Label>
                  <Select
                    value={blogData.categoryId}
                    onValueChange={(value) =>
                      handleSelectChange("categoryId", value)
                    }
                    disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoading
                            ? "Loading categories..."
                            : "Select content category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem
                          value="loading"
                          disabled>
                          Loading categories...
                        </SelectItem>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="no-categories"
                          disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && !isLoading && (
                    <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="font-medium">
                        Warning: No categories available
                      </p>
                      <p>
                        You need to create a category first before creating a
                        blog post.
                      </p>
                      <Link
                        href="/admin/categories/new"
                        className="text-primary hover:underline mt-1 inline-block">
                        Create a category
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={blogData.tags}
                    onChange={handleChange}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>
                  Upload a cover image for your blog post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  maxImages={1}
                  onImagesUploaded={handleCoverImageChange}
                  initialImages={
                    blogData.coverImage ? [blogData.coverImage] : []
                  }
                  endpoint="blogCoverImage"
                />
              </CardContent>
            </Card>

            <Card>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/admin/blog")}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Blog Post"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
