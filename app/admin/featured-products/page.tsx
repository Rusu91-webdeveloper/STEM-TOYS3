"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/types/product";

export default function ManageFeaturedProductsPage() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setStatusMessage({
          type: "error",
          text: "Failed to load products. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Toggle featured status for a product
  const toggleFeatured = async (product: Product) => {
    try {
      setSaving(true);
      const newFeaturedValue = !product.featured;

      const response = await fetch(`/api/products/${product.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featured: newFeaturedValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      // Update local state
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, featured: newFeaturedValue } : p
        )
      );

      setStatusMessage({
        type: "success",
        text: `Product "${product.name}" ${newFeaturedValue ? "added to" : "removed from"} featured products.`,
      });

      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating product:", error);
      setStatusMessage({
        type: "error",
        text: "Failed to update product. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get the count of featured products
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Featured Products</h1>
          <p className="text-muted-foreground mt-2">
            Select up to 4 products to feature on the homepage. Currently
            featuring {featuredCount} product{featuredCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {statusMessage && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}>
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={product.featured ? "bg-blue-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={product.featured || false}
                      onCheckedChange={() => toggleFeatured(product)}
                      disabled={
                        saving || (featuredCount >= 4 && !product.featured)
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-4 relative">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-xs text-blue-500 hover:underline">
                          View product
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.category?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(product.attributes?.stemCategory as string) ||
                        "General"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold">
                      {formatPrice(product.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {featuredCount > 4 && (
        <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Warning: You have more than 4 featured products. Only the first 4 will
          be displayed on the homepage.
        </div>
      )}
    </div>
  );
}
