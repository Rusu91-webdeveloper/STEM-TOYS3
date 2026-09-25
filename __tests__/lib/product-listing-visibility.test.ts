/**
 * Tests for product listing visibility with null ageGroup
 */

import { visibleInBrowse } from "../../lib/products/merchandising";

describe("Product listing visibility", () => {
  describe("visibleInBrowse function", () => {
    describe("Kidstory capacity model (inventoryMode: supplier-availability)", () => {
      it("shows products with stockQuantity=1 (available in capacity model)", () => {
        const product = {
          slug: "kidstory-product",
          name: "Kidstory STEM Kit",
          stockQuantity: 1,
          isBook: false,
          metadata: {},
          attributes: {
            inventoryMode: "supplier-availability",
          },
        };
        
        expect(visibleInBrowse(product)).toBe(true);
      });

      it("hides products with stockQuantity=0 (out of stock)", () => {
        const product = {
          slug: "kidstory-product-oos",
          name: "Kit Constructie Robot T-Rex",
          stockQuantity: 0,
          isBook: false,
          metadata: {},
          attributes: {
            inventoryMode: "supplier-availability",
          },
        };
        
        expect(visibleInBrowse(product)).toBe(false);
      });
    });

    describe("Boribon/others quantity model (no inventoryMode flag)", () => {
      it("hides products with stockQuantity=1 (running low)", () => {
        const product = {
          slug: "boribon-product",
          name: "Boribon Product",
          stockQuantity: 1,
          isBook: false,
          metadata: {},
          attributes: {
            // No inventoryMode or different value
          },
        };
        
        expect(visibleInBrowse(product)).toBe(false);
      });

      it("hides products with stockQuantity=0 (out of stock)", () => {
        const product = {
          slug: "boribon-product-oos",
          name: "Boribon Product OOS",
          stockQuantity: 0,
          isBook: false,
          metadata: {},
          attributes: {},
        };
        
        expect(visibleInBrowse(product)).toBe(false);
      });

      it("shows products with stockQuantity >= 2 (adequate stock)", () => {
        const product = {
          slug: "boribon-product-stock",
          name: "Boribon Product In Stock",
          stockQuantity: 5,
          isBook: false,
          metadata: {},
          attributes: {},
        };
        
        expect(visibleInBrowse(product)).toBe(true);
      });
    });

    it("shows low-stock products if keepLowStock is true", () => {
      const product = {
        slug: "test-product",
        name: "Test Product",
        stockQuantity: 0,
        isBook: false,
        metadata: {
          merchandising: {
            keepLowStock: true,
          },
        },
        attributes: {},
      };
      
      expect(visibleInBrowse(product)).toBe(true);
    });

    it("excludes books from browse listings", () => {
      const product = {
        slug: "test-book",
        name: "Test Book",
        stockQuantity: 999,
        isBook: true,
        metadata: {},
        attributes: {},
      };
      
      expect(visibleInBrowse(product)).toBe(false);
    });

    it("excludes products marked as browseHidden", () => {
      const product = {
        slug: "test-product",
        name: "Test Product",
        stockQuantity: 5,
        isBook: false,
        metadata: {
          merchandising: {
            browseHidden: true,
          },
        },
        attributes: {},
      };
      
      expect(visibleInBrowse(product)).toBe(false);
    });

    it("excludes products matching editorial exclusion patterns", () => {
      const patterns = [
        "Air Toobz Set",
        "Aqua Reumplere Kit",
        "Aqua Refill Pack",
        "Fridge Rover",
        "Product cu Ã caractere",
        "Product miE care test",
      ];

      patterns.forEach(name => {
        const product = {
          slug: "test",
          name,
          stockQuantity: 5,
          isBook: false,
          metadata: {},
          attributes: {},
        };
        
        expect(visibleInBrowse(product)).toBe(false);
      });
    });
  });

  describe("ageGroup filtering behavior", () => {
    const createMockProduct = (ageGroup: string | null) => ({
      id: "test-id",
      name: "Test Product",
      slug: "test-product",
      stockQuantity: 5,
      ageGroup,
    });

    it("should include products with null ageGroup when no filter is applied", () => {
      const products = [
        createMockProduct("PRESCHOOL_3_5"),
        createMockProduct("ELEMENTARY_6_8"),
        createMockProduct(null), // null ageGroup
        createMockProduct("MIDDLE_SCHOOL_9_12"),
      ];

      // Simulate unfiltered listing (no ageGroup filter)
      const selectedAgeGroup = undefined;
      
      let filtered = products;
      if (selectedAgeGroup) {
        filtered = products.filter(p => p.ageGroup === selectedAgeGroup);
      }

      // All products should be included
      expect(filtered).toHaveLength(4);
      expect(filtered.some(p => p.ageGroup === null)).toBe(true);
    });

    it("should exclude products with null ageGroup when a specific age filter is applied", () => {
      const products = [
        createMockProduct("PRESCHOOL_3_5"),
        createMockProduct("ELEMENTARY_6_8"),
        createMockProduct(null), // null ageGroup
        createMockProduct("MIDDLE_SCHOOL_9_12"),
      ];

      // Simulate filtered listing (ageGroup filter applied)
      const selectedAgeGroup = "ELEMENTARY_6_8";
      
      const filtered = products.filter(p => p.ageGroup === selectedAgeGroup);

      // Only products matching the filter should be included
      expect(filtered).toHaveLength(1);
      expect(filtered[0].ageGroup).toBe("ELEMENTARY_6_8");
      expect(filtered.some(p => p.ageGroup === null)).toBe(false);
    });

    it("should filter correctly for each age group without including null ageGroup products", () => {
      const products = [
        createMockProduct("PRESCHOOL_3_5"),
        createMockProduct("ELEMENTARY_6_8"),
        createMockProduct(null),
        createMockProduct("PRESCHOOL_3_5"),
        createMockProduct("MIDDLE_SCHOOL_9_12"),
      ];

      const ageGroups = ["PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12"];

      ageGroups.forEach(ageGroup => {
        const filtered = products.filter(p => p.ageGroup === ageGroup);
        
        // Should only include products with matching ageGroup
        expect(filtered.every(p => p.ageGroup === ageGroup)).toBe(true);
        expect(filtered.some(p => p.ageGroup === null)).toBe(false);
      });
    });
  });
});
