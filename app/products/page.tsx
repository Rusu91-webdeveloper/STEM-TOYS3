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

// 🚀 PERFORMANCE: Use ISR instead of force-dynamic for better caching
export const revalidate = 300; // Revalidate every 5 minutes

// Metadata is exported from a separate file
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Use await for searchParams to avoid the Next.js error
  const params = await searchParams;

  const requestedCategory =
    typeof params.category === "string" ? params.category : undefined;

  try {
    let booksData: Book[] = [];
    let productsData: Product[] = [];
    const fetchErrors: { books?: string; products?: string } = {};

    // 🚀 PERFORMANCE & LOGIC FIX: Conditionally fetch books and products
    if (!requestedCategory) {
      // No category selected, fetch both with proper caching
      const [booksResult, productsResult] = await Promise.allSettled([
        getBooks(),
        getProducts(),
      ]);

      if (booksResult.status === "fulfilled") {
        booksData = booksResult.value;
      } else {
        fetchErrors.books =
          booksResult.reason?.message || "Unknown error fetching books";
        booksData = [];
      }

      if (productsResult.status === "fulfilled") {
        productsData = productsResult.value;
      } else {
        fetchErrors.products =
          productsResult.reason?.message || "Unknown error fetching products";
        productsData = [];
      }
    } else if (requestedCategory === "educational-books") {
      // Only fetch books for the "educational-books" category
      try {
        booksData = await getBooks();
      } catch (error) {
        fetchErrors.books =
          error instanceof Error
            ? error.message
            : "Unknown error fetching books";
        booksData = [];
      }
    } else {
      // Fetch STEM products for any other category
      try {
        productsData = await getProducts({ category: requestedCategory });
      } catch (error) {
        fetchErrors.products =
          error instanceof Error
            ? error.message
            : "Unknown error fetching products";
        productsData = [];
      }
    }

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
      createdAt: new Date(book.createdAt),
      updatedAt: new Date(book.updatedAt),
      stockQuantity: 999, // Digital books don't have stock limits
      reservedQuantity: 0, // Digital books don't have reserved quantity
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
        // Include new categorization fields
        ageGroup: (product as any).ageGroup,
        stemDiscipline: (product as any).stemDiscipline,
        learningOutcomes: (product as any).learningOutcomes,
        productType: (product as any).productType,
        specialCategories: (product as any).specialCategories,
      } as ProductData;
    });

    // Combine both books and STEM products
    const products = [...bookProducts, ...stemProducts];

    if (products.length === 0) {
      // Show a more informative message if no products were found
      if (Object.keys(fetchErrors).length > 0) {
        return (
          <div className="container mx-auto py-12">
            <h1 className="text-2xl font-bold mb-4">Unable to Load Products</h1>
            <p className="mb-4">
              We&apos;re having trouble loading products at the moment. Please
              try again later.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="bg-gray-100 p-4 mt-4 rounded">
                <h3 className="font-bold mb-2">Debug Information:</h3>
                <p>
                  <strong>Environment:</strong> {process.env.NODE_ENV}
                </p>
                <p>
                  <strong>NEXTAUTH_URL:</strong>{" "}
                  {process.env.NEXTAUTH_URL || "Not set"}
                </p>
                <p>
                  <strong>NEXT_PUBLIC_SITE_URL:</strong>{" "}
                  {process.env.NEXT_PUBLIC_SITE_URL || "Not set"}
                </p>
                {fetchErrors.books && (
                  <p>
                    <strong>Books Error:</strong> {fetchErrors.books}
                  </p>
                )}
                {fetchErrors.products && (
                  <p>
                    <strong>Products Error:</strong> {fetchErrors.products}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }
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
        {process.env.NODE_ENV === "development" && (
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
            <p>
              <strong>NEXTAUTH_URL:</strong>{" "}
              {process.env.NEXTAUTH_URL || "Not set"}
            </p>
            <p>
              <strong>NEXT_PUBLIC_SITE_URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_SITE_URL || "Not set"}
            </p>
            <pre className="bg-gray-100 p-4 mt-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
}
