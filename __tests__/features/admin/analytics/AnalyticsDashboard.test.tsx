import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsDashboard } from "@/app/admin/analytics/components/AnalyticsDashboard";

// Mock the currency hook
jest.mock("@/lib/currency", () => ({
  useCurrency: () => ({
    formatPrice: function (value) {
      return `$${value.toFixed(2)}`;
    },
  }),
}));

// Mock the chart components
jest.mock("@/app/admin/analytics/components/sales-chart", () => ({
  SalesChart: ({ data }: { data: any[] }) => (
    <div data-testid="sales-chart">Sales Chart - {data.length} points</div>
  ),
}));

jest.mock("@/app/admin/analytics/components/SalesByCategoryChart", () => ({
  SalesByCategoryChart: ({ categories }: { categories: any[] }) => (
    <div data-testid="category-chart">
      Category Chart - {categories.length} categories
    </div>
  ),
}));

jest.mock("@/app/admin/analytics/components/TopSellingProductsTable", () => ({
  TopSellingProductsTable: ({ products }: { products: any[] }) => (
    <div data-testid="products-table">
      Products Table - {products.length} products
    </div>
  ),
}));

// Mock the CurrencyDisplay component
jest.mock("@/app/admin/analytics/components/CurrencyDisplay", () => ({
  CurrencyDisplay: ({ value }: { value: number }) => (
    <span data-testid="currency-display">${value.toFixed(2)}</span>
  ),
}));

describe("AnalyticsDashboard", () => {
  const mockProps = {
    salesData: {
      daily: 1500.5,
      weekly: 10500.75,
      monthly: 42000.25,
      previousPeriodChange: 12.5,
      trending: "up" as const,
    },
    orderStats: {
      conversionRate: {
        rate: 3.2,
        previousPeriodChange: -0.5,
        trending: "down" as const,
      },
      averageOrderValue: {
        value: 125.99,
        previousPeriodChange: 8.3,
        trending: "up" as const,
      },
      totalCustomers: {
        value: 1250,
        previousPeriodChange: 15.7,
        trending: "up" as const,
      },
    },
    topSellingProducts: [
      {
        name: "STEM Robot Kit",
        price: 89.99,
        sold: 45,
        revenue: 4049.55,
      },
      {
        name: "Science Experiment Set",
        price: 59.99,
        sold: 32,
        revenue: 1919.68,
      },
    ],
    salesByCategory: [
      {
        categoryId: "cat_1",
        category: "STEM Toys",
        amount: 25000.99,
        percentage: 59.5,
      },
      {
        categoryId: "cat_2",
        category: "Educational Games",
        amount: 17000.25,
        percentage: 40.5,
      },
    ],
    salesChartData: {
      salesData: [
        { date: "2024-01-01", sales: 1000 },
        { date: "2024-01-02", sales: 1200 },
        { date: "2024-01-03", sales: 800 },
      ],
    },
    period: "30",
    onPeriodChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the analytics dashboard with all sections", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Total Sales")).toBeInTheDocument();
    expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
    expect(screen.getByText("Average Order Value")).toBeInTheDocument();
    expect(screen.getByText("Total Customers")).toBeInTheDocument();
    expect(screen.getByText("Sales Over Time")).toBeInTheDocument();
    expect(screen.getByText("Sales by Category")).toBeInTheDocument();
    expect(screen.getByText("Top Selling Products")).toBeInTheDocument();
  });

  it("displays correct sales data", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByText("$42000.25")).toBeInTheDocument(); // Monthly sales
    expect(screen.getByText("$10500.75")).toBeInTheDocument(); // Weekly sales
    expect(screen.getByText("$1500.50")).toBeInTheDocument(); // Daily sales
    expect(screen.getByText("12.5%")).toBeInTheDocument(); // Change percentage
  });

  it("displays correct order statistics", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByText("3.2%")).toBeInTheDocument(); // Conversion rate
    expect(screen.getByText("$125.99")).toBeInTheDocument(); // Average order value
    expect(screen.getByText("1,250")).toBeInTheDocument(); // Total customers
  });

  it("shows trending indicators correctly", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    // Check for trending up indicators
    const trendingUpIcons = screen.getAllByTestId("trending-up");
    expect(trendingUpIcons.length).toBeGreaterThan(0);

    // Check for trending down indicators
    const trendingDownIcons = screen.getAllByTestId("trending-down");
    expect(trendingDownIcons.length).toBeGreaterThan(0);
  });

  it("renders chart components with correct data", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByTestId("sales-chart")).toHaveTextContent(
      "Sales Chart - 3 points"
    );
    expect(screen.getByTestId("category-chart")).toHaveTextContent(
      "Category Chart - 2 categories"
    );
    expect(screen.getByTestId("products-table")).toHaveTextContent(
      "Products Table - 2 products"
    );
  });

  it("displays period selector with current period", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    const select = screen.getByDisplayValue("Last 30 days");
    expect(select).toBeInTheDocument();
  });

  it("calls onPeriodChange when period is changed", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "7" } });

    expect(mockProps.onPeriodChange).toHaveBeenCalledWith("7");
  });

  it("displays web vitals link", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    const link = screen.getByRole("link", { name: /web vitals snapshot/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/api/analytics/web-vitals");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("displays category sales with percentages", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByText("STEM Toys")).toBeInTheDocument();
    expect(screen.getByText("Educational Games")).toBeInTheDocument();
  });

  it("displays top selling products correctly", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    expect(screen.getByText("STEM Robot Kit")).toBeInTheDocument();
    expect(screen.getByText("Science Experiment Set")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    const emptyProps = {
      ...mockProps,
      topSellingProducts: [],
      salesByCategory: [],
      salesChartData: { salesData: [] },
    };

    render(<AnalyticsDashboard {...emptyProps} />);

    expect(screen.getByTestId("products-table")).toHaveTextContent(
      "Products Table - 0 products"
    );
    expect(screen.getByTestId("category-chart")).toHaveTextContent(
      "Category Chart - 0 categories"
    );
    expect(screen.getByTestId("sales-chart")).toHaveTextContent(
      "Sales Chart - 0 points"
    );
  });

  it("displays accessibility labels correctly", () => {
    render(<AnalyticsDashboard {...mockProps} />);

    const link = screen.getByRole("link", { name: /web vitals snapshot/i });
    expect(link).toHaveAttribute(
      "aria-label",
      "Open Web Vitals Snapshot in a new tab"
    );
  });
});
