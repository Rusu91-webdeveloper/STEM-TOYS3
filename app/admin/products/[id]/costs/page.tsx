import { redirect, notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import ProductCostEditor from "@/components/admin/ProductCostEditor";

interface ProductCostsPageProps {
  params: {
    id: string;
  };
}

export default async function ProductCostsPage({
  params,
}: ProductCostsPageProps) {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  try {
    // Fetch product data
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        price: true,
        slug: true,
      },
    });

    if (!product) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <ProductCostEditor
          productId={product.id}
          productName={product.name}
          sellingPrice={product.price}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading product cost page:", error);

    // Return error state
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Product
            </h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the product data. Please try again
              later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
}
