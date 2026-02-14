"use client";

import { ArrowUpDown, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/lib/currency";

import { ProductActionsDropdown } from "./ProductActionsDropdown";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  priceCurrency?: string; // Currency of the price (EUR or RON)
  category: {
    name: string;
  };
  stockQuantity?: number;
  isActive: boolean;
  images: string[];
  supplier?: {
    id: string;
    name?: string;
    companyName?: string;
  } | null;
}

export function ProductTable({ products }: { products: Product[] }) {
  const { formatPrice } = useCurrency();

  return (
    <div className="border rounded-md">
      <div className="w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Product
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Supplier
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Price
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Inventory
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No products found
                </td>
              </tr>
            ) : (
              products.map(product => (
                <tr
                  key={product.id}
                  className="border-b text-sm hover:bg-muted/50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-md">
                        <Image
                          src={product.images[0] || "/placeholder-product.png"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          ID: {product.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {product.category?.name || "N/A"}
                  </td>
                  <td className="px-4 py-4">
                    {product.supplier ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {product.supplier.companyName ||
                            product.supplier.name ||
                            "Supplier"}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Direct
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="font-medium">{product.price} RON</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {product.stockQuantity !== undefined
                      ? product.stockQuantity
                      : "N/A"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {product.isActive ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ProductActionsDropdown
                      productId={product.id}
                      productSlug={product.slug}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
