const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const sharedProjectConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/features/(.*)$": "<rootDir>/features/$1",
    "^@/hooks/(.*)$": "<rootDir>/hooks/$1",
    "^@/types/(.*)$": "<rootDir>/types/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", { presets: ["next/babel"] }],
  },
};

const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test environment - use different environments based on test location
  projects: [
    {
      displayName: "node",
      testEnvironment: "jest-environment-node",
      ...sharedProjectConfig,
      testPathIgnorePatterns: [
        "<rootDir>/__tests__/features/",
        "<rootDir>/__tests__/components/",
        "<rootDir>/__tests__/app/",
      ],
    },
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      ...sharedProjectConfig,
      testMatch: [
        "**/__tests__/features/**/*.test.(ts|tsx)",
        "**/__tests__/components/**/*.test.(ts|tsx)",
        "**/__tests__/app/**/*.test.(ts|tsx)",
      ],
    },
  ],

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js|jsx)",
    "**/*.(test|spec).(ts|tsx|js|jsx)",
  ],

  // Let Next.js handle transformations
  // transform: {},

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Coverage configuration
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!jest.setup.js",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/dist/",
    "<rootDir>/e2e/", // Exclude Playwright E2E tests from Jest
    "<rootDir>/playwright-report/",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
