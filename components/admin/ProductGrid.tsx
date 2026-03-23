"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getAgeGroupDisplayName,
  getStemDisciplineDisplayName,
  getProductTypeDisplayName,
  getLearningOutcomeDisplayName,
  getSpecialCategoryDisplayName,
} from "@/lib/utils/product-categorization";

import {
  ProductCardSkeleton,
  ProductGridSkeleton,
} from "./ProductCardSkeleton";
import { ProductDeleteButton } from "@/app/admin/products/components/ProductDeleteButton";
import { ProductStatusActions } from "@/app/admin/products/components/ProductStatusActions";
import { ProductEnhancementModal } from "./ProductEnhancementModal";
import { Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  priceCurrency?: string;
  description: string;
  category: {
    name: string;
  } | null;
  stockQuantity?: number;
  isActive: boolean;
  images: string[];
  tags?: string[];
  createdAt: Date;
  ageGroup?: string;
  stemDiscipline?: string;
  learningOutcomes?: string[];
  productType?: string;
  featured?: boolean;
  specialCategories?: string[];
  status?: string;
  supplier?: {
    id: string;
    name?: string;
    companyName?: string | null;
  } | null;
  _count: {
    orderItems: number;
  };
}

interface ProductGridProps {
  products: Product[];
  status: string;
  title: string;
  isLoading?: boolean;
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [isFeatured, setIsFeatured] = useState(product.featured ?? false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);

  const toggleFeatured = async () => {
    if (isTogglingFeatured) return;
    try {
      setIsTogglingFeatured(true);
      const newValue = !isFeatured;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: newValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setIsFeatured(newValue);
    } catch {
      // revert optimistic update on failure
      setIsFeatured(isFeatured);
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default">Aprobat</Badge>;
      case "IN_PENDING":
      case "PENDING_APPROVAL":
        return <Badge variant="secondary">În așteptare</Badge>;
      case "REJECTED":
      case "DENIED":
        return <Badge variant="destructive">Respins</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Necunoscut</Badge>;
    }
  };

  const isPendingProduct =
    product.status === "IN_PENDING" || product.status === "PENDING_APPROVAL";

  const handleEnhancementSuccess = () => {
    router.refresh();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {product.images && product.images.length > 0 ? (
            <div className="relative w-16 h-20">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover rounded-md border"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
              />
            </div>
          ) : (
            <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">
              {product.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {product.category?.name || "Fără categorie"}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="default" className="bg-purple-600">
                STEM
              </Badge>
              {getStatusBadge(product.status)}
              {isFeatured && (
                <Badge variant="default" className="bg-amber-500 gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              )}
              {product.supplier?.companyName && (
                <Badge variant="outline">{product.supplier.companyName}</Badge>
              )}
              <span className="text-sm font-medium text-green-600">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Product Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Detalii Produs
              </span>
              <Badge variant="outline">
                {product.stockQuantity ?? 0} în stoc
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Categorization Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {product.ageGroup && (
                <Badge variant="secondary" className="text-xs">
                  {getAgeGroupDisplayName(product.ageGroup as any)}
                </Badge>
              )}
              {product.stemDiscipline && (
                <Badge variant="secondary" className="text-xs">
                  {getStemDisciplineDisplayName(product.stemDiscipline as any)}
                </Badge>
              )}
              {product.productType && (
                <Badge variant="secondary" className="text-xs">
                  {getProductTypeDisplayName(product.productType as any)}
                </Badge>
              )}
            </div>

            {/* Learning Outcomes */}
            {product.learningOutcomes &&
              product.learningOutcomes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.learningOutcomes.slice(0, 3).map(outcome => (
                    <Badge key={outcome} variant="outline" className="text-xs">
                      {getLearningOutcomeDisplayName(outcome as any)}
                    </Badge>
                  ))}
                  {product.learningOutcomes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.learningOutcomes.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

            {/* Special Categories */}
            {product.specialCategories &&
              product.specialCategories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.specialCategories.map(category => (
                    <Badge
                      key={category}
                      variant="default"
                      className="text-xs bg-orange-500"
                    >
                      {getSpecialCategoryDisplayName(category as any)}
                    </Badge>
                  ))}
                </div>
              )}
          </div>

          {/* Sales Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>📦 {product._count.orderItems} vânzări</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🏷️ {product.tags?.length ?? 0} etichete</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <ProductStatusActions productId={product.id} />

            {/* Enhance Button for Pending Products */}
            {isPendingProduct && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowEnhancementModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance with AI
              </Button>
            )}

            <Button
              variant={isFeatured ? "default" : "outline"}
              size="sm"
              onClick={toggleFeatured}
              disabled={isTogglingFeatured}
              className={isFeatured ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : ""}
            >
              <Star className={`h-4 w-4 mr-2 ${isFeatured ? "fill-current" : ""}`} />
              {isFeatured ? "Remove from Featured" : "Mark as Featured"}
            </Button>

            <Button asChild variant="default" size="sm" className="flex-1">
              <Link href={`/admin/products/${product.id}`}>Editează</Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href={`/products/${product.slug}`}>Vizualizează</Link>
            </Button>
          </div>

          {/* Delete Button */}
          <div className="pt-2">
            <ProductDeleteButton
              productId={product.id}
              productName={product.name}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Creat la {new Date(product.createdAt).toLocaleDateString("ro-RO")}
          </p>
        </div>
      </CardContent>

      {/* Enhancement Modal */}
      <ProductEnhancementModal
        product={product}
        open={showEnhancementModal}
        onOpenChange={setShowEnhancementModal}
        onSuccess={handleEnhancementSuccess}
      />
    </Card>
  );
}

export function ProductGrid({
  products,
  status,
  title,
  isLoading,
}: ProductGridProps) {
  const filteredProducts = products.filter(p => p.status === status);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <ProductGridSkeleton
          count={Math.min(filteredProducts.length || 6, 6)}
        />
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">
        {title} ({filteredProducts.length})
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
