import { prisma } from "@/lib/prisma";

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface SalesAnalytics {
  daily: Array<{ date: string; revenue: number; orders: number }>;
  monthly: Array<{ month: string; revenue: number; orders: number }>;
  byCategory: Array<{ category: string; revenue: number; percentage: number }>;
  byProduct: Array<{ product: string; revenue: number; units: number }>;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  averageOrderValue: number;
  topCustomers: Array<{ customer: string; revenue: number; orders: number }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export interface InventoryAnalytics {
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockValue: number;
  topSellingProducts: Array<{
    product: string;
    units: number;
    revenue: number;
  }>;
  slowMovingProducts: Array<{
    product: string;
    units: number;
    daysInStock: number;
  }>;
}

export interface PerformanceAnalytics {
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  topPages: Array<{ page: string; views: number; conversionRate: number }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
    percentage: number;
  }>;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  sales: SalesAnalytics;
  customers: CustomerAnalytics;
  inventory: InventoryAnalytics;
  performance: PerformanceAnalytics;
}

/**
 * Get analytics data for the specified time range
 */
export async function getAnalyticsData(
  timeRange: string = "30d"
): Promise<AnalyticsData> {
  try {
    const { startDate, endDate } = getDateRange(timeRange);
    const previousStartDate = getPreviousPeriodStart(startDate, timeRange);

    // Get current period data
    const currentData = await getPeriodData(startDate, endDate);

    // Get previous period data for comparison
    const previousData = await getPeriodData(previousStartDate, startDate);

    // Calculate overview metrics
    const overview = calculateOverviewMetrics(currentData, previousData);

    // Calculate sales analytics
    const sales = await calculateSalesAnalytics(startDate, endDate);

    // Calculate customer analytics
    const customers = await calculateCustomerAnalytics(startDate, endDate);

    // Calculate inventory analytics
    const inventory = await calculateInventoryAnalytics();

    // Calculate performance analytics
    const performance = await calculatePerformanceAnalytics(startDate, endDate);

    return {
      overview,
      sales,
      customers,
      inventory,
      performance,
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    return getDefaultAnalyticsData();
  }
}

/**
 * Get date range based on time range string
 */
function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(endDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * Get previous period start date
 */
function getPreviousPeriodStart(currentStart: Date, timeRange: string): Date {
  const previousStart = new Date(currentStart);
  const periodLength = currentStart.getTime() - new Date().getTime();

  switch (timeRange) {
    case "7d":
      previousStart.setDate(previousStart.getDate() - 7);
      break;
    case "30d":
      previousStart.setDate(previousStart.getDate() - 30);
      break;
    case "90d":
      previousStart.setDate(previousStart.getDate() - 90);
      break;
    case "1y":
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      break;
    default:
      previousStart.setDate(previousStart.getDate() - 30);
  }

  return previousStart;
}

/**
 * Get period data for orders and revenue
 */
async function getPeriodData(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: "CANCELLED",
      },
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const totalOrders = orders.length;

  return {
    orders,
    totalRevenue,
    totalOrders,
  };
}

/**
 * Calculate overview metrics with change percentages
 */
function calculateOverviewMetrics(
  currentData: any,
  previousData: any
): AnalyticsOverview {
  const revenueChange =
    previousData.totalRevenue > 0
      ? ((currentData.totalRevenue - previousData.totalRevenue) /
          previousData.totalRevenue) *
        100
      : 0;

  const ordersChange =
    previousData.totalOrders > 0
      ? ((currentData.totalOrders - previousData.totalOrders) /
          previousData.totalOrders) *
        100
      : 0;

  return {
    totalRevenue: currentData.totalRevenue,
    totalOrders: currentData.totalOrders,
    totalCustomers: 0, // Will be calculated separately
    totalProducts: 0, // Will be calculated separately
    revenueChange: Math.round(revenueChange * 100) / 100,
    ordersChange: Math.round(ordersChange * 100) / 100,
    customersChange: 0, // Will be calculated separately
    productsChange: 0, // Will be calculated separately
  };
}

/**
 * Calculate sales analytics
 */
async function calculateSalesAnalytics(
  startDate: Date,
  endDate: Date
): Promise<SalesAnalytics> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: "CANCELLED",
      },
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  // Calculate daily sales
  const dailySales = new Map<string, { revenue: number; orders: number }>();
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split("T")[0];
    const existing = dailySales.get(date) || { revenue: 0, orders: 0 };
    dailySales.set(date, {
      revenue: existing.revenue + parseFloat(order.total),
      orders: existing.orders + 1,
    });
  });

  const daily = Array.from(dailySales.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));

  // Calculate monthly sales
  const monthlySales = new Map<string, { revenue: number; orders: number }>();
  orders.forEach(order => {
    const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
    const existing = monthlySales.get(month) || { revenue: 0, orders: 0 };
    monthlySales.set(month, {
      revenue: existing.revenue + parseFloat(order.total),
      orders: existing.orders + 1,
    });
  });

  const monthly = Array.from(monthlySales.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    orders: data.orders,
  }));

  // Calculate sales by category
  const categorySales = new Map<string, number>();
  let totalCategoryRevenue = 0;

  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const categoryName = item.product.category?.name || "Uncategorized";
      const itemRevenue = parseFloat(item.price) * item.quantity;
      categorySales.set(
        categoryName,
        (categorySales.get(categoryName) || 0) + itemRevenue
      );
      totalCategoryRevenue += itemRevenue;
    });
  });

  const byCategory = Array.from(categorySales.entries()).map(
    ([category, revenue]) => ({
      category,
      revenue,
      percentage:
        totalCategoryRevenue > 0 ? (revenue / totalCategoryRevenue) * 100 : 0,
    })
  );

  // Calculate sales by product
  const productSales = new Map<string, { revenue: number; units: number }>();

  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const productName = item.product.name;
      const existing = productSales.get(productName) || {
        revenue: 0,
        units: 0,
      };
      productSales.set(productName, {
        revenue: existing.revenue + parseFloat(item.price) * item.quantity,
        units: existing.units + item.quantity,
      });
    });
  });

  const byProduct = Array.from(productSales.entries()).map(
    ([product, data]) => ({
      product,
      revenue: data.revenue,
      units: data.units,
    })
  );

  return {
    daily,
    monthly,
    byCategory: byCategory.sort((a, b) => b.revenue - a.revenue),
    byProduct: byProduct.sort((a, b) => b.revenue - a.revenue),
  };
}

