/**
 * Tests for Kidstory age range to AgeGroup mapping
 */

import { mapAgeRangeToAgeGroup, explainAgeGroupMapping } from "../../lib/suppliers/kidstory/age-mapper";

describe("mapAgeRangeToAgeGroup", () => {
  describe("single age ranges", () => {
    it("maps 0-2 years to TODDLERS_1_3", () => {
      expect(mapAgeRangeToAgeGroup("0-2 ani")).toBe("TODDLERS_1_3");
      expect(mapAgeRangeToAgeGroup("1-2 ani")).toBe("TODDLERS_1_3");
      expect(mapAgeRangeToAgeGroup("2 ani")).toBe("TODDLERS_1_3");
    });

    it("maps 3-5 years to PRESCHOOL_3_5", () => {
      expect(mapAgeRangeToAgeGroup("3-5 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("3 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("4-5 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("5 ani")).toBe("PRESCHOOL_3_5");
    });

    it("maps 6-8 years to ELEMENTARY_6_8", () => {
      expect(mapAgeRangeToAgeGroup("6-8 ani")).toBe("ELEMENTARY_6_8");
      expect(mapAgeRangeToAgeGroup("6 ani")).toBe("ELEMENTARY_6_8");
      expect(mapAgeRangeToAgeGroup("7-8 ani")).toBe("ELEMENTARY_6_8");
      expect(mapAgeRangeToAgeGroup("8 ani")).toBe("ELEMENTARY_6_8");
    });

    it("maps 9-12 years to MIDDLE_SCHOOL_9_12", () => {
      expect(mapAgeRangeToAgeGroup("9-12 ani")).toBe("MIDDLE_SCHOOL_9_12");
      expect(mapAgeRangeToAgeGroup("9 ani")).toBe("MIDDLE_SCHOOL_9_12");
      expect(mapAgeRangeToAgeGroup("10-12 ani")).toBe("MIDDLE_SCHOOL_9_12");
      expect(mapAgeRangeToAgeGroup("12 ani")).toBe("MIDDLE_SCHOOL_9_12");
    });

    it("maps 13+ years to TEENS_13_PLUS", () => {
      expect(mapAgeRangeToAgeGroup("13 ani+")).toBe("TEENS_13_PLUS");
      expect(mapAgeRangeToAgeGroup("13+")).toBe("TEENS_13_PLUS");
      expect(mapAgeRangeToAgeGroup("14 ani")).toBe("TEENS_13_PLUS");
      expect(mapAgeRangeToAgeGroup("15+ ani")).toBe("TEENS_13_PLUS");
    });
  });

  describe("multi-range products", () => {
    it("selects youngest band for products spanning multiple ranges", () => {
      // 3-5 and 5-7: youngest is 3, maps to PRESCHOOL_3_5
      expect(mapAgeRangeToAgeGroup("3-5 ani, 5-7 ani")).toBe("PRESCHOOL_3_5");
      
      // 5-7 and 7-10: youngest is 5, maps to PRESCHOOL_3_5
      expect(mapAgeRangeToAgeGroup("5-7 ani, 7-10 ani")).toBe("PRESCHOOL_3_5");
      
      // 7-10 and 10+: youngest is 7, maps to ELEMENTARY_6_8
      expect(mapAgeRangeToAgeGroup("7-10 ani, 10 ani+")).toBe("ELEMENTARY_6_8");
    });

    it("handles semicolon separators", () => {
      expect(mapAgeRangeToAgeGroup("3-5 ani; 5-7 ani")).toBe("PRESCHOOL_3_5");
    });

    it("handles ranges without spaces", () => {
      expect(mapAgeRangeToAgeGroup("3-5ani,5-7ani")).toBe("PRESCHOOL_3_5");
    });
  });

  describe("edge cases", () => {
    it("handles null or undefined input", () => {
      expect(mapAgeRangeToAgeGroup(null)).toBe(null);
      expect(mapAgeRangeToAgeGroup(undefined)).toBe(null);
      expect(mapAgeRangeToAgeGroup("")).toBe(null);
    });

    it("handles malformed age ranges", () => {
      expect(mapAgeRangeToAgeGroup("invalid")).toBe(null);
      expect(mapAgeRangeToAgeGroup("xyz")).toBe(null);
      expect(mapAgeRangeToAgeGroup("ani")).toBe(null);
    });

    it("handles whitespace variations", () => {
      expect(mapAgeRangeToAgeGroup("  3-5 ani  ")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("3 - 5 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("3– 5 ani")).toBe("PRESCHOOL_3_5"); // en dash
    });

    it("handles Romanian variations", () => {
      expect(mapAgeRangeToAgeGroup("3-5 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("3-5ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("3-5 ANI")).toBe("PRESCHOOL_3_5");
    });
  });

  describe("boundary conditions", () => {
    it("correctly handles boundary ages", () => {
      // Age 3 is the lower bound of PRESCHOOL_3_5
      expect(mapAgeRangeToAgeGroup("3 ani")).toBe("PRESCHOOL_3_5");
      
      // Age 6 is the lower bound of ELEMENTARY_6_8
      expect(mapAgeRangeToAgeGroup("6 ani")).toBe("ELEMENTARY_6_8");
      
      // Age 9 is the lower bound of MIDDLE_SCHOOL_9_12
      expect(mapAgeRangeToAgeGroup("9 ani")).toBe("MIDDLE_SCHOOL_9_12");
      
      // Age 13 is the lower bound of TEENS_13_PLUS
      expect(mapAgeRangeToAgeGroup("13 ani")).toBe("TEENS_13_PLUS");
    });
  });

  describe("real Kidstory examples from production", () => {
    it("handles actual Kidstory age range formats", () => {
      // Based on user's examples
      expect(mapAgeRangeToAgeGroup("3-5 ani, 5-7 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("7-10 ani, 10 ani+")).toBe("ELEMENTARY_6_8");
      expect(mapAgeRangeToAgeGroup("5-7 ani")).toBe("PRESCHOOL_3_5");
      expect(mapAgeRangeToAgeGroup("8-10 ani")).toBe("ELEMENTARY_6_8");
    });
  });
});

describe("explainAgeGroupMapping", () => {
  it("provides clear explanations for valid mappings", () => {
    const result = explainAgeGroupMapping("3-5 ani", "PRESCHOOL_3_5");
    expect(result).toContain("3-5 ani");
    expect(result).toContain("PRESCHOOL_3_5");
    expect(result).toContain("min age");
  });

  it("explains when no age range is provided", () => {
    const result = explainAgeGroupMapping(null, null);
    expect(result).toBe("No age range provided");
  });

  it("explains when age range cannot be parsed", () => {
    const result = explainAgeGroupMapping("invalid", null);
    expect(result).toContain("Unable to parse");
    expect(result).toContain("invalid");
  });
});
