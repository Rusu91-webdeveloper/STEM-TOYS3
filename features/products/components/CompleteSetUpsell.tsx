import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { productPublicPath } from "@/lib/products/public-slug";

interface CompleteSetUpsellProps {
  productSku: string;
}

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stockQuantity: number;
}

async function getUpsellProducts(baseSku: string): Promise<UpsellProduct[]> {
  try {
    // Find products where metadata.upsellFor matches this product's SKU
    // Supports both legacy string format and new array format
    const upsellProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        OR: [
          // Legacy format: metadata.upsellFor is a string
          {
            metadata: {
              path: ["upsellFor"],
              equals: baseSku,
            },
          },
          // New format: metadata.upsellFor is an array containing baseSku
          {
            metadata: {
              path: ["upsellFor"],
              array_contains: [baseSku],
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        stockQuantity: true,
      },
      take: 6, // Limit to 6 upsells max
    });

    return upsellProducts.map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
    }));
  } catch (error) {
    console.error("Failed to fetch upsell products:", error);
    return [];
  }
}

const CompleteSetUpsell = async ({ productSku }: CompleteSetUpsellProps) => {
  const upsellProducts = await getUpsellProducts(productSku);

  // Don't render if no upsells
  if (upsellProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Completează setul</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {upsellProducts.map(product => (
          <Link
            key={product.id}
            href={productPublicPath(product.slug)}
            className="group border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            {product.images[0] && (
              <div className="relative aspect-square mb-3 overflow-hidden rounded">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            )}
            <h3 className="text-sm font-medium line-clamp-2 mb-2">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {product.price} RON
              </span>
              {product.stockQuantity > 0 ? (
                <span className="text-xs text-green-600">În stoc</span>
              ) : (
                <span className="text-xs text-gray-500">Epuizat</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CompleteSetUpsell;
