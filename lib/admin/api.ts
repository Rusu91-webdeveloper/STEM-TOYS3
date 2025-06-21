"use client";

// Remove the import of cookies from next/headers
// import { cookies } from "next/headers";

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  inventory: number;
}

export interface DashboardData {
  stats: DashboardStat[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

/**
 * Fetches dashboard data from the API with client-side authentication
 */
export async function getDashboardData(
  period: number = 30
): Promise<DashboardData> {
  try {
    // Use an absolute URL for fetch - this works for client components
    const url = new URL(
      "/api/admin/dashboard",
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    );
    url.searchParams.append("period", period.toString());

    // Client-side fetch will automatically include cookies
    const response = await fetch(url.toString(), {
      // No need to manually add cookies, they are included automatically
      cache: "no-store", // Don't cache this data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty data structure on error
    return {
      stats: [
        {
          title: "Total Revenue",
          value: "0.00 lei", // Default to RON currency
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "Total Orders",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "New Customers",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "Total Products",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: "Active products",
        },
      ],
      recentOrders: [],
      topProducts: [],
    };
  }
}
