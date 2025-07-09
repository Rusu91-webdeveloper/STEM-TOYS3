"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  ShoppingCart,
  TrendingUp,
  Users,
  Lightbulb,
  Target,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";

interface RecommendationProduct extends Omit<Product, "category"> {
  score?: number;
  reason?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isTrending?: boolean;
}

interface ProductRecommendationsProps {
  userId?: string;
  currentProduct?: Product;
  viewedProducts?: Product[];
  purchaseHistory?: Product[];
  maxRecommendations?: number;
  categories?: string[];
  className?: string;
  showTabs?: boolean;
}

interface RecommendationAlgorithm {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RECOMMENDATION_ALGORITHMS: RecommendationAlgorithm[] = [
  {
    id: "personalized",
    name: "For You",
    description: "Based on your preferences and activity",
    icon: Target,
  },
  {
    id: "similar",
    name: "Similar Products",
    description: "Products similar to what you're viewing",
    icon: Shuffle,
  },
  {
    id: "trending",
    name: "Trending Now",
    description: "Popular products among other customers",
    icon: TrendingUp,
  },
  {
    id: "collaborative",
    name: "Others Also Viewed",
    description: "What similar customers are interested in",
    icon: Users,
  },
  {
    id: "smart",
    name: "Smart Picks",
    description: "AI-powered educational recommendations",
    icon: Lightbulb,
  },
];

export function ProductRecommendations({
  userId,
  currentProduct,
  viewedProducts = [],
  purchaseHistory = [],
  maxRecommendations = 8,
  categories = [],
  className,
  showTabs = true,
}: ProductRecommendationsProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [recommendations, setRecommendations] = useState<
    Record<string, RecommendationProduct[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personalized");

  // Fetch recommendations from API
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        if (userId) params.set("userId", userId);
        if (currentProduct) params.set("currentProductId", currentProduct.id);
        if (viewedProducts.length > 0) {
          params.set("viewedProducts", viewedProducts.map(p => p.id).join(","));
        }
        if (purchaseHistory.length > 0) {
          params.set(
            "purchaseHistory",
            purchaseHistory.map(p => p.id).join(",")
          );
        }
        if (categories.length > 0) {
          params.set("categories", categories.join(","));
        }
        params.set("limit", maxRecommendations.toString());

        const response = await fetch(
          `/api/products/recommendations?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || {});
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [
    userId,
    currentProduct,
    viewedProducts,
    purchaseHistory,
    categories,
    maxRecommendations,
  ]);

  // Mock data generator for demonstration
  const generateMockRecommendations = useMemo(() => {
    const mockProducts = [
      {
        id: "1",
        name: "Advanced Robotics Kit Pro",
        slug: "advanced-robotics-kit-pro",
        description: "Build and program advanced robots",
        price: 149.99,
        images: ["/images/robot-kit.jpg"],
        category: { id: "1", name: "Technology", slug: "technology" },
        rating: 4.8,
        reviewCount: 156,
        score: 0.95,
        reason: "Similar to your recently viewed products",
        isTrending: true,
      } as RecommendationProduct,
      {
        id: "2",
        name: "Chemistry Lab Starter Set",
        slug: "chemistry-lab-starter-set",
        price: 89.99,
        images: ["/images/chemistry-set.jpg"],
        category: { id: "2", name: "Science", slug: "science" },
        rating: 4.6,
        reviewCount: 89,
        score: 0.87,
        reason: "Popular with customers who bought similar items",
        isNew: true,
      },
      {
        id: "3",
        name: "Engineering Design Challenge",
        slug: "engineering-design-challenge",
        price: 79.99,
        images: ["/images/engineering-kit.jpg"],
        category: { id: "3", name: "Engineering", slug: "engineering" },
        rating: 4.7,
        reviewCount: 123,
        score: 0.82,
        reason: "Matches your learning preferences",
      },
      {
        id: "4",
        name: "Mathematical Puzzle Collection",
        slug: "mathematical-puzzle-collection",
        price: 39.99,
        images: ["/images/math-puzzles.jpg"],
        category: { id: "4", name: "Mathematics", slug: "mathematics" },
        rating: 4.5,
        reviewCount: 67,
        score: 0.78,
        reason: "Great for developing problem-solving skills",
      },
    ];

    return {
      personalized: mockProducts.slice(0, 4),
      similar: mockProducts.slice(1, 5),
      trending: mockProducts.filter(
        (p: any) => p.isTrending || (p.rating && p.rating > 4.7)
      ),
      collaborative: mockProducts.slice(2, 6),
      smart: mockProducts.filter((p: any) => p.score && p.score > 0.8),
    } as Record<string, RecommendationProduct[]>;
  }, []);

  // Use mock data if no real recommendations loaded
  const currentRecommendations =
    Object.keys(recommendations).length > 0
      ? recommendations
      : generateMockRecommendations;

  const handleAddToWishlist = async (productId: string) => {
    try {
      await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const ProductCard = ({ product }: { product: RecommendationProduct }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 h-full">
      <CardContent className="p-4">
        <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-500 text-white"
              >
                {t("new", "New")}
              </Badge>
            )}
            {product.isTrending && (
              <Badge
                variant="secondary"
                className="text-xs bg-orange-500 text-white"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {t("trending", "Trending")}
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={e => {
                e.preventDefault();
                handleAddToWishlist(product.id);
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={e => {
                e.preventDefault();
                handleAddToCart(product.id);
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Category */}
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category.name}
            </Badge>
          )}

          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3 w-3",
                      star <= product.rating!
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </div>
            {product.score && (
              <div className="text-xs text-muted-foreground">
                {Math.round(product.score * 100)}% match
              </div>
            )}
          </div>

          {/* Recommendation Reason */}
          {product.reason && (
            <p className="text-xs text-muted-foreground italic">
              {product.reason}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const RecommendationSection = ({
    algorithmId,
    title,
    description,
    products,
  }: {
    algorithmId: string;
    title: string;
    description: string;
    products: RecommendationProduct[];
  }) => (
    <div className="space-y-4">
      {!showTabs && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-80">
              <CardContent className="p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <CardContent className="space-y-4">
            <div className="text-muted-foreground">
              {t(
                "noRecommendations",
                "No recommendations available at the moment."
              )}
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t("refresh", "Refresh")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (showTabs) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {t("recommendedForYou", "Recommended For You")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "discoverProducts",
              "Discover products tailored to your interests and learning goals"
            )}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {RECOMMENDATION_ALGORITHMS.map(algorithm => {
              const Icon = algorithm.icon;
              return (
                <TabsTrigger
                  key={algorithm.id}
                  value={algorithm.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{algorithm.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {RECOMMENDATION_ALGORITHMS.map(algorithm => (
            <TabsContent
              key={algorithm.id}
              value={algorithm.id}
              className="mt-6"
            >
              <RecommendationSection
                algorithmId={algorithm.id}
                title={algorithm.name}
                description={algorithm.description}
                products={(currentRecommendations as any)[algorithm.id] || []}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Single section view
  const algorithm =
    RECOMMENDATION_ALGORITHMS.find(a => a.id === activeTab) ||
    RECOMMENDATION_ALGORITHMS[0];

  return (
    <div className={cn("space-y-6", className)}>
      <RecommendationSection
        algorithmId={algorithm.id}
        title={algorithm.name}
        description={algorithm.description}
        products={(currentRecommendations as any)[algorithm.id] || []}
      />
    </div>
  );
}

// Hook for recommendation analytics
export function useRecommendationAnalytics() {
  const trackRecommendationView = async (
    algorithmId: string,
    productIds: string[],
    context?: Record<string, any>
  ) => {
    try {
      await fetch("/api/analytics/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "view",
          algorithmId,
          productIds,
          context,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Failed to track recommendation view:", error);
    }
  };

  const trackRecommendationClick = async (
    algorithmId: string,
    productId: string,
    position: number,
    context?: Record<string, any>
  ) => {
    try {
      await fetch("/api/analytics/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "click",
          algorithmId,
          productId,
          position,
          context,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Failed to track recommendation click:", error);
    }
  };

  const trackRecommendationPurchase = async (
    algorithmId: string,
    productId: string,
    orderId: string,
    context?: Record<string, any>
  ) => {
    try {
      await fetch("/api/analytics/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          algorithmId,
          productId,
          orderId,
          context,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Failed to track recommendation purchase:", error);
    }
  };

  return {
    trackRecommendationView,
    trackRecommendationClick,
    trackRecommendationPurchase,
  };
}
