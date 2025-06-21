"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { ImageUploader } from "@/components/ui/ImageUploader";

interface BlogEditPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Define the Category type
type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
};

export default function EditBlogPage({ params }: BlogEditPageProps) {
  const router = useRouter();
  const { slug } = React.use(params);

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
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
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
      }
    };

    fetchCategories();
  }, []);

  // Fetch blog data
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/blog/${slug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch blog data");
        }

        const blog = await response.json();

        setBlogData({
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          coverImage: blog.coverImage || "",
          categoryId: blog.categoryId || "",
          stemCategory: blog.stemCategory || "GENERAL",
          tags: Array.isArray(blog.tags)
            ? blog.tags.join(", ")
            : blog.tags || "",
          isPublished: blog.isPublished || false,
        });
      } catch (error) {
        console.error("Error fetching blog data:", error);
        setError("Failed to load blog data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [slug]);

  // Handle form input changes
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
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update blog post");
      }

      const updatedBlog = await response.json();
      console.log("Blog post updated:", updatedBlog);

      // Success - redirect to blog management page
      router.push("/admin/blog");
    } catch (error) {
      console.error("Error updating blog post:", error);
      alert(
        `Failed to update blog post: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading blog data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/admin/blog")}>
            Return to Blog Management
          </Button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
                <CardDescription>
                  Edit your blog post content here.
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
                    This will be used in the URL: blog/post/{blogData.slug}
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

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Content Category</Label>
                  <Select
                    value={blogData.categoryId}
                    onValueChange={(value) =>
                      handleSelectChange("categoryId", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
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
                  Update the cover image for your blog post.
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
                  {isSubmitting ? "Saving..." : "Update Blog Post"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
