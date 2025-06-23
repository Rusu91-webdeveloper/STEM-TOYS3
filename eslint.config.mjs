// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // Disable ESLint rules that conflict with Prettier
  ...compat.extends("prettier"),
  {
    ignores: [
      "node_modules/**/*",
      ".next/**/*",
      "app/generated/**/*", // Ignore generated Prisma files
      "out/**/*",
      "public/**/*",
      "coverage/**/*",
      "playwright-report/**/*",
      "test-results/**/*",
      "dist/**/*",
      "build/**/*",
      "*.config.js",
      "*.config.mjs",
      "scripts/**/*", // Ignore utility scripts
      "stories/**/*", // Ignore Storybook files temporarily
      "lib/bundle-analyzer.ts", // Ignore complex files temporarily
      "lib/auth/session-optimizer.ts",
      "lib/backup/database-backup.ts",
      "lib/monitoring/critical-alerts.ts",
      "lib/services/analytics-service.ts",
      "lib/services/content-versioning.ts",
      "middleware.ts", // Ignore middleware temporarily
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
  },
  {
    // JavaScript files - no TypeScript-specific rules
    files: ["**/*.{js,jsx}"],
    rules: {
      // === Strict Code Quality Rules ===

      // Prevent common errors
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // Variable and function rules
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-undef": "error",

      // === React specific rules ===
      "react/prop-types": "off", // Using TypeScript instead
      "react/react-in-jsx-scope": "off", // Not needed with Next.js
      "react/no-unescaped-entities": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "off", // Not needed with React 17+
      "react/jsx-uses-vars": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-string-refs": "error",
      "react/require-render-return": "error",

      // === React Hooks rules ===
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === Next.js specific rules ===
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-page-custom-font": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-title-in-document-head": "error",

      // === Code style and best practices ===
      "prefer-template": "error",
      "object-shorthand": "error",
      "no-useless-concat": "error",
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],

      // === Import rules ===
      "import/no-duplicates": "error",
      "import/no-unused-modules": "warn",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // === Security rules ===
      "no-restricted-globals": [
        "error",
        {
          name: "event",
          message: "Use local parameter instead.",
        },
      ],

      // === Accessibility rules ===
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-distracting-elements": "error",

      // === Performance rules ===
      "no-new-object": "error",
      "no-array-constructor": "error",
      "prefer-spread": "error",

      // === Consistency rules ===
      "consistent-return": "warn", // Downgraded from error
      "default-case": "warn", // Downgraded from error
      eqeqeq: ["error", "always"],
      "no-else-return": "error",
      "no-return-assign": "error",
      "no-return-await": "warn", // Downgraded from error
      "require-await": "warn", // Downgraded from error
    },
  },
  {
    // TypeScript files - includes TypeScript-specific rules
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // === Strict Code Quality Rules ===

      // Prevent common errors
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // Variable and function rules - use TypeScript versions
      "no-unused-vars": "off", // Turn off base rule in favor of TypeScript version
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-undef": "off", // TypeScript handles this

      // === TypeScript specific rules ===
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn", // Downgraded from error
      "@typescript-eslint/prefer-optional-chain": "warn", // Downgraded from error

      // === React specific rules ===
      "react/prop-types": "off", // Using TypeScript instead
      "react/react-in-jsx-scope": "off", // Not needed with Next.js
      "react/no-unescaped-entities": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "off", // Not needed with React 17+
      "react/jsx-uses-vars": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-string-refs": "error",
      "react/require-render-return": "error",

      // === React Hooks rules ===
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === Next.js specific rules ===
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",
      "@next/next/no-page-custom-font": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-title-in-document-head": "error",

      // === Code style and best practices ===
      "prefer-template": "error",
      "object-shorthand": "error",
      "no-useless-concat": "error",
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],

      // === Import rules ===
      "import/no-duplicates": "error",
      "import/no-unused-modules": "warn",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // === Security rules ===
      "no-restricted-globals": [
        "error",
        {
          name: "event",
          message: "Use local parameter instead.",
        },
      ],

      // === Accessibility rules ===
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-distracting-elements": "error",

      // === Performance rules ===
      "no-new-object": "error",
      "no-array-constructor": "error",
      "prefer-spread": "error",

      // === Consistency rules ===
      "consistent-return": "error",
      "default-case": "error",
      eqeqeq: ["error", "always"],
      "no-else-return": "error",
      "no-return-assign": "error",
      "no-return-await": "error",
      "require-await": "error",
    },
  },
  {
    // Test files have more relaxed rules
    files: [
      "**/*.{test,spec}.{js,jsx,ts,tsx}",
      "**/__tests__/**/*",
      "**/e2e/**/*",
      "jest.setup.js",
      "jest.config.js",
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly", // for Vitest
        vitest: "readonly", // for Vitest
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "jsx-a11y/no-autofocus": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;
