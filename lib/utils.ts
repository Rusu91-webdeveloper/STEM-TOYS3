import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge and deduplicate Tailwind CSS classes
 *
 * This function combines clsx for conditional class application with
 * tailwind-merge for intelligent class deduplication. It's essential
 * for component libraries where class conflicts might occur.
 *
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Merged and deduplicated class string
 *
 * @example
 * cn("px-4 py-2", "bg-blue-500", { "text-white": true })
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 *
 * @example
 * // Handles class conflicts intelligently
 * cn("p-4", "px-8") // Returns: "p-4 px-8" (px-8 overrides p-4's horizontal padding)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string using locale-specific formatting
 *
 * @param date - The date object to format
 * @param locale - Optional locale string (defaults to "en-US")
 * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date("2024-01-15"))
 * // Returns: "January 15, 2024"
 *
 * @example
 * formatDate(new Date("2024-01-15"), "ro-RO")
 * // Returns: "15 ianuarie 2024"
 */
export function formatDate(
  date: Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Convert a string to a URL-friendly slug
 *
 * This function creates SEO-friendly URLs by converting text to lowercase,
 * replacing spaces with hyphens, and removing special characters. Perfect
 * for product URLs, blog post slugs, and category paths.
 *
 * @param text - The input text to convert to a slug
 * @returns URL-friendly slug string
 *
 * @example
 * slugify("STEM Robot Kit for Kids!")
 * // Returns: "stem-robot-kit-for-kids"
 *
 * @example
 * slugify("Science & Technology")
 * // Returns: "science-and-technology"
 *
 * @example
 * slugify("  Multiple   spaces   ")
 * // Returns: "multiple-spaces"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Format currency values with proper localization
 *
 * @param amount - The numeric amount to format
 * @param currency - Currency code (ISO 4217, e.g., "RON", "USD", "EUR")
 * @param locale - Locale for formatting (defaults to "ro-RO" for Romanian market)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(29.99, "RON")
 * // Returns: "29,99 lei"
 *
 * @example
 * formatCurrency(29.99, "USD", "en-US")
 * // Returns: "$29.99"
 */
export function formatCurrency(
  amount: number,
  currency: string = "RON",
  locale: string = "ro-RO"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Capitalize the first letter of a string
 *
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 *
 * @example
 * capitalize("hello world")
 * // Returns: "Hello world"
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text to a specified length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append when truncated (defaults to "...")
 * @returns Truncated text with suffix if needed
 *
 * @example
 * truncateText("This is a very long product description", 20)
 * // Returns: "This is a very lo..."
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Debounce function to limit the rate of function execution
 *
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   // Perform search
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 *
 * @param value - The value to check
 * @returns True if the value is considered empty
 *
 * @example
 * isEmpty("") // Returns: true
 * isEmpty([]) // Returns: true
 * isEmpty({}) // Returns: true
 * isEmpty("hello") // Returns: false
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate a random string of specified length
 *
 * @param length - Length of the string to generate
 * @param charset - Character set to use (defaults to alphanumeric)
 * @returns Random string
 *
 * @example
 * generateRandomString(8)
 * // Returns: "aB3xY9zQ"
 */
export function generateRandomString(
  length: number,
  charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
