export interface SupplierPerformanceMetrics {
  id: string;
  supplierId: string;
  periodStart: Date;
  periodEnd: Date;
  totalOrders: number;
  fulfilledOrders: number;
  onTimeDeliveryRate: number;
  averageDeliveryDays: number | null;
  qualityScore: number;
  returnRate: number;
  customerSatisfaction: number;
  totalRevenue: number;
  commissionEarned: number;
  fulfillmentRate: number;
  responseTimeHours: number | null;
  issueResolutionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierOrderTracking {
  id: string;
  supplierOrderId: string;
  orderId: string;
  orderItemId: string;
  status: string;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;
  shippedDate: Date | null;
  trackingNumber: string | null;
  carrier: string | null;
  qualityRating: number | null;
  deliveryRating: number | null;
  customerFeedback: string | null;
  issuesReported: string[];
  resolutionStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceData {
  supplier: {
    id: string;
    name: string;
    email: string;
    status: string;
    commissionRate: number;
    paymentTerms: number;
    businessCountry: string;
    createdAt: string;
    totalProducts: number;
    totalOrders: number;
  };
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  performance: {
    overallScore: number;
    grade: string;
    orderMetrics: {
      totalOrders: number;
      fulfilledOrders: number;
      pendingOrders: number;
      cancelledOrders: number;
      fulfillmentRate: number;
      cancellationRate: number;
      totalRevenue: number;
      averageOrderValue: number;
    };
    qualityMetrics: {
      reviewCount: number;
      averageRating: number;
      ratingDistribution: Record<string, number>;
      satisfactionTrend: string;
      qualityScore: number;
    };
    deliveryMetrics: {
      totalTrackedOrders: number;
      deliveredOrders: number;
      onTimeDeliveries: number;
      lateDeliveries: number;
      onTimeDeliveryRate: number;
      lateDeliveryRate: number;
      averageDeliveryDays: number | null;
    };
  };
  trends: Array<{
    month: string;
    orderCount: number;
    revenue: number;
  }>;
  issues: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    issue: string;
    date: string;
    impact: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }>;
}

export interface PerformanceSummary {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  status: string;
  totalOrders: number;
  fulfilledOrders: number;
  fulfillmentRate: number;
  onTimeDeliveryRate: number;
  averageDeliveryDays: number | null;
  qualityScore: number;
  returnRate: number;
  customerSatisfaction: number;
  totalRevenue: number;
  commissionEarned: number;
  responseTimeHours: number | null;
  issueResolutionRate: number;
  reviewCount: number;
  activeProducts: number;
  performanceGrade: string;
}

export type PerformanceGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

export type RecommendationType = "critical" | "high" | "medium" | "positive";
