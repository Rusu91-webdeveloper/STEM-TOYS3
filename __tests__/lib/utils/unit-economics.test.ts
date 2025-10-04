import {
  calculateTotalCostPerSale,
  calculateProfitMargin,
  calculateNetProfitPerSale,
  calculateLtvToCacRatio,
  calculateBreakEvenPoint,
  determineRiskLevel,
  calculateCustomerAcquisitionCost,
  calculateCustomerLifetimeValue,
  getDateRange,
} from "@/lib/utils/unit-economics";
import { CostBreakdown, MarketingCost } from "@/lib/validations/unit-economics";

describe("Unit Economics Utilities", () => {
  describe("calculateTotalCostPerSale", () => {
    it("should calculate total cost per sale correctly", () => {
      const sellingPrice = 100;
      const costs: CostBreakdown = {
        costPrice: 50,
        importDuties: 5,
        shippingCost: 3,
        storageCost: 2,
        packagingCost: 2,
        laborCost: 5,
        qualityControlCost: 1,
        paymentProcessingFee: 2.9,
        customerServiceCost: 2,
        operationalOverhead: 3,
      };
      const marketingCosts: MarketingCost = {
        googleAdsCost: 5,
        facebookAdsCost: 3,
        seoCost: 2,
        influencerCost: 1,
        totalMarketingCost: 11,
      };

      const result = calculateTotalCostPerSale(
        sellingPrice,
        costs,
        marketingCosts
      );

      // Expected: 50 + 5 + 3 + 2 + 2 + 5 + 1 + (100 * 0.029) + 2 + 3 + 11 = 87.9
      expect(result).toBeCloseTo(87.9, 2);
    });

    it("should handle missing costPrice", () => {
      const sellingPrice = 100;
      const costs: CostBreakdown = {
        importDuties: 5,
        shippingCost: 3,
        storageCost: 2,
        packagingCost: 2,
        laborCost: 5,
        qualityControlCost: 1,
        paymentProcessingFee: 2.9,
        customerServiceCost: 2,
        operationalOverhead: 3,
      };
      const marketingCosts: MarketingCost = {
        totalMarketingCost: 10,
      };

      const result = calculateTotalCostPerSale(
        sellingPrice,
        costs,
        marketingCosts
      );

      // Expected: 0 + 5 + 3 + 2 + 2 + 5 + 1 + (100 * 0.029) + 2 + 3 + 10 = 37.9
      expect(result).toBeCloseTo(37.9, 2);
    });

    it("should use totalMarketingCost when provided", () => {
      const sellingPrice = 100;
      const costs: CostBreakdown = {
        costPrice: 50,
      };
      const marketingCosts: MarketingCost = {
        googleAdsCost: 5,
        facebookAdsCost: 3,
        seoCost: 2,
        influencerCost: 1,
        totalMarketingCost: 15, // Should use this instead of sum of individual costs
      };

      const result = calculateTotalCostPerSale(
        sellingPrice,
        costs,
        marketingCosts
      );

      // Expected: 50 + (100 * 0.029) + 15 = 67.9
      expect(result).toBeCloseTo(67.9, 2);
    });
  });

  describe("calculateProfitMargin", () => {
    it("should calculate profit margin correctly", () => {
      const sellingPrice = 100;
      const totalCost = 70;

      const result = calculateProfitMargin(sellingPrice, totalCost);

      expect(result).toBe(30); // 30%
    });

    it("should handle zero selling price", () => {
      const sellingPrice = 0;
      const totalCost = 70;

      const result = calculateProfitMargin(sellingPrice, totalCost);

      expect(result).toBe(0);
    });

    it("should handle negative profit", () => {
      const sellingPrice = 50;
      const totalCost = 70;

      const result = calculateProfitMargin(sellingPrice, totalCost);

      expect(result).toBe(-40); // -40%
    });
  });

  describe("calculateNetProfitPerSale", () => {
    it("should calculate net profit correctly", () => {
      const sellingPrice = 100;
      const totalCost = 70;

      const result = calculateNetProfitPerSale(sellingPrice, totalCost);

      expect(result).toBe(30);
    });

    it("should handle negative profit", () => {
      const sellingPrice = 50;
      const totalCost = 70;

      const result = calculateNetProfitPerSale(sellingPrice, totalCost);

      expect(result).toBe(-20);
    });
  });

  describe("calculateLtvToCacRatio", () => {
    it("should calculate LTV to CAC ratio correctly", () => {
      const lifetimeValue = 300;
      const acquisitionCost = 50;

      const result = calculateLtvToCacRatio(lifetimeValue, acquisitionCost);

      expect(result).toBe(6);
    });

    it("should handle zero acquisition cost", () => {
      const lifetimeValue = 300;
      const acquisitionCost = 0;

      const result = calculateLtvToCacRatio(lifetimeValue, acquisitionCost);

      expect(result).toBe(0);
    });
  });

  describe("calculateBreakEvenPoint", () => {
    it("should calculate break-even point correctly", () => {
      const fixedCosts = 1000;
      const profitPerUnit = 50;

      const result = calculateBreakEvenPoint(fixedCosts, profitPerUnit);

      expect(result).toBe(20);
    });

    it("should handle zero profit per unit", () => {
      const fixedCosts = 1000;
      const profitPerUnit = 0;

      const result = calculateBreakEvenPoint(fixedCosts, profitPerUnit);

      expect(result).toBe(Infinity);
    });

    it("should handle negative profit per unit", () => {
      const fixedCosts = 1000;
      const profitPerUnit = -10;

      const result = calculateBreakEvenPoint(fixedCosts, profitPerUnit);

      expect(result).toBe(Infinity);
    });
  });

  describe("determineRiskLevel", () => {
    it("should determine low risk correctly", () => {
      const profitMargin = 25;
      const ltvToCacRatio = 4;

      const result = determineRiskLevel(profitMargin, ltvToCacRatio);

      expect(result).toBe("LOW");
    });

    it("should determine medium risk correctly", () => {
      const profitMargin = 15;
      const ltvToCacRatio = 2.5;

      const result = determineRiskLevel(profitMargin, ltvToCacRatio);

      expect(result).toBe("MEDIUM");
    });

    it("should determine high risk correctly", () => {
      const profitMargin = 5;
      const ltvToCacRatio = 1;

      const result = determineRiskLevel(profitMargin, ltvToCacRatio);

      expect(result).toBe("HIGH");
    });

    it("should handle edge cases", () => {
      expect(determineRiskLevel(20, 3)).toBe("LOW");
      expect(determineRiskLevel(20, 2)).toBe("MEDIUM");
      expect(determineRiskLevel(10, 3)).toBe("MEDIUM");
      expect(determineRiskLevel(10, 2)).toBe("MEDIUM");
    });
  });

  describe("calculateCustomerAcquisitionCost", () => {
    it("should calculate CAC correctly", () => {
      const totalMarketingCost = 500;
      const totalSales = 10;

      const result = calculateCustomerAcquisitionCost(
        totalMarketingCost,
        totalSales
      );

      expect(result).toBe(50);
    });

    it("should handle zero sales", () => {
      const totalMarketingCost = 500;
      const totalSales = 0;

      const result = calculateCustomerAcquisitionCost(
        totalMarketingCost,
        totalSales
      );

      expect(result).toBe(0);
    });
  });

  describe("calculateCustomerLifetimeValue", () => {
    it("should calculate LTV correctly", () => {
      const averageOrderValue = 100;
      const averageOrdersPerCustomer = 3;
      const profitMargin = 25;

      const result = calculateCustomerLifetimeValue(
        averageOrderValue,
        averageOrdersPerCustomer,
        profitMargin
      );

      expect(result).toBe(75); // 100 * 3 * 0.25
    });
  });

  describe("getDateRange", () => {
    it("should calculate 7d range correctly", () => {
      const result = getDateRange("7d");

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.endDate.getTime()).toBeGreaterThan(
        result.startDate.getTime()
      );

      // Check that the difference is approximately 7 days
      const diffInDays =
        (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeCloseTo(7, 0);
    });

    it("should calculate 30d range correctly", () => {
      const result = getDateRange("30d");

      const diffInDays =
        (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeCloseTo(30, 0);
    });

    it("should calculate 90d range correctly", () => {
      const result = getDateRange("90d");

      const diffInDays =
        (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeCloseTo(90, 0);
    });

    it("should calculate 1y range correctly", () => {
      const result = getDateRange("1y");

      const diffInDays =
        (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeCloseTo(365, 0);
    });

    it("should default to 30d for invalid input", () => {
      const result = getDateRange("invalid" as any);

      const diffInDays =
        (result.endDate.getTime() - result.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeCloseTo(30, 0);
    });
  });
});