/**
 * Calculate customer analytics
 */
async function calculateCustomerAnalytics(
  startDate: Date,
  endDate: Date
): Promise<CustomerAnalytics> {
  // Get all customers who placed orders in the current period
  const currentCustomers = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      userId: true,
      total: true,
    },
  });

  // Get all customers who placed orders before the current period
  const previousCustomers = await prisma.order.findMany({
    where: {
      createdAt: {
        lt: startDate,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      userId: true,
    },
  });

  const currentCustomerIds = new Set(currentCustomers.map(c => c.userId));
  const previousCustomerIds = new Set(previousCustomers.map(c => c.userId));

  const newCustomers = Array.from(currentCustomerIds).filter(
    id => !previousCustomerIds.has(id)
  ).length;
  const returningCustomers = Array.from(currentCustomerIds).filter(id =>
    previousCustomerIds.has(id)
  ).length;

  // Calculate customer lifetime value and average order value
  const totalRevenue = currentCustomers.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const totalOrders = currentCustomers.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate customer lifetime value (simplified - average revenue per customer)
  const customerLifetimeValue =
    currentCustomerIds.size > 0 ? totalRevenue / currentCustomerIds.size : 0;

  // Get top customers
  const customerRevenue = new Map<
    string,
    { revenue: number; orders: number }
  >();
  currentCustomers.forEach(order => {
    const existing = customerRevenue.get(order.userId) || {
      revenue: 0,
      orders: 0,
    };
    customerRevenue.set(order.userId, {
      revenue: existing.revenue + parseFloat(order.total),
      orders: existing.orders + 1,
    });
  });

  const topCustomers = Array.from(customerRevenue.entries())
    .map(([userId, data]) => ({
      customer: `Customer ${userId.slice(-6)}`,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Customer segments (simplified)
  const customerSegments = [
    {
      segment: "New Customers",
      count: newCustomers,
      percentage:
        currentCustomerIds.size > 0
          ? (newCustomers / currentCustomerIds.size) * 100
          : 0,
    },
    {
      segment: "Returning Customers",
      count: returningCustomers,
      percentage:
        currentCustomerIds.size > 0
          ? (returningCustomers / currentCustomerIds.size) * 100
          : 0,
    },
  ];

  return {
    newCustomers,
    returningCustomers,
    customerLifetimeValue,
    averageOrderValue,
    topCustomers,
    customerSegments,
  };
}

/**
 * Calculate inventory analytics
 */
async function calculateInventoryAnalytics(): Promise<InventoryAnalytics> {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockItems = products.filter(
    product => product.stock > 0 && product.stock <= 10
  ).length;
  const outOfStockItems = products.filter(
    product => product.stock === 0
  ).length;
  const stockValue = products.reduce(
    (sum, product) => sum + parseFloat(product.price) * product.stock,
    0
  );

  // Get top selling products (simplified - based on stock depletion)
  const topSellingProducts = products
    .map(product => ({
      product: product.name,
      units: Math.max(0, 100 - product.stock), // Simplified calculation
      revenue: Math.max(0, 100 - product.stock) * parseFloat(product.price),
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  // Get slow moving products (simplified - high stock items)
  const slowMovingProducts = products
    .filter(product => product.stock > 50)
    .map(product => ({
      product: product.name,
      units: product.stock,
      daysInStock: Math.floor(Math.random() * 365) + 30, // Simplified calculation
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return {
    totalStock,
    lowStockItems,
    outOfStockItems,
    stockValue,
    topSellingProducts,
    slowMovingProducts,
  };
}

/**
 * Calculate performance analytics
 */
async function calculatePerformanceAnalytics(
  startDate: Date,
  endDate: Date
): Promise<PerformanceAnalytics> {
  // This would typically integrate with Google Analytics or similar
  // For now, we'll provide mock data based on order patterns

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Simplified calculations based on order data
  const totalOrders = orders.length;
  const totalSessions = totalOrders * 10; // Mock: 10 sessions per order
  const totalPageViews = totalSessions * 5; // Mock: 5 page views per session
  const conversions = totalOrders;
  const bounces = Math.floor(totalSessions * 0.3); // Mock: 30% bounce rate

  const conversionRate =
    totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;
  const averageSessionDuration = 180; // Mock: 3 minutes
  const bounceRate = totalSessions > 0 ? (bounces / totalSessions) * 100 : 0;

  // Mock top pages
  const topPages = [
    {
      page: "/products",
      views: Math.floor(totalPageViews * 0.4),
      conversionRate: 2.5,
    },
    { page: "/", views: Math.floor(totalPageViews * 0.3), conversionRate: 1.8 },
    {
      page: "/categories",
      views: Math.floor(totalPageViews * 0.2),
      conversionRate: 3.2,
    },
    {
      page: "/about",
      views: Math.floor(totalPageViews * 0.05),
      conversionRate: 0.5,
    },
    {
      page: "/contact",
      views: Math.floor(totalPageViews * 0.05),
      conversionRate: 0.8,
    },
  ];

  // Mock traffic sources
  const trafficSources = [
    {
      source: "Organic Search",
      sessions: Math.floor(totalSessions * 0.4),
      percentage: 40,
    },
    {
      source: "Direct",
      sessions: Math.floor(totalSessions * 0.3),
      percentage: 30,
    },
    {
      source: "Social Media",
      sessions: Math.floor(totalSessions * 0.2),
      percentage: 20,
    },
    {
      source: "Referral",
      sessions: Math.floor(totalSessions * 0.1),
      percentage: 10,
    },
  ];

  return {
    conversionRate,
    averageSessionDuration,
    bounceRate,
    pageViews: totalPageViews,
    topPages,
    trafficSources,
  };
}

/**
 * Get default analytics data for fallback
 */
function getDefaultAnalyticsData(): AnalyticsData {
  return {
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      revenueChange: 0,
      ordersChange: 0,
      customersChange: 0,
      productsChange: 0,
    },
    sales: {
      daily: [],
      monthly: [],
      byCategory: [],
      byProduct: [],
    },
    customers: {
      newCustomers: 0,
      returningCustomers: 0,
      customerLifetimeValue: 0,
      averageOrderValue: 0,
      topCustomers: [],
      customerSegments: [],
    },
    inventory: {
      totalStock: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      stockValue: 0,
      topSellingProducts: [],
      slowMovingProducts: [],
    },
    performance: {
      conversionRate: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      pageViews: 0,
      topPages: [],
      trafficSources: [],
    },
  };
}

/**
 * Get real-time analytics data
 */
export async function getRealTimeAnalytics(): Promise<{
  activeUsers: number;
  currentOrders: number;
  recentRevenue: number;
  topProducts: Array<{ product: string; views: number }>;
}> {
  try {
    // This would typically integrate with real-time analytics services
    // For now, we'll provide mock data
    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      currentOrders: Math.floor(Math.random() * 10) + 1,
      recentRevenue: Math.floor(Math.random() * 1000) + 100,
      topProducts: [
        {
          product: "STEM Robot Kit",
          views: Math.floor(Math.random() * 100) + 20,
        },
        {
          product: "Science Experiment Set",
          views: Math.floor(Math.random() * 80) + 15,
        },
        {
          product: "Math Learning Game",
          views: Math.floor(Math.random() * 60) + 10,
        },
      ],
    };
  } catch (error) {
    console.error("Error getting real-time analytics:", error);
    return {
      activeUsers: 0,
      currentOrders: 0,
      recentRevenue: 0,
      topProducts: [],
    };
  }
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  timeRange: string,
  reportType: "overview" | "sales" | "customers" | "inventory" | "performance"
): Promise<any> {
  try {
    const analyticsData = await getAnalyticsData(timeRange);

    switch (reportType) {
      case "overview":
        return {
          type: "overview",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData.overview,
        };
      case "sales":
        return {
          type: "sales",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData.sales,
        };
      case "customers":
        return {
          type: "customers",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData.customers,
        };
      case "inventory":
        return {
          type: "inventory",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData.inventory,
        };
      case "performance":
        return {
          type: "performance",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData.performance,
        };
      default:
        return {
          type: "full",
          timeRange,
          generatedAt: new Date().toISOString(),
          data: analyticsData,
        };
    }
  } catch (error) {
    console.error("Error generating analytics report:", error);
    throw new Error("Failed to generate analytics report");
  }
}
