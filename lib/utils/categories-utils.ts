/**
 * Utility functions for working with categories
 */

/**
 * Checks if any categories exist in the system
 * @returns Promise resolving to true if categories exist, false otherwise
 */
export async function checkCategoriesExist(): Promise<boolean> {
  try {
    const response = await fetch("/api/categories");
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const categories = await response.json();
    return Array.isArray(categories) && categories.length > 0;
  } catch (error) {
    console.error("Error checking if categories exist:", error);
    return false;
  }
}

/**
 * Default categories to create if none exist
 */
const defaultCategories = [
  {
    name: "Science Toys",
    slug: "science-toys",
    description:
      "Educational toys focused on scientific principles and experiments.",
    isActive: true,
  },
  {
    name: "Technology Toys",
    slug: "technology-toys",
    description:
      "Toys that help children learn about technology, coding, and electronics.",
    isActive: true,
  },
  {
    name: "Engineering Toys",
    slug: "engineering-toys",
    description:
      "Construction sets and building toys that teach engineering concepts.",
    isActive: true,
  },
  {
    name: "Math Toys",
    slug: "math-toys",
    description: "Toys that make learning math fun and engaging.",
    isActive: true,
  },
];

/**
 * Creates default categories if none exist
 * @returns Promise resolving to the created categories or null if there was an error
 */
export async function createDefaultCategories(): Promise<any[] | null> {
  try {
    const categoriesExist = await checkCategoriesExist();
    if (categoriesExist) {
      console.log("Categories already exist, skipping creation of defaults");
      return null;
    }

    console.log("No categories found, creating defaults...");

    const createdCategories = [];

    // Create each default category
    for (const category of defaultCategories) {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create category ${category.name}: ${response.statusText}`
        );
      }

      const createdCategory = await response.json();
      createdCategories.push(createdCategory);
      console.log(`Created category: ${category.name}`);
    }

    return createdCategories;
  } catch (error) {
    console.error("Error creating default categories:", error);
    return null;
  }
}
