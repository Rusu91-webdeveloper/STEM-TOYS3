"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  AlertCircle,
  Package,
  DollarSign,
  Hash,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { type SupplierProduct } from "@/features/supplier/types/supplier";

// Product form schema
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.number().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  reorderPoint: z.number().min(0, "Reorder point cannot be negative").optional(),
  weight: z.number().min(0, "Weight cannot be negative").optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  ageGroup: z.enum(["TODDLER", "PRESCHOOL", "SCHOOL_AGE", "TEEN", "ALL_AGES"]).optional(),
  stemDiscipline: z.enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATH", "GENERAL"]).default("GENERAL"),
  productType: z.enum(["ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"]).optional(),
  learningOutcomes: z.array(z.string()).default([]),
  specialCategories: z.array(z.string()).default([]),
  attributes: z.record(z.any()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface SupplierProductFormProps {
  productId?: string;
}

export function SupplierProductForm({ productId }: SupplierProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<SupplierProduct | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newLearningOutcome, setNewLearningOutcome] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stockQuantity: 0,
      isActive: true,
      featured: false,
      tags: [],
      learningOutcomes: [],
      specialCategories: [],
      stemDiscipline: "GENERAL",
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/products/${productId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      setProduct(data);
      setImages(data.images || []);
      
      // Reset form with product data
      reset({
        name: data.name,
        description: data.description || "",
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku || "",
        stockQuantity: data.stockQuantity,
        reorderPoint: data.reorderPoint,
        weight: data.weight,
        categoryId: data.categoryId,
        tags: data.tags || [],
        isActive: data.isActive,
        featured: data.featured,
        ageGroup: data.ageGroup,
        stemDiscipline: data.stemDiscipline || "GENERAL",
        productType: data.productType,
        learningOutcomes: data.learningOutcomes || [],
        specialCategories: data.specialCategories || [],
        attributes: data.attributes,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSaving(true);

      const productData = {
        ...data,
        images,
      };

      const url = productId 
        ? `/api/supplier/products/${productId}`
        : "/api/supplier/products";
      
      const method = productId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: productId 
          ? "Product updated successfully" 
          : "Product created successfully",
      });

      router.push("/supplier/products");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
      console.error("Error saving product:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      // In a real implementation, you would upload to your file storage service
      // For now, we'll simulate with placeholder URLs
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !watchedValues.tags?.includes(newTag.trim())) {
      setValue("tags", [...(watchedValues.tags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", watchedValues.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const addLearningOutcome = () => {
    if (newLearningOutcome.trim() && !watchedValues.learningOutcomes?.includes(newLearningOutcome.trim())) {
      setValue("learningOutcomes", [...(watchedValues.learningOutcomes || []), newLearningOutcome.trim()]);
      setNewLearningOutcome("");
    }
  };

  const removeLearningOutcome = (outcomeToRemove: string) => {
    setValue("learningOutcomes", watchedValues.learningOutcomes?.filter(outcome => outcome !== outcomeToRemove) || []);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/supplier/products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              {productId ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-muted-foreground">
              {productId ? "Update your product information" : "Create a new product for your catalog"}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Product"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    {...register("sku")}
                    placeholder="Stock keeping unit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your product..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select
                    value={watchedValues.categoryId || ""}
                    onValueChange={(value) => setValue("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={watchedValues.ageGroup || ""}
                    onValueChange={(value) => setValue("ageGroup", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODDLER">Toddler (1-3 years)</SelectItem>
                      <SelectItem value="PRESCHOOL">Preschool (3-5 years)</SelectItem>
                      <SelectItem value="SCHOOL_AGE">School Age (6-12 years)</SelectItem>
                      <SelectItem value="TEEN">Teen (13+ years)</SelectItem>
                      <SelectItem value="ALL_AGES">All Ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stemDiscipline">STEM Discipline</Label>
                  <Select
                    value={watchedValues.stemDiscipline || "GENERAL"}
                    onValueChange={(value) => setValue("stemDiscipline", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCIENCE">Science</SelectItem>
                      <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                      <SelectItem value="ENGINEERING">Engineering</SelectItem>
                      <SelectItem value="MATH">Math</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price (€)</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("compareAtPrice", { valueAsNumber: true })}
                    placeholder="Original price"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    {...register("stockQuantity", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.stockQuantity && (
                    <p className="text-sm text-red-600">{errors.stockQuantity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    {...register("reorderPoint", { valueAsNumber: true })}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("weight", { valueAsNumber: true })}
                    placeholder="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <label className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedValues.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {watchedValues.learningOutcomes?.map((outcome, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {outcome}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeLearningOutcome(outcome)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newLearningOutcome}
                  onChange={(e) => setNewLearningOutcome(e.target.value)}
                  placeholder="Add learning outcome"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLearningOutcome())}
                />
                <Button type="button" variant="outline" onClick={addLearningOutcome}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watchedValues.isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={watchedValues.featured}
                  onCheckedChange={(checked) => setValue("featured", checked as boolean)}
                />
                <Label htmlFor="featured">Featured Product</Label>
              </div>
            </CardContent>
          </Card>

          {/* Product Type */}
          <Card>
            <CardHeader>
              <CardTitle>Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={watchedValues.productType || ""}
                onValueChange={(value) => setValue("productType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROBOTICS">Robotics</SelectItem>
                  <SelectItem value="PUZZLES">Puzzles</SelectItem>
                  <SelectItem value="CONSTRUCTION_SETS">Construction Sets</SelectItem>
                  <SelectItem value="EXPERIMENT_KITS">Experiment Kits</SelectItem>
                  <SelectItem value="BOARD_GAMES">Board Games</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Special Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Special Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={watchedValues.specialCategories?.includes(category)}
                    onCheckedChange={(checked) => {
                      const current = watchedValues.specialCategories || [];
                      if (checked) {
                        setValue("specialCategories", [...current, category]);
                      } else {
                        setValue("specialCategories", current.filter(c => c !== category));
                      }
                    }}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
