import { db } from "@/lib/db";
import {
  CostBreakdown,
  MarketingCost,
  ProductProfitability,
  UnitEconomicsSummary,
  UnitEconomicsRequest,
} from "@/lib/validations/unit-economics";

/**
 * Calculate total cost per sale for a product
 */
export function calculateTotalCostPerSale(
  sellingPrice: number,
  costs: CostBreakdown,
  marketingCosts: MarketingCost
): number {
  const productCosts =
    (costs.costPrice || 0) +
    costs.importDuties +
    costs.shippingCost +
    costs.storageCost +
    costs.packagingCost +
    costs.laborCost +
    costs.qualityControlCost;

  const operationalCosts =
    sellingPrice * (costs.paymentProcessingFee / 100) +
    costs.customerServiceCost +
    costs.operationalOverhead;

  const marketingCostsTotal =
    marketingCosts.totalMarketingCost ||
    marketingCosts.googleAdsCost +
      marketingCosts.facebookAdsCost +
      marketingCosts.seoCost +
      marketingCosts.influencerCost;

  return productCosts + operationalCosts + marketingCostsTotal;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(
  sellingPrice: number,
  totalCost: number
): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - totalCost) / sellingPrice) * 100;
}

/**
 * Calculate net profit per sale
 */
export function calculateNetProfitPerSale(
  sellingPrice: number,
  totalCost: number
): number {
  return sellingPrice - totalCost;
}

/**
 * Calculate LTV to CAC ratio
 */
export function calculateLtvToCacRatio(
  lifetimeValue: number,
  acquisitionCost: number
): number {
  if (acquisitionCost === 0) return 0;
  return lifetimeValue / acquisitionCost;
}

/**
 * Calculate break-even point (units needed to break even)
 */
export function calculateBreakEvenPoint(
  fixedCosts: number,
  profitPerUnit: number
): number {
  if (profitPerUnit <= 0) return Infinity;
  return Math.ceil(fixedCosts / profitPerUnit);
}

/**
 * Determine risk level based on profit margin and LTV/CAC ratio
 */
export function determineRiskLevel(
  profitMargin: number,
  ltvToCacRatio: number
): "LOW" | "MEDIUM" | "HIGH" {
  if (profitMargin >= 20 && ltvToCacRatio >= 3) return "LOW";
  if (profitMargin >= 10 && ltvToCacRatio >= 2) return "MEDIUM";
  return "HIGH";
}

/**
 * Calculate Customer Acquisition Cost (CAC) for a product
 */
export function calculateCustomerAcquisitionCost(
  totalMarketingCost: number,
  totalSales: number
): number {
  if (totalSales === 0) return 0;
  return totalMarketingCost / totalSales;
}

/**
 * Calculate Customer Lifetime Value (LTV) for a product
 */
export function calculateCustomerLifetimeValue(
  averageOrderValue: number,
  averageOrdersPerCustomer: number,
  profitMargin: number
): number {
  return averageOrderValue * averageOrdersPerCustomer * (profitMargin / 100);
}

/**
 * Get date range based on time range parameter
 */
export function getDateRange(timeRange: string): {
  startDate: Date;
  endDate: Date;
} {
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
 * Fetch product profitability data from database
 */
export async function fetchProductProfitability(
  productId: string,
  timeRange: string = "30d"
): Promise<ProductProfitability | null> {
  const { startDate, endDate } = getDateRange(timeRange);

  // Get product data with costs
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: { name: true },
      },
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ["COMPLETED", "DELIVERED", "SHIPPED"],
            },
          },
        },
      },
      marketingCosts: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  if (!product) return null;

  // Calculate monthly sales from order items
  const monthlySales = product.orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Calculate total marketing costs
  const totalMarketingCost = product.marketingCosts.reduce(
    (sum, cost) => sum + cost.totalMarketingCost,
    0
  );

  // Calculate costs breakdown
  const costs: CostBreakdown = {
    costPrice: product.costPrice || 0,
    importDuties: product.importDuties || 0,
    shippingCost: product.shippingCost || 0,
    storageCost: product.storageCost || 0,
    packagingCost: product.packagingCost || 0,
    laborCost: product.laborCost || 0,
    qualityControlCost: product.qualityControlCost || 0,
    paymentProcessingFee: product.paymentProcessingFee || 2.9,
    customerServiceCost: product.customerServiceCost || 0,
    operationalOverhead: product.operationalOverhead || 0,
  };

  const marketingCosts: MarketingCost = {
    googleAdsCost: 0,
    facebookAdsCost: 0,
    seoCost: 0,
    influencerCost: 0,
    totalMarketingCost,
  };

  // Calculate financial metrics
  const totalCostPerSale = calculateTotalCostPerSale(
    product.price,
    costs,
    marketingCosts
  );
  const netProfitPerSale = calculateNetProfitPerSale(
    product.price,
    totalCostPerSale
  );
  const profitMargin = calculateProfitMargin(product.price, totalCostPerSale);
  const monthlyRevenue = monthlySales * product.price;
  const monthlyProfit = monthlySales * netProfitPerSale;

  const customerAcquisitionCost = calculateCustomerAcquisitionCost(
    totalMarketingCost,
    monthlySales
  );
  const lifetimeValue = calculateCustomerLifetimeValue(
    product.price,
    1.5, // Average orders per customer (could be calculated from actual data)
    profitMargin
  );
  const ltvToCacRatio = calculateLtvToCacRatio(
    lifetimeValue,
    customerAcquisitionCost
  );
  const breakEvenPoint = calculateBreakEvenPoint(
    totalCostPerSale,
    netProfitPerSale
  );
  const riskLevel = determineRiskLevel(profitMargin, ltvToCacRatio);

  return {
    productId: product.id,
    name: product.name,
    category: product.category?.name,
    sellingPrice: product.price,
    costPrice: product.costPrice || 0,
    totalCostPerSale,
    netProfitPerSale,
    profitMargin,
    monthlySales,
    monthlyRevenue,
    monthlyProfit,
    customerAcquisitionCost,
    lifetimeValue,
    ltvToCacRatio,
    breakEvenPoint,
    isProfitable: profitMargin > 0,
    riskLevel,
  };
}

