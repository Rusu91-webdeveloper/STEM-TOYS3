import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

import { ProductDeleteButton } from "./components/ProductDeleteButton";

// Force this page to be dynamic and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Add this interface at the top of the file with the imports
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  parentId?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  category: {
    name: string;
  };
  stockQuantity?: number;
  isActive: boolean;
  images: string[];
  tags?: string[];
  createdAt: Date;
  _count: {
    orderItems: number;
  };
}

// And update the getCategories function return type
async function getCategories(): Promise<Category[]> {
  try {
    // Use db client directly in server component
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Function to fetch products from the database
async function getProducts(): Promise<Product[]> {
  try {
    // Use db client directly in server component
    const products = await db.product.findMany({
      where: {
        isActive: true,
        category: {
          slug: {
            not: "educational-books",
          },
        },
      },
      include: {
        category: true,
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Main component now returns a server component that wraps the client component with CurrencyProvider
export default async function AdminProductsPage() {
  const _categories = await getCategories();
  const products = await getProducts();

  // Get STEM categories for info display
  const stemCategories = await db.category.findMany({
    where: {
      slug: {
        in: [
          "science-kits",
          "engineering-robotics",
          "technology-programming",
          "mathematics",
          "general-stem",
        ],
      },
      isActive: true,
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produse STEM</h1>
          <p className="text-muted-foreground">
            Gestionează produsele fizice STEM (jucării educaționale, kituri,
            materiale)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Produs Nou
          </Link>
        </Button>
      </div>

      {/* STEM Categories Info */}
      {stemCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Categorii STEM Disponibile
            </CardTitle>
            <CardDescription>
              Produsele sunt organizate în aceste categorii STEM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {stemCategories.map(category => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nu există produse STEM
              </h3>
              <p className="text-muted-foreground mb-4">
                Nu ai încă niciun produs STEM în sistem. Creează primul tău
                produs educațional.
              </p>
              <Button asChild>
                <Link href="/admin/products/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Creează Primul Produs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {product.images && product.images.length > 0 ? (
                    <div className="relative w-16 h-20">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md border"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
                      <Plus className="h-8 w-8 text-muted-foreground" />
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
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Activ" : "Inactiv"}
                      </Badge>
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
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/admin/products/${product.id}`}>
                        Editează
                      </Link>
                    </Button>

                    <Button asChild variant="outline" size="sm">
                      <Link href={`/products/${product.slug}`}>
                        Vizualizează
                      </Link>
                    </Button>
                  </div>

                  {/* Delete Button - Need client component for functionality */}
                  <div className="pt-2">
                    <ProductDeleteButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Creat la{" "}
                    {new Date(product.createdAt).toLocaleDateString("ro-RO")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
