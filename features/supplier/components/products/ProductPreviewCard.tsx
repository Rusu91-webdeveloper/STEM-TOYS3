"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceWithCurrency } from "@/lib/currency-converter";
import { Package, Image as ImageIcon, Tag, GraduationCap } from "lucide-react";

interface ProductPreviewCardProps {
  formData: any;
}

export function ProductPreviewCard({ formData }: ProductPreviewCardProps) {
  const mainImage = formData.images?.[0];
  const hasDiscount =
    formData.compareAtPrice && formData.compareAtPrice > formData.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((formData.compareAtPrice - formData.price) / formData.compareAtPrice) *
          100
      )
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How your product will appear to customers
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-3">
            <div className="aspect-square relative bg-muted/30 rounded-lg overflow-hidden border-2 border-dashed">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={formData.name || "Product"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No image uploaded</p>
                  </div>
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  -{discountPercent}%
                </div>
              )}
            </div>
            {formData.images && formData.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {formData.images.slice(1, 5).map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded border bg-muted/30 flex-shrink-0 overflow-hidden"
                  >
                    <Image
                      src={img}
                      alt={`Gallery ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {formData.images.length > 5 && (
                  <div className="w-16 h-16 rounded border bg-muted/30 flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                    +{formData.images.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-2xl font-bold">
                {formData.name || "Product Name"}
              </h3>
              {formData.sku && (
                <p className="text-sm text-muted-foreground mt-1">
                  SKU: {formData.sku}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {formatPriceWithCurrency(formData.price || 0, "RON")}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPriceWithCurrency(formData.compareAtPrice, "RON")}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {formData.stockQuantity > 0 ? (
                <Badge variant="default" className="bg-green-600">
                  In Stock ({formData.stockQuantity} units)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}

              {formData.ageGroup && (
                <Badge variant="secondary">
                  {formData.ageGroup.replace(/_/g, " ")}
                </Badge>
              )}

              {formData.stemDiscipline &&
                formData.stemDiscipline !== "GENERAL" && (
                  <Badge variant="outline">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {formData.stemDiscipline}
                  </Badge>
                )}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Description</h4>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {formData.description || "No description provided"}
              </p>
            </div>

            {/* Learning Outcomes */}
            {formData.learningOutcomes &&
              formData.learningOutcomes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Learning Outcomes
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.learningOutcomes.map((outcome: string) => (
                      <Badge
                        key={outcome}
                        variant="outline"
                        className="text-xs"
                      >
                        {outcome.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.slice(0, 6).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {formData.tags.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{formData.tags.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm">
              {formData.weight && (
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-1 font-medium">{formData.weight} kg</span>
                </div>
              )}
              {formData.productType && (
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-1 font-medium">
                    {formData.productType.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
