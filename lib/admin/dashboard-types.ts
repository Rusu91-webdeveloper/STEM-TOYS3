export interface DashboardSummary {
  paidOrderValue: number;
  paidOrders: number;
  orders: number;
  cancelledOrders: number;
  customers: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerId: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  previous: DashboardSummary;
  catalog: { activeProducts: number; activeSuppliers: number };
  attention: {
    awaitingPayment: number;
    shippingReview: number;
    openReturns: number;
    outOfStock: number;
  };
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  salesByDay: Array<{ date: string; value: number }>;
  metadata: {
    generatedAt: string;
    start: string;
    end: string;
    previousStart: string;
    days: number;
    currency: "RON";
    timezone: "Europe/Bucharest";
  };
}
