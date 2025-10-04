import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCached, CacheKeys } from "@/lib/cache";
import {
  fetchAllProductsProfitability,
  generateUnitEconomicsSummary,
} from "@/lib/utils/unit-economics";
import { validateUnitEconomicsRequest } from "@/lib/validations/unit-economics";

import UnitEconomicsDashboard from "@/components/admin/UnitEconomicsDashboard";

interface UnitEconomicsPageProps {
  searchParams: {
    timeRange?: string;
    categoryId?: string;
    supplierId?: string;
    includeInactive?: string;
  };
}

export default async function UnitEconomicsPage({
  searchParams,
}: UnitEconomicsPageProps) {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  // Default to 30 days
  const timeRange = searchParams.timeRange || "30d";
  const categoryId = searchParams.categoryId;
  const supplierId = searchParams.supplierId;
  const includeInactive = searchParams.includeInactive === "true";

  try {
    // Validate request parameters
    const validatedRequest = validateUnitEconomicsRequest({
      timeRange,
      categoryId,
      supplierId,
      includeInactive,
    });

    // Caching strategy for unit economics data
    const cacheKey = CacheKeys.analytics(
      `unit-economics-page:${timeRange}:${categoryId || "all"}:${supplierId || "all"}:${includeInactive}`
    );
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for page-level analytics

    const unitEconomicsData = await getCached(
      cacheKey,
      async () => {
        // Fetch all unit economics data in parallel for better performance
        const [summary, products] = await Promise.all([
          generateUnitEconomicsSummary(validatedRequest),
          fetchAllProductsProfitability(validatedRequest),
        ]);

        return {
          summary,
          products,
        };
      },
      CACHE_TTL
    );

    return (
      <div className="container mx-auto py-6">
        <UnitEconomicsDashboard data={unitEconomicsData} isLoading={false} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching unit economics data:", error);

    // Return error state
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Unit Economics
            </h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the unit economics data. Please try
              again later.
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
