import { getRequiredEnvVar, getOptionalEnvVar } from "../env";

describe("Environment variable utilities", () => {
  // Store original environment and process.env.NODE_ENV
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  // Setup and teardown
  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };

    // Spy on console.warn and console.error
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;

    // Restore console functions
    jest.restoreAllMocks();
  });

  describe("getRequiredEnvVar", () => {
    it("should return the environment variable when it exists", () => {
      // Arrange
      process.env.TEST_VAR = "test-value";

      // Act
      const result = getRequiredEnvVar("TEST_VAR");

      // Assert
      expect(result).toBe("test-value");
    });

    it("should throw an error when the variable doesn't exist", () => {
      // Act & Assert
      expect(() => getRequiredEnvVar("NONEXISTENT_VAR")).toThrow(
        "Required environment variable NONEXISTENT_VAR is not set"
      );
    });

    it("should use a custom error message when provided", () => {
      // Act & Assert
      expect(() =>
        getRequiredEnvVar("NONEXISTENT_VAR", "Custom error message")
      ).toThrow("Custom error message");
    });

    it("should return a placeholder in development mode when isDevelopmentOnly is true", () => {
      // Arrange
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        configurable: true,
      });
      delete process.env.TEST_VAR;

      // Act
      const result = getRequiredEnvVar("TEST_VAR", undefined, true);

      // Assert
      expect(result).toMatch(/^dev-placeholder-TEST_VAR-\d+$/);
      expect(console.warn).toHaveBeenCalledWith(
        "WARNING: Using development placeholder for TEST_VAR. This would throw an error in production."
      );
    });

    it("should still throw in production even when isDevelopmentOnly is true", () => {
      // Arrange
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        configurable: true,
      });
      delete process.env.TEST_VAR;

      // Act & Assert
      expect(() => getRequiredEnvVar("TEST_VAR", undefined, true)).toThrow();
    });
  });

  describe("getOptionalEnvVar", () => {
    it("should return the environment variable when it exists", () => {
      // Arrange
      process.env.TEST_VAR = "test-value";

      // Act
      const result = getOptionalEnvVar("TEST_VAR");

      // Assert
      expect(result).toBe("test-value");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should return undefined and log a warning when the variable doesn't exist", () => {
      // Act
      const result = getOptionalEnvVar("NONEXISTENT_VAR");

      // Assert
      expect(result).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith(
        "Optional environment variable NONEXISTENT_VAR is not set."
      );
    });

    it("should use a custom warning message when provided", () => {
      // Act
      getOptionalEnvVar("NONEXISTENT_VAR", "Custom warning message");

      // Assert
      expect(console.warn).toHaveBeenCalledWith("Custom warning message");
    });
  });
});
