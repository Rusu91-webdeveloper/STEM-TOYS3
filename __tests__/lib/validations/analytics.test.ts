import {
  AnalyticsDataSchema,
  AnalyticsRequestSchema,
  SalesDataSchema,
  OrderStatsSchema,
  TopSellingProductSchema,
  CategorySalesSchema,
  SalesByDaySchema,
  validateAnalyticsData,
  validateAnalyticsRequest,
  validateAnalyticsPeriod,
  isValidAnalyticsData,
  safeParseAnalyticsData,
  safeParseAnalyticsRequest,
} from "@/lib/validations/analytics";

describe("Analytics Validation Schemas", () => {
  describe("SalesDataSchema", () => {
    it("should validate valid sales data", () => {
      const validData = {
        daily: 1500.5,
        weekly: 10500.75,
        monthly: 42000.25,
        previousPeriodChange: 12.5,
        trending: "up",
      };

      expect(() => SalesDataSchema.parse(validData)).not.toThrow();
      const result = SalesDataSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject invalid sales data", () => {
      const invalidData = {
        daily: "not a number",
        weekly: -100,
        monthly: 42000.25,
        previousPeriodChange: 12.5,
        trending: "sideways",
      };

      expect(() => SalesDataSchema.parse(invalidData)).toThrow();
    });
  });

  describe("OrderStatsSchema", () => {
    it("should validate valid order stats", () => {
      const validData = {
        conversionRate: {
          rate: 3.2,
          previousPeriodChange: -0.5,
          trending: "down",
        },
        averageOrderValue: {
          value: 125.99,
          previousPeriodChange: 8.3,
          trending: "up",
        },
        totalCustomers: {
          value: 1250,
          previousPeriodChange: 15.7,
          trending: "up",
        },
      };

      expect(() => OrderStatsSchema.parse(validData)).not.toThrow();
      const result = OrderStatsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject conversion rates over 100%", () => {
      const invalidData = {
        conversionRate: {
          rate: 150.5, // Invalid - over 100%
          previousPeriodChange: -0.5,
          trending: "down",
        },
        averageOrderValue: {
          value: 125.99,
          previousPeriodChange: 8.3,
          trending: "up",
        },
        totalCustomers: {
          value: 1250,
          previousPeriodChange: 15.7,
          trending: "up",
        },
      };

      expect(() => OrderStatsSchema.parse(invalidData)).toThrow();
    });
  });

  describe("TopSellingProductSchema", () => {
    it("should validate valid product data", () => {
      const validData = {
        name: "STEM Robot Kit",
        price: 89.99,
        sold: 45,
        revenue: 4049.55,
      };

      expect(() => TopSellingProductSchema.parse(validData)).not.toThrow();
      const result = TopSellingProductSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject empty product names", () => {
      const invalidData = {
        name: "", // Invalid - empty string
        price: 89.99,
        sold: 45,
        revenue: 4049.55,
      };

      expect(() => TopSellingProductSchema.parse(invalidData)).toThrow();
    });
  });

  describe("CategorySalesSchema", () => {
    it("should validate valid category sales data", () => {
      const validData = {
        categoryId: "cat_123",
        category: "STEM Toys",
        amount: 12500.99,
        percentage: 35.2,
      };

      expect(() => CategorySalesSchema.parse(validData)).not.toThrow();
      const result = CategorySalesSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject percentages over 100", () => {
      const invalidData = {
        categoryId: "cat_123",
        category: "STEM Toys",
        amount: 12500.99,
        percentage: 150.5, // Invalid - over 100%
      };

      expect(() => CategorySalesSchema.parse(invalidData)).toThrow();
    });
  });

  describe("SalesByDaySchema", () => {
    it("should validate valid daily sales data", () => {
      const validData = {
        date: "2024-01-15",
        sales: 1250.99,
      };

      expect(() => SalesByDaySchema.parse(validData)).not.toThrow();
      const result = SalesByDaySchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject invalid date formats", () => {
      const invalidData = {
        date: "01/15/2024", // Invalid format - should be YYYY-MM-DD
        sales: 1250.99,
      };

      expect(() => SalesByDaySchema.parse(invalidData)).toThrow();
    });
  });

  describe("AnalyticsDataSchema", () => {
    it("should validate complete analytics data", () => {
      const validData = {
        salesData: {
          daily: 1500.5,
          weekly: 10500.75,
          monthly: 42000.25,
          previousPeriodChange: 12.5,
          trending: "up",
        },
        orderStats: {
          conversionRate: {
            rate: 3.2,
            previousPeriodChange: -0.5,
            trending: "down",
          },
          averageOrderValue: {
            value: 125.99,
            previousPeriodChange: 8.3,
            trending: "up",
          },
          totalCustomers: {
            value: 1250,
            previousPeriodChange: 15.7,
            trending: "up",
          },
        },
        topSellingProducts: [
          {
            name: "STEM Robot Kit",
            price: 89.99,
            sold: 45,
            revenue: 4049.55,
          },
        ],
        salesByCategory: [
          {
            categoryId: "cat_123",
            category: "STEM Toys",
            amount: 12500.99,
            percentage: 35.2,
          },
        ],
        salesChartData: {
          salesData: [
            {
              date: "2024-01-15",
              sales: 1250.99,
            },
          ],
        },
      };

      expect(() => AnalyticsDataSchema.parse(validData)).not.toThrow();
      const result = AnalyticsDataSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe("AnalyticsRequestSchema", () => {
    it("should validate valid request parameters", () => {
      const validRequest = { period: "30" };
      expect(() => AnalyticsRequestSchema.parse(validRequest)).not.toThrow();

      const result = AnalyticsRequestSchema.parse(validRequest);
      expect(result.period).toBe(30);
    });

    it("should reject invalid period values", () => {
      const invalidRequests = [
        { period: "0" }, // Too small
        { period: "400" }, // Too large
        { period: "not-a-number" }, // Not numeric
        { period: "" }, // Empty
      ];

      invalidRequests.forEach(request => {
        expect(() => AnalyticsRequestSchema.parse(request)).toThrow();
      });
    });
  });

  describe("Validation utility functions", () => {
    const validAnalyticsData = {
      salesData: {
        daily: 1500.5,
        weekly: 10500.75,
        monthly: 42000.25,
        previousPeriodChange: 12.5,
        trending: "up",
      },
      orderStats: {
        conversionRate: {
          rate: 3.2,
          previousPeriodChange: -0.5,
          trending: "down",
        },
        averageOrderValue: {
          value: 125.99,
          previousPeriodChange: 8.3,
          trending: "up",
        },
        totalCustomers: {
          value: 1250,
          previousPeriodChange: 15.7,
          trending: "up",
        },
      },
      topSellingProducts: [],
      salesByCategory: [],
      salesChartData: { salesData: [] },
    };

    describe("validateAnalyticsData", () => {
      it("should return validated data for valid input", () => {
        expect(() => validateAnalyticsData(validAnalyticsData)).not.toThrow();
        const result = validateAnalyticsData(validAnalyticsData);
        expect(result).toEqual(validAnalyticsData);
      });

      it("should throw error for invalid input", () => {
        const invalidData = {
          ...validAnalyticsData,
          salesData: { invalid: true },
        };
        expect(() => validateAnalyticsData(invalidData)).toThrow();
      });
    });

    describe("validateAnalyticsRequest", () => {
      it("should validate and transform valid requests", () => {
        const result = validateAnalyticsRequest({ period: "30" });
        expect(result.period).toBe(30);
      });

      it("should throw error for invalid requests", () => {
        expect(() => validateAnalyticsRequest({ period: "invalid" })).toThrow();
      });
    });

    describe("validateAnalyticsPeriod", () => {
      it("should validate valid periods", () => {
        expect(validateAnalyticsPeriod("7")).toBe(7);
        expect(validateAnalyticsPeriod("30")).toBe(30);
        expect(validateAnalyticsPeriod("90")).toBe(90);
      });

      it("should throw error for invalid periods", () => {
        expect(() => validateAnalyticsPeriod("invalid")).toThrow();
        expect(() => validateAnalyticsPeriod("100")).toThrow();
      });
    });

    describe("isValidAnalyticsData", () => {
      it("should return true for valid data", () => {
        expect(isValidAnalyticsData(validAnalyticsData)).toBe(true);
      });

      it("should return false for invalid data", () => {
        const invalidData = {
          ...validAnalyticsData,
          salesData: { invalid: true },
        };
        expect(isValidAnalyticsData(invalidData)).toBe(false);
      });
    });

    describe("safeParseAnalyticsData", () => {
      it("should return data for valid input", () => {
        const result = safeParseAnalyticsData(validAnalyticsData);
        expect(result).toEqual(validAnalyticsData);
      });

      it("should return null for invalid input", () => {
        const invalidData = { invalid: true };
        const result = safeParseAnalyticsData(invalidData);
        expect(result).toBeNull();
      });
    });

    describe("safeParseAnalyticsRequest", () => {
      it("should return parsed request for valid input", () => {
        const result = safeParseAnalyticsRequest({ period: "30" });
        expect(result?.period).toBe(30);
      });

      it("should return null for invalid input", () => {
        const result = safeParseAnalyticsRequest({ period: "invalid" });
        expect(result).toBeNull();
      });
    });
  });
});
