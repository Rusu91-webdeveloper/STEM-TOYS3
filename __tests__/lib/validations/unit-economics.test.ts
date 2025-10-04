import {
  CostBreakdownSchema,
  MarketingCostSchema,
  UnitEconomicsSchema,
  ProductProfitabilitySchema,
  UnitEconomicsSummarySchema,
  UnitEconomicsRequestSchema,
  CostUpdateRequestSchema,
} from "@/lib/validations/unit-economics";

describe("Unit Economics Validation Schemas", () => {
  describe("CostBreakdownSchema", () => {
    it("should validate valid cost breakdown", () => {
      const validData = {
        costPrice: 50.0,
        importDuties: 5.0,
        shippingCost: 3.0,
        storageCost: 2.0,
        packagingCost: 2.0,
        laborCost: 5.0,
        qualityControlCost: 1.0,
        paymentProcessingFee: 2.9,
        customerServiceCost: 2.0,
        operationalOverhead: 3.0,
      };

      const result = CostBreakdownSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should apply default values", () => {
      const minimalData = {
        costPrice: 50.0,
      };

      const result = CostBreakdownSchema.safeParse(minimalData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.importDuties).toBe(0);
        expect(result.data.shippingCost).toBe(0);
        expect(result.data.paymentProcessingFee).toBe(2.9);
      }
    });

    it("should reject negative values", () => {
      const invalidData = {
        costPrice: -10.0,
        importDuties: 5.0,
      };

      const result = CostBreakdownSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject payment processing fee over 100%", () => {
      const invalidData = {
        costPrice: 50.0,
        paymentProcessingFee: 101.0,
      };

      const result = CostBreakdownSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("MarketingCostSchema", () => {
    it("should validate valid marketing cost", () => {
      const validData = {
        googleAdsCost: 10.0,
        facebookAdsCost: 8.0,
        seoCost: 5.0,
        influencerCost: 15.0,
        totalMarketingCost: 38.0,
        notes: "Q4 marketing campaign",
      };

      const result = MarketingCostSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should apply default values", () => {
      const minimalData = {};

      const result = MarketingCostSchema.safeParse(minimalData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.googleAdsCost).toBe(0);
        expect(result.data.facebookAdsCost).toBe(0);
        expect(result.data.seoCost).toBe(0);
        expect(result.data.influencerCost).toBe(0);
        expect(result.data.totalMarketingCost).toBe(0);
      }
    });

    it("should reject negative values", () => {
      const invalidData = {
        googleAdsCost: -5.0,
      };

      const result = MarketingCostSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("UnitEconomicsSchema", () => {
    it("should validate complete unit economics data", () => {
      const validData = {
        productId: "prod_123",
        sellingPrice: 100.0,
        costs: {
          costPrice: 50.0,
          importDuties: 5.0,
          shippingCost: 3.0,
          storageCost: 2.0,
          packagingCost: 2.0,
          laborCost: 5.0,
          qualityControlCost: 1.0,
          paymentProcessingFee: 2.9,
          customerServiceCost: 2.0,
          operationalOverhead: 3.0,
        },
        marketingCosts: {
          googleAdsCost: 10.0,
          facebookAdsCost: 8.0,
          seoCost: 5.0,
          influencerCost: 15.0,
          totalMarketingCost: 38.0,
        },
        expectedMonthlySales: 100,
        calculatedAt: new Date(),
      };

      const result = UnitEconomicsSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject negative selling price", () => {
      const invalidData = {
        productId: "prod_123",
        sellingPrice: -100.0,
        costs: {},
        marketingCosts: {},
        expectedMonthlySales: 100,
      };

      const result = UnitEconomicsSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("ProductProfitabilitySchema", () => {
    it("should validate complete product profitability data", () => {
      const validData = {
        productId: "prod_123",
        name: "Test Product",
        category: "Electronics",
        sellingPrice: 100.0,
        costPrice: 50.0,
        totalCostPerSale: 75.0,
        netProfitPerSale: 25.0,
        profitMargin: 25.0,
        monthlySales: 100,
        monthlyRevenue: 10000.0,
        monthlyProfit: 2500.0,
        customerAcquisitionCost: 15.0,
        lifetimeValue: 75.0,
        ltvToCacRatio: 5.0,
        breakEvenPoint: 10,
        isProfitable: true,
        riskLevel: "LOW" as const,
      };

      const result = ProductProfitabilitySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should validate with optional costPrice", () => {
      const validData = {
        productId: "prod_123",
        name: "Test Product",
        sellingPrice: 100.0,
        totalCostPerSale: 75.0,
        netProfitPerSale: 25.0,
        profitMargin: 25.0,
        monthlySales: 100,
        monthlyRevenue: 10000.0,
        monthlyProfit: 2500.0,
        customerAcquisitionCost: 15.0,
        lifetimeValue: 75.0,
        ltvToCacRatio: 5.0,
        breakEvenPoint: 10,
        isProfitable: true,
        riskLevel: "LOW" as const,
      };

      const result = ProductProfitabilitySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("UnitEconomicsSummarySchema", () => {
    it("should validate complete summary data", () => {
      const validData = {
        totalProducts: 50,
        profitableProducts: 35,
        unprofitableProducts: 15,
        totalMonthlyRevenue: 100000.0,
        totalMonthlyCosts: 75000.0,
        totalMonthlyProfit: 25000.0,
        overallProfitMargin: 25.0,
        averageOrderValue: 150.0,
        averageCustomerAcquisitionCost: 25.0,
        averageLifetimeValue: 125.0,
        averageLtvToCacRatio: 5.0,
        mostProfitableProduct: {
          id: "prod_1",
          name: "Best Product",
          profitMargin: 45.0,
        },
        leastProfitableProduct: {
          id: "prod_2",
          name: "Worst Product",
          profitMargin: 5.0,
        },
        highestVolumeProduct: {
          id: "prod_3",
          name: "Popular Product",
          monthlySales: 500,
        },
        productsToDiscontinue: ["prod_2", "prod_4"],
      };

      const result = UnitEconomicsSummarySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should validate with optional fields", () => {
      const minimalData = {
        totalProducts: 0,
        profitableProducts: 0,
        unprofitableProducts: 0,
        totalMonthlyRevenue: 0.0,
        totalMonthlyCosts: 0.0,
        totalMonthlyProfit: 0.0,
        overallProfitMargin: 0.0,
        averageOrderValue: 0.0,
        averageCustomerAcquisitionCost: 0.0,
        averageLifetimeValue: 0.0,
        averageLtvToCacRatio: 0.0,
        productsToDiscontinue: [],
      };

      const result = UnitEconomicsSummarySchema.safeParse(minimalData);

      expect(result.success).toBe(true);
    });
  });

  describe("UnitEconomicsRequestSchema", () => {
    it("should validate valid request", () => {
      const validData = {
        timeRange: "30d",
        categoryId: "cat_123",
        supplierId: "supp_456",
        includeInactive: false,
      };

      const result = UnitEconomicsRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const minimalData = {};

      const result = UnitEconomicsRequestSchema.safeParse(minimalData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeRange).toBe("30d");
        expect(result.data.includeInactive).toBe(false);
      }
    });

    it("should reject invalid timeRange", () => {
      const invalidData = {
        timeRange: "invalid",
      };

      const result = UnitEconomicsRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("CostUpdateRequestSchema", () => {
    it("should validate valid cost update request", () => {
      const validData = {
        productId: "prod_123",
        costs: {
          costPrice: 50.0,
          importDuties: 5.0,
        },
        marketingCosts: {
          googleAdsCost: 10.0,
          facebookAdsCost: 8.0,
        },
      };

      const result = CostUpdateRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should validate with partial costs", () => {
      const validData = {
        productId: "prod_123",
        costs: {
          costPrice: 50.0,
        },
      };

      const result = CostUpdateRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject missing productId", () => {
      const invalidData = {
        costs: {
          costPrice: 50.0,
        },
      };

      const result = CostUpdateRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
