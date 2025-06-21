/**
 * Helper functions for API routes
 */

/**
 * Process form data from multipart/form-data requests
 * Handles conversion of strings to appropriate types for product data
 */
export async function handleFormData(
  formData: FormData
): Promise<Record<string, any>> {
  const processedData: Record<string, any> = {};

  // Extract all form fields
  for (const [key, value] of formData.entries()) {
    // Handle file uploads separately if needed
    if (value instanceof File) {
      // For this implementation, we assume file URLs are handled elsewhere
      // and passed as strings in the images array
      continue;
    }

    // Handle standard form fields
    processedData[key] = value;
  }

  // Handle any special fields like arrays that come as JSON strings
  if (processedData.images && typeof processedData.images === "string") {
    try {
      processedData.images = JSON.parse(processedData.images);
    } catch (e) {
      console.error("Error parsing images JSON:", e);
    }
  }

  if (processedData.tags && typeof processedData.tags === "string") {
    try {
      processedData.tags = JSON.parse(processedData.tags);
    } catch (e) {
      console.error("Error parsing tags JSON:", e);
    }
  }

  if (
    processedData.attributes &&
    typeof processedData.attributes === "string"
  ) {
    try {
      processedData.attributes = JSON.parse(processedData.attributes);
    } catch (e) {
      console.error("Error parsing attributes JSON:", e);
    }
  }

  return processedData;
}
