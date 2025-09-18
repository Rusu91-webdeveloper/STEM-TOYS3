import { invalidateCache } from "@/lib/cache";

// This script will clear any cached product data
async function clearProductsCache() {
  try {
    console.log("Attempting to clear products cache...");

    // Clear both specific product caches and product list caches
    await invalidateCache("products:");

    console.log("Successfully cleared products cache.");
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

// Run the function
clearProductsCache().catch(console.error);
