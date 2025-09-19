// Test normalizeCategory function
function normalizeCategory(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  const lower = name.toLowerCase().trim();

  // Handle educational books variations
  if (
    lower === "educational-books" ||
    lower === "educational books" ||
    lower === "books" ||
    lower === "carti" ||
    lower === "carti educationale" ||
    lower.includes("book") ||
    lower.includes("carte")
  ) {
    return "educational-books";
  }

  // Handle engineering variations
  if (lower === "inginerie" || lower.includes("engineer")) {
    return "engineering";
  }

  // Handle mathematics variations
  if (
    lower === "mathematics" ||
    lower === "matematica" ||
    lower === "matematică" ||
    lower.includes("math") ||
    lower.includes("mate")
  ) {
    return "mathematics";
  }

  // Handle engineering learning variations
  if (
    lower === "engineeringlearning" ||
    lower === "engineering learning" ||
    lower === "inginerie si invatare" ||
    lower === "inginerie și învățare"
  ) {
    return "engineering";
  }

  return lower;
}

console.log("Testing normalizeCategory with different inputs:");
console.log(
  'normalizeCategory("technology"):',
  normalizeCategory("technology")
);
console.log(
  'normalizeCategory("Technology"):',
  normalizeCategory("Technology")
);
console.log(
  'normalizeCategory("TECHNOLOGY"):',
  normalizeCategory("TECHNOLOGY")
);

// Test the filtering logic
const productCategory = "technology";
const selectedCategory = "technology";

console.log("\nFiltering test:");
console.log("Product category (lowercased):", productCategory);
console.log(
  "Selected category (normalized):",
  normalizeCategory(selectedCategory)
);
console.log("Match:", productCategory === normalizeCategory(selectedCategory));

// Test with the actual product data
const product = {
  name: "Coding Robot for Beginners",
  category: { name: "Technology" },
  stemDiscipline: "TECHNOLOGY",
};

const productCategoryFromData =
  product.category?.name?.toLowerCase() ||
  product.stemDiscipline?.toLowerCase() ||
  "";
console.log("\nActual product data test:");
console.log("Product category from data:", productCategoryFromData);
console.log("Normalized selected:", normalizeCategory("technology"));
console.log(
  "Should match:",
  productCategoryFromData === normalizeCategory("technology")
);
