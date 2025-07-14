import { cookies } from "next/headers";

import { getApiUrl } from "@/lib/utils/api-url";

interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

interface TopProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  inventory: number;
}

interface DashboardData {
  stats: DashboardStat[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

/**
 * Fetches dashboard data from the API with server-side authentication
 */
export async function getDashboardData(
  period: number = 30
): Promise<DashboardData> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(
      `${baseUrl}/api/admin/dashboard?period=${period}`,
      {
        headers: {
          Cookie: cookies().toString(),
        },
        cache: "no-store", // Don't cache this data
      }
    );

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
          value: "0.00 RON",
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
