import {
  getShippingSettings,
  getFreeShippingThreshold,
  getFreeShippingStatus,
} from "./store-settings";

/**
 * Get the free shipping threshold from the database
 * @returns The free shipping threshold amount or null if not configured
 */
export { getFreeShippingThreshold };

/**
 * Get all shipping settings from the database
 * @returns The complete shipping settings object
 */
export { getShippingSettings };

/**
 * Check if free shipping is active and get the threshold
 * @returns Object with isActive and threshold properties
 */
export { getFreeShippingStatus };
