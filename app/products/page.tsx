// Server Component
import React, { Suspense } from "react";

import { ProductsPageSkeleton } from "@/components/skeletons/products-skeleton";
import ClientProductsPage from "@/features/products/components/ClientProductsPage";
import { getBooks } from "@/lib/api/books";
import { getProducts } from "@/lib/api/products";
import { CurrencyProvider } from "@/lib/currency";
import type { Book } from "@/types/book";
import type { Product } from "@/types/product";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// Product data interface to match what the client component expects
interface ProductData extends Omit<Product, "category"> {
  category?: CategoryData;
  stemCategory?: string;
}

// Set fetch directive at the page level to always get fresh data
export const dynamic = "force-dynamic";

// Metadata is exported from a separate file
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Use await for searchParams to avoid the Next.js error
  const params = await searchParams;

  console.log("🔍 ProductsPage - Environment Check:", {
    NODE_ENV: process.env.NODE_ENV,
    API_URL: process.env.NEXT_PUBLIC_API_URL || "Not set",
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "Not set",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
    DATABASE_URL_START:
      `${process.env.DATABASE_URL?.substring(0, 50)}...` || "Not set",
  });

  const requestedCategory =
    typeof params.category === "string" ? params.category : undefined;

  try {
    console.log("🚀 Fetching products from API...");
    console.log("📂 Requested category:", requestedCategory || "ALL");

    let booksData: Book[] = [];
    let productsData: Product[] = [];

    // 🚀 PERFORMANCE & LOGIC FIX: Conditionally fetch books and products
    if (!requestedCategory) {
      // No category selected, fetch both
      console.log("📦 Fetching both books and products...");

      const [booksResult, productsResult] = await Promise.allSettled([
        getBooks(),
        getProducts(),
      ]);

      if (booksResult.status === "fulfilled") {
        booksData = booksResult.value;
        console.log(`✅ Books fetch successful: ${booksData.length} items`);
      } else {
        console.error("❌ Books fetch failed:", booksResult.reason);
        booksData = [];
      }

      if (productsResult.status === "fulfilled") {
        productsData = productsResult.value;
        console.log(
          `✅ Products fetch successful: ${productsData.length} items`
        );
      } else {
        console.error("❌ Products fetch failed:", productsResult.reason);
        productsData = [];
      }
    } else if (requestedCategory === "educational-books") {
      // Only fetch books for the "educational-books" category
      console.log("📚 Fetching books only for educational-books category...");
      try {
        booksData = await getBooks();
        console.log(`✅ Books fetch successful: ${booksData.length} items`);
      } catch (error) {
        console.error("❌ Books fetch failed:", error);
        booksData = [];
      }
    } else {
      // Fetch STEM products for any other category
      console.log(
        `🔬 Fetching STEM products for category: ${requestedCategory}`
      );
      try {
        productsData = await getProducts({ category: requestedCategory });
        console.log(
          `✅ Products fetch successful: ${productsData.length} items`
        );
      } catch (error) {
        console.error("❌ Products fetch failed:", error);
        productsData = [];
      }
    }

    console.log(`📊 Final Results:`, {
      books: booksData.length,
      products: productsData.length,
      category: requestedCategory || "ALL",
    });

    // Transform books to look like products
    const bookProducts = booksData.map(book => ({
      id: book.id,
      name: book.name,
      slug: book.slug,
      description: book.description,
      price: book.price,
      compareAtPrice: undefined,
      images: book.coverImage ? [book.coverImage] : [],
      category: {
        id: "educational-books",
        name: "Educational Books",
        slug: "educational-books",
        description: "Digital educational books for download",
      },
      tags: ["book", "educational", "digital"],
      attributes: {
        author: book.author,
        isDigital: "true",
        type: "digital-book",
        languages: book.languages?.map(lang => lang.name).join(", ") || "",
      },
      isActive: book.isActive,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      stockQuantity: 999, // Digital books don't have stock limits
      featured: true,
      isBook: true, // Mark as book for proper cart handling
      stemCategory: "educational-books",
    })) as ProductData[];

    // Transform STEM products to match the expected type
    const stemProducts = productsData.map(product => {
      // Handle the category property conversion
      let categoryData: CategoryData | undefined = undefined;

      if (product.category) {
        if (typeof product.category === "string") {
          categoryData = {
            id: product.category,
            name: product.category,
            slug: product.category,
          };
        } else {
          categoryData = product.category as unknown as CategoryData;
        }
      }

      // Extract stemCategory from attributes if it exists
      let stemCategory = product.stemCategory;
      if (
        !stemCategory &&
        product.attributes &&
        typeof product.attributes === "object"
      ) {
        const attrs = product.attributes as Record<string, any>;
        stemCategory = attrs.stemCategory || null;
      }

      return {
        ...product,
        category: categoryData,
        stemCategory,
      } as ProductData;
    });

    // Combine both books and STEM products
    const products = [...bookProducts, ...stemProducts];

    console.log(`🎯 FINAL RESULT:`, {
      totalProducts: products.length,
      bookProducts: bookProducts.length,
      stemProducts: stemProducts.length,
      category: requestedCategory || "ALL",
      firstFewProducts: products
        .slice(0, 3)
        .map(p => ({ id: p.id, name: p.name })),
    });

    if (products.length === 0) {
      console.warn("⚠️ WARNING: No products found!");
      console.warn("Debug info:", {
        booksDataLength: booksData.length,
        productsDataLength: productsData.length,
        requestedCategory,
        params,
      });
    }

    return (
      <CurrencyProvider>
        <Suspense fallback={<ProductsPageSkeleton />}>
          <ClientProductsPage
            initialProducts={products}
            searchParams={params}
          />
        </Suspense>
      </CurrencyProvider>
    );
  } catch (error) {
    console.error("💥 CRITICAL ERROR in ProductsPage component:", error);
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-4">Error Loading Products</h1>
        <p>There was an error loading the products. Please try again later.</p>
        <div className="bg-gray-100 p-4 mt-4 rounded">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <p>
            <strong>Error:</strong>{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <p>
            <strong>Category:</strong> {requestedCategory || "All products"}
          </p>
          <p>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </p>
        </div>
        <pre className="bg-gray-100 p-4 mt-4 rounded overflow-auto max-h-96 text-xs">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }
}
