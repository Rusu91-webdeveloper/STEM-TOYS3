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

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  priceCurrency?: string;
  description: string;
  category: {
    name: string;
  };
  stockQuantity?: number;
  isActive: boolean;
  images: string[];
  tags?: string[];
  createdAt: Date;
  ageGroup?: string;
  stemDiscipline?: string;
  learningOutcomes?: string[];
  productType?: string;
  specialCategories?: string[];
  status?: string;
  supplier?: {
    id: string;
    companyName: string;
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
      case "PENDING_APPROVAL":
        return <Badge variant="secondary">În așteptare</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Respins</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Necunoscut</Badge>;
    }
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
              {product.category.name}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default" className="bg-purple-600">
                STEM
              </Badge>
              {getStatusBadge(product.status)}
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
