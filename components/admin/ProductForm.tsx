"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Upload, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/utils";

// Define form schema
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  slug: z
    .string()
    .min(3, {
      message: "Slug must be at least 3 characters.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug must contain only lowercase letters, numbers, and hyphens.",
    }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().positive({
    message: "Price must be a positive number.",
  }),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  stock: z.coerce.number().int().nonnegative({
    message: "Stock must be zero or positive.",
  }),
  images: z.array(z.string()).min(1, {
    message: "At least one image is required.",
  }),
  categoryId: z.string().min(1, {
    message: "Category is required.",
  }),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  // SEO fields
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()),
  // STEM specific fields
  ageRange: z.string().optional(),
  stemCategory: z.string().optional(),
  difficultyLevel: z.string().optional(),
  learningObjectives: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

// Mock categories - in production, these would be fetched from the database
const mockCategories = [
  { id: "cat_1", name: "Science" },
  { id: "cat_2", name: "Technology" },
  { id: "cat_3", name: "Engineering" },
  { id: "cat_4", name: "Mathematics" },
];

interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function ProductForm({
  initialData,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newLearningObjective, setNewLearningObjective] = useState("");
  const [categories, setCategories] = useState(mockCategories);

  // Form hook
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      price: 0,
      compareAtPrice: null,
      stock: 0,
      images: [],
      categoryId: "",
      tags: [],
      isActive: true,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: [],
      ageRange: "",
      stemCategory: "",
      difficultyLevel: "",
      learningObjectives: [],
    },
  });

  // Auto-generate slug from name
  useEffect(() => {
    const name = form.watch("name");
    if (name && !isEditing) {
      form.setValue("slug", slugify(name));
    }

    // Auto-generate meta title from name if empty
    if (name && !form.watch("metaTitle")) {
      form.setValue("metaTitle", name);
    }
  }, [form.watch("name"), form, isEditing]);

  // Auto-generate meta description from description if empty
  useEffect(() => {
    const description = form.watch("description");
    if (description && !form.watch("metaDescription")) {
      // Limit to 160 characters for SEO best practices
      form.setValue("metaDescription", description.substring(0, 160));
    }
  }, [form.watch("description"), form]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Failed to fetch categories");
          // Fallback to mock data if API fails
          setCategories(mockCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to mock data if API fails
        setCategories(mockCategories);
      }
    };

    fetchCategories();
  }, []);

  const addTag = () => {
    if (newTag.trim() !== "") {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(newTag.trim())) {
        form.setValue("tags", [...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter(t => t !== tag)
    );
  };

  const addLearningObjective = () => {
    if (newLearningObjective.trim() !== "") {
      const currentObjectives = form.getValues("learningObjectives") || [];
      if (!currentObjectives.includes(newLearningObjective.trim())) {
        form.setValue("learningObjectives", [
          ...currentObjectives,
          newLearningObjective.trim(),
        ]);
      }
      setNewLearningObjective("");
    }
  };

  const removeLearningObjective = (objective: string) => {
    const currentObjectives = form.getValues("learningObjectives");
    form.setValue(
      "learningObjectives",
      currentObjectives.filter(o => o !== objective)
    );
  };

  // Replace the mock image upload functions with the real image uploader
  const handleImagesUploaded = (imageUrls: string[]) => {
    console.log("Images uploaded:", imageUrls);
    form.setValue("images", imageUrls);

    // Clear any previous image-related errors
    if (imageUrls.length > 0) {
      form.clearErrors("images");
    }
  };

  const removeImage = (imageUrl: string) => {
    const currentImages = form.getValues("images");
    form.setValue(
      "images",
      currentImages.filter(img => img !== imageUrl)
    );
  };

  console.log("ProductForm component: form is ready for submission", {
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  });

  // Form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      console.log("Form submission started", { data });

      // Validate that at least one image is uploaded
      if (!data.images || data.images.length === 0) {
        toast({
          title: "Eroare",
          description: "Trebuie să încărcați cel puțin o imagine",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate that a category is selected
      if (!data.categoryId) {
        toast({
          title: "Eroare",
          description: "Trebuie să selectați o categorie",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // API endpoint and method based on whether we're editing or creating
      const endpoint = isEditing
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";

      const method = isEditing ? "PATCH" : "POST";

      // Prepare the attributes object with STEM-specific fields
      const attributes = {
        ...(data.ageRange ? { ageRange: data.ageRange } : {}),
        ...(data.stemCategory
          ? { stemCategory: data.stemCategory.toUpperCase() }
          : {}),
        ...(data.difficultyLevel
          ? { difficultyLevel: data.difficultyLevel }
          : {}),
        ...(data.learningObjectives && data.learningObjectives.length > 0
          ? { learningObjectives: data.learningObjectives }
          : {}),
      };

      // Prepare metadata
      const metadata = {
        metaTitle: data.metaTitle || data.name,
        metaDescription:
          data.metaDescription || data.description?.substring(0, 160),
        keywords: data.metaKeywords,
      };

      // Prepare the request body
      const requestBody = {
        ...data,
        attributes,
        metadata,
      };

      console.log("Sending request to:", endpoint);
      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      // Send the request to the API
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers.entries()])
      );

      // Add detailed response logging
      let responseText;
      try {
        // Clone the response to avoid "body already read" errors
        const responseClone = response.clone();
        responseText = await responseClone.text();
        console.log("Raw response text:", responseText);
      } catch (textError) {
        console.error("Failed to get response text:", textError);
      }

      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = "Failed to save product";
        try {
          const errorData = responseText
            ? JSON.parse(responseText)
            : await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Error response data:", errorData);
        } catch (e) {
          console.error("Failed to parse error response", e);
        }
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = responseText
          ? JSON.parse(responseText)
          : await response.json();
        console.log("Success response data:", responseData);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        responseData = {
          message: "Product saved but response could not be parsed",
        };
      }

      toast({
        title: isEditing ? "Produs actualizat" : "Produs creat",
        description: `${data.name} a fost ${isEditing ? "actualizat" : "creat"} cu succes.`,
      });

      // Redirect back to products list after a short delay
      console.log("Preparing to redirect to product list");
      setTimeout(() => {
        console.log("Redirecting to product list");
        window.location.href = "/admin/products";
      }, 500);
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Eroare",
        description: error.message || "A apărut o problemă",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={event => {
          console.log("Form submission event triggered", event);
          form.handleSubmit(onSubmit)(event);
        }}
      >
        <div className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the main details of your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="product-slug" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used in the URL. Auto-generated from name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed product description"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compareAtPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare At Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ""}
                              onChange={e => {
                                const value = e.target.value
                                  ? parseFloat(e.target.value)
                                  : null;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Original price for showing discounts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Available quantity in inventory.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map(category => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center">
                                <p className="text-amber-500 mb-2">
                                  No categories found
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={e => {
                                    e.preventDefault();
                                    window.open(
                                      "/admin/categories/create",
                                      "_blank"
                                    );
                                  }}
                                >
                                  Create Category
                                </Button>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a product category.{" "}
                          {categories.length === 0 && (
                            <span className="text-amber-500">
                              You need to{" "}
                              <a
                                href="/admin/categories/create"
                                target="_blank"
                                className="underline"
                              >
                                create a category
                              </a>{" "}
                              first.
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Product
                          </FormLabel>
                          <FormDescription>
                            Enable to make this product visible on your store.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch("tags").map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>
                    Upload images for your product. The first image will be the
                    main image.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    maxImages={5}
                    onImagesUploaded={handleImagesUploaded}
                    initialImages={form.getValues("images") || []}
                    endpoint="productImage"
                  />
                  {form.formState.errors.images && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.images.message as string}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>STEM-Specific Attributes</CardTitle>
                  <CardDescription>
                    Add educational information about your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Range</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3-5">3-5 years</SelectItem>
                            <SelectItem value="6-8">6-8 years</SelectItem>
                            <SelectItem value="9-12">9-12 years</SelectItem>
                            <SelectItem value="13-16">13-16 years</SelectItem>
                            <SelectItem value="17+">17+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Recommended age range for this product.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stemCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>STEM Category</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select STEM category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SCIENCE">Science</SelectItem>
                            <SelectItem value="TECHNOLOGY">
                              Technology
                            </SelectItem>
                            <SelectItem value="ENGINEERING">
                              Engineering
                            </SelectItem>
                            <SelectItem value="MATHEMATICS">
                              Mathematics
                            </SelectItem>
                            <SelectItem value="GENERAL">General</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Categorize this product by STEM discipline
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">
                              Intermediate
                            </SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="multiple">
                              Multiple Levels
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How challenging is this product to use?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Learning Objectives</FormLabel>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        placeholder="Add a learning objective"
                        value={newLearningObjective}
                        onChange={e => setNewLearningObjective(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addLearningObjective();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addLearningObjective}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      What will children learn by using this product?
                    </FormDescription>
                    <div className="flex flex-col gap-2 mt-3">
                      {form.watch("learningObjectives").map(objective => (
                        <div
                          key={objective}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span>{objective}</span>
                          <button
                            type="button"
                            onClick={() => removeLearningObjective(objective)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Optimization</CardTitle>
                  <CardDescription>
                    Optimize your product for search engines to increase
                    visibility.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Appears in browser tabs and search results. Defaults
                          to product name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description for search engines"
                            className="min-h-20"
                            maxLength={160}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A short summary that appears in search results. Limit
                          to 160 characters. Defaults to first part of product
                          description.
                        </FormDescription>
                        <div className="text-xs text-muted-foreground mt-1">
                          {field.value?.length || 0}/160 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Meta Keywords</FormLabel>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        placeholder="Add a keyword"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newTag.trim() !== "") {
                              const currentKeywords =
                                form.getValues("metaKeywords") || [];
                              if (!currentKeywords.includes(newTag.trim())) {
                                form.setValue("metaKeywords", [
                                  ...currentKeywords,
                                  newTag.trim(),
                                ]);
                              }
                              setNewTag("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newTag.trim() !== "") {
                            const currentKeywords =
                              form.getValues("metaKeywords") || [];
                            if (!currentKeywords.includes(newTag.trim())) {
                              form.setValue("metaKeywords", [
                                ...currentKeywords,
                                newTag.trim(),
                              ]);
                            }
                            setNewTag("");
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Keywords related to this product. These will help with
                      SEO.
                    </FormDescription>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch("metaKeywords").map(keyword => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              const currentKeywords =
                                form.getValues("metaKeywords");
                              form.setValue(
                                "metaKeywords",
                                currentKeywords.filter(k => k !== keyword)
                              );
                            }}
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md p-4 bg-muted/50">
                    <h3 className="font-medium mb-2">SEO Preview</h3>
                    <div className="space-y-1.5">
                      <div className="text-blue-600 text-lg font-medium">
                        {form.watch("metaTitle") ||
                          form.watch("name") ||
                          "Product Title"}
                      </div>
                      <div className="text-green-700 text-sm">
                        yourwebsite.com/products/
                        {form.watch("slug") || "product-slug"}
                      </div>
                      <div className="text-sm text-gray-700">
                        {form.watch("metaDescription") ||
                          form.watch("description")?.substring(0, 160) ||
                          "Your product description will appear here. Make sure to provide a compelling description to attract customers."}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
