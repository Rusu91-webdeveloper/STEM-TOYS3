"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Upload,
  ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

interface BookFormData {
  name: string;
  author: string;
  description: string;
  price: number;
  coverImage: string | null;
  isActive: boolean;
  slug: string;
}

interface Props {
  initialData?: BookFormData & { id: string };
  isEditing: boolean;
}

export function BookForm({ initialData, isEditing }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<BookFormData>({
    name: initialData?.name || "",
    author: initialData?.author || "",
    description: initialData?.description || "",
    price: initialData?.price || 50,
    coverImage: initialData?.coverImage || null,
    isActive: initialData?.isActive ?? true,
    slug: initialData?.slug || "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleInputChange = (field: keyof BookFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === "name" && !isEditing) {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Frontend validation
      if (!formData.name.trim()) {
        throw new Error("Book title is required");
      }
      if (!formData.author.trim()) {
        throw new Error("Author is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }
      if (!formData.slug.trim()) {
        throw new Error("Slug is required");
      }
      if (formData.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      const url = isEditing
        ? `/api/admin/books/${initialData?.id}`
        : "/api/admin/books";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save book");
      }

      const result = await response.json();

      toast.success(
        isEditing ? "Book updated successfully!" : "Book created successfully!"
      );

      router.push("/admin/books");
      router.refresh();
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save book"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild>
          <Link href="/admin/books">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for the digital book.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Book Title *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter book title"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="Enter author name"
                  value={formData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="book-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  URL-friendly version of the book title
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter book description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Provide a detailed description of the book content and target
                  audience
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Settings</CardTitle>
              <CardDescription>
                Configure the book pricing and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    handleInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <Tabs
                  defaultValue="url"
                  className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="url"
                      className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="url"
                    className="space-y-2">
                    <Input
                      id="coverImage"
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      value={formData.coverImage || ""}
                      onChange={(e) =>
                        handleInputChange("coverImage", e.target.value || null)
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter a URL for the book cover image
                    </p>
                  </TabsContent>

                  <TabsContent
                    value="upload"
                    className="space-y-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <UploadButton<OurFileRouter, "bookCoverImage">
                        endpoint="bookCoverImage"
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) {
                            handleInputChange("coverImage", res[0].url);
                            toast.success("Cover image uploaded successfully!");
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                          button:
                            "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                          allowedContent: "text-sm text-muted-foreground",
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a cover image file (max 8MB)
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {formData.coverImage && (
                <div className="space-y-2">
                  <Label>Cover Preview</Label>
                  <div className="flex justify-center">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-32 h-40 object-cover rounded-md border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When active, the book will be available for purchase.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]">
            {isLoading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Update Book" : "Create Book"}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            asChild>
            <Link href="/admin/books">Cancel</Link>
          </Button>
        </div>
      </form>

      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              After creating the book, you can upload digital files (PDF, EPUB,
              etc.) from the book management page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
