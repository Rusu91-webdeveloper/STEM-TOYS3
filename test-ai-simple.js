/**
 * Simple test script to verify AI enhancement works
 */

const testProduct = {
  name: "Test Robot Kit",
  category: "Robotics",
  price: 50,
  description: "A simple robot kit for kids",
  ageGroup: "ELEMENTARY_6_8",
  images: ["https://example.com/robot.jpg"],
};

async function testAIEnhancement() {
  try {
    console.log("Testing AI enhancement with simple product...");

    const response = await fetch(
      "http://localhost:3000/api/admin/products/ai-enhance",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: [testProduct],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ AI enhancement successful!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ AI enhancement failed:", error.message);
  }
}

// Run the test
testAIEnhancement();