/**
 * Fetch all products profitability data
 */
export async function fetchAllProductsProfitability(
  request: UnitEconomicsRequest
): Promise<ProductProfitability[]> {
  const { startDate, endDate } = getDateRange(request.timeRange);

  const products = await db.product.findMany({
    where: {
      isActive: request.includeInactive ? undefined : true,
      categoryId: request.categoryId,
      supplierId: request.supplierId,
    },
    include: {
      category: {
        select: { name: true },
      },
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ["COMPLETED", "DELIVERED", "SHIPPED"],
            },
          },
        },
      },
      marketingCosts: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  const profitabilityData: ProductProfitability[] = [];

  for (const product of products) {
    const profitability = await fetchProductProfitability(
      product.id,
      request.timeRange
    );
    if (profitability) {
      profitabilityData.push(profitability);
    }
  }

  return profitabilityData.sort((a, b) => b.profitMargin - a.profitMargin);
}

/**
 * Generate unit economics summary
 */
export async function generateUnitEconomicsSummary(
  request: UnitEconomicsRequest
): Promise<UnitEconomicsSummary> {
  const products = await fetchAllProductsProfitability(request);

  const totalProducts = products.length;
  const profitableProducts = products.filter(p => p.isProfitable).length;
  const unprofitableProducts = totalProducts - profitableProducts;

  const totalMonthlyRevenue = products.reduce(
    (sum, p) => sum + p.monthlyRevenue,
    0
  );
  const totalMonthlyCosts = products.reduce(
    (sum, p) => sum + p.monthlySales * p.totalCostPerSale,
    0
  );
  const totalMonthlyProfit = totalMonthlyRevenue - totalMonthlyCosts;
  const overallProfitMargin =
    totalMonthlyRevenue > 0
      ? (totalMonthlyProfit / totalMonthlyRevenue) * 100
      : 0;

  const averageOrderValue =
    products.length > 0
      ? totalMonthlyRevenue /
        products.reduce((sum, p) => sum + p.monthlySales, 0)
      : 0;
  const averageCustomerAcquisitionCost =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.customerAcquisitionCost, 0) /
        products.length
      : 0;
  const averageLifetimeValue =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.lifetimeValue, 0) / products.length
      : 0;
  const averageLtvToCacRatio =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.ltvToCacRatio, 0) / products.length
      : 0;

  const mostProfitableProduct =
    products.length > 0
      ? {
          id: products[0].productId,
          name: products[0].name,
          profitMargin: products[0].profitMargin,
        }
      : undefined;

  const leastProfitableProduct =
    products.length > 0
      ? {
          id: products[products.length - 1].productId,
          name: products[products.length - 1].name,
          profitMargin: products[products.length - 1].profitMargin,
        }
      : undefined;

  const highestVolumeProduct =
    products.length > 0
      ? (() => {
          const highestVolume = products.reduce(
            (max, p) => (p.monthlySales > max.monthlySales ? p : max),
            products[0]
          );
          return {
            id: highestVolume.productId,
            name: highestVolume.name,
            monthlySales: highestVolume.monthlySales,
          };
        })()
      : undefined;

  const productsToDiscontinue = products
    .filter(p => !p.isProfitable || p.profitMargin < 5)
    .map(p => p.productId);

  return {
    totalProducts,
    profitableProducts,
    unprofitableProducts,
    totalMonthlyRevenue,
    totalMonthlyCosts,
    totalMonthlyProfit,
    overallProfitMargin,
    averageOrderValue,
    averageCustomerAcquisitionCost,
    averageLifetimeValue,
    averageLtvToCacRatio,
    mostProfitableProduct,
    leastProfitableProduct,
    highestVolumeProduct,
    productsToDiscontinue,
  };
}
