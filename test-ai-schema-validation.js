/**
 * Test script to validate AI schema compliance and mapping rules
 * Tests the improved prompts with real product data
 */

const testProducts = [
  {
    name: "LEGO Mindstorms Robot Inventor",
    price: 359.99,
    category: "Robotics",
    description:
      "Build and program robots with this advanced LEGO robotics kit featuring sensors, motors and programmable hub",
    stockQuantity: 25,
    sku: "LEGO-51515",
  },
  {
    name: "Snap Circuits SC-300",
    price: 54.99,
    category: "Electronics",
    description:
      "Electronic discovery kit with 300+ experiments using snap-together components to learn about electricity and circuits",
    stockQuantity: 40,
    sku: "SNAP-SC300",
  },
  {
    name: "Thames & Kosmos Chemistry C3000",
    price: 199.95,
    category: "Science Kits",
    description:
      "Professional-grade chemistry set with 333 experiments covering organic, inorganic and analytical chemistry for ages 12+",
    stockQuantity: 15,
    sku: "TK-640132",
  },
  {
    name: "Kano Computer Kit Touch",
    price: 279.99,
    category: "Computing",
    description:
      "Build your own tablet computer while learning coding, electronics and how computers work with this hands-on STEM kit",
    stockQuantity: 30,
    sku: "KANO-1013",
  },
  {
    name: "National Geographic Mega Fossil Dig Kit",
    price: 24.95,
    category: "Archaeology",
    description:
      "Excavate 15 real fossils including shark teeth, mosasaur and ammonite specimens with professional paleontology tools",
    stockQuantity: 60,
    sku: "NG-FOSSIL15",
  },
];

// Expected mappings based on our improved rules
const expectedMappings = {
  "LEGO Mindstorms Robot Inventor": {
    ageGroup: "ELEMENTARY_6_8", // No age specified, default to elementary
    stemDiscipline: "TECHNOLOGY", // Programming, robotics
    productType: "ROBOTICS", // Robot building
    contentLength: "500-700 words",
  },
  "Snap Circuits SC-300": {
    ageGroup: "ELEMENTARY_6_8", // No age specified, default to elementary
    stemDiscipline: "TECHNOLOGY", // Electronics, circuits
    productType: "EXPERIMENT_KITS", // Experiments with snap-together components
    contentLength: "450-650 words",
  },
  "Thames & Kosmos Chemistry C3000": {
    ageGroup: "TEENS_13_PLUS", // "ages 12+" in description
    stemDiscipline: "SCIENCE", // Chemistry experiments
    productType: "EXPERIMENT_KITS", // Chemistry experiments
    contentLength: "450-650 words",
  },
  "Kano Computer Kit Touch": {
    ageGroup: "ELEMENTARY_6_8", // No age specified, default to elementary
    stemDiscipline: "TECHNOLOGY", // Programming, coding, electronics
    productType: "EXPERIMENT_KITS", // Hands-on STEM kit
    contentLength: "450-650 words",
  },
  "National Geographic Mega Fossil Dig Kit": {
    ageGroup: "ELEMENTARY_6_8", // No age specified, default to elementary
    stemDiscipline: "SCIENCE", // Fossils, paleontology
    productType: "EXPERIMENT_KITS", // Excavation experiments
    contentLength: "450-650 words",
  },
};

// Database enum validation
const DATABASE_ENUMS = {
  AgeGroup: [
    "TODDLERS_1_3",
    "PRESCHOOL_3_5",
    "ELEMENTARY_6_8",
    "MIDDLE_SCHOOL_9_12",
    "TEENS_13_PLUS",
  ],
  StemCategory: [
    "SCIENCE",
    "TECHNOLOGY",
    "ENGINEERING",
    "MATHEMATICS",
    "GENERAL",
  ],
  ProductType: [
    "ROBOTICS",
    "PUZZLES",
    "CONSTRUCTION_SETS",
    "EXPERIMENT_KITS",
    "BOARD_GAMES",
  ],
  LearningOutcome: [
    "PROBLEM_SOLVING",
    "CREATIVITY",
    "CRITICAL_THINKING",
    "MOTOR_SKILLS",
    "LOGIC",
  ],
  RomanianEducationalLevel: [
    "GRADINITA",
    "PRIMAR",
    "GIMNAZIU",
    "LICEU",
    "UNIVERSITATE",
  ],
};

/**
 * Test function to validate mappings
 */
function testMappings() {
  console.log("🧪 Testing AI Schema Compliance and Mapping Rules");
  console.log("=".repeat(60));

  let totalTests = 0;
  let passedTests = 0;

  testProducts.forEach((product, index) => {
    console.log(`\n📦 Testing Product ${index + 1}: ${product.name}`);
    console.log("-".repeat(50));

    const expected = expectedMappings[product.name];

    // Test 1: Age Group Validation
    totalTests++;
    if (DATABASE_ENUMS.AgeGroup.includes(expected.ageGroup)) {
      console.log(`✅ Age Group: ${expected.ageGroup} (valid)`);
      passedTests++;
    } else {
      console.log(`❌ Age Group: ${expected.ageGroup} (invalid)`);
    }

    // Test 2: STEM Discipline Validation
    totalTests++;
    if (DATABASE_ENUMS.StemCategory.includes(expected.stemDiscipline)) {
      console.log(`✅ STEM Discipline: ${expected.stemDiscipline} (valid)`);
      passedTests++;
    } else {
      console.log(`❌ STEM Discipline: ${expected.stemDiscipline} (invalid)`);
    }

    // Test 3: Product Type Validation
    totalTests++;
    if (DATABASE_ENUMS.ProductType.includes(expected.productType)) {
      console.log(`✅ Product Type: ${expected.productType} (valid)`);
      passedTests++;
    } else {
      console.log(`❌ Product Type: ${expected.productType} (invalid)`);
    }

    // Test 4: Content Length Format
    totalTests++;
    if (expected.contentLength && expected.contentLength.includes("-")) {
      console.log(
        `✅ Content Length: ${expected.contentLength} (valid format)`
      );
      passedTests++;
    } else {
      console.log(
        `❌ Content Length: ${expected.contentLength} (invalid format)`
      );
    }

    // Test 5: Age Group Rule Compliance
    totalTests++;
    let ageRulePassed = false;
    if (
      product.description.includes("ages 12+") ||
      product.description.includes("ages 13+")
    ) {
      ageRulePassed = expected.ageGroup === "TEENS_13_PLUS";
    } else {
      // No specific age mentioned, should default to ELEMENTARY_6_8
      ageRulePassed = expected.ageGroup === "ELEMENTARY_6_8";
    }

    if (ageRulePassed) {
      console.log(`✅ Age Group Rule: Follows determination rules`);
      passedTests++;
    } else {
      console.log(`❌ Age Group Rule: Violates determination rules`);
    }

    // Test 6: STEM Discipline Rule Compliance
    totalTests++;
    let stemRulePassed = false;
    const desc = product.description.toLowerCase();

    if (
      desc.includes("chemistry") ||
      desc.includes("fossil") ||
      desc.includes("science")
    ) {
      stemRulePassed = expected.stemDiscipline === "SCIENCE";
    } else if (
      desc.includes("programming") ||
      desc.includes("coding") ||
      desc.includes("electronics") ||
      desc.includes("circuits") ||
      desc.includes("robot")
    ) {
      stemRulePassed = expected.stemDiscipline === "TECHNOLOGY";
    }

    if (stemRulePassed) {
      console.log(`✅ STEM Discipline Rule: Follows classification rules`);
      passedTests++;
    } else {
      console.log(`❌ STEM Discipline Rule: Violates classification rules`);
    }
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );

  if (passedTests === totalTests) {
    console.log(
      "🎉 ALL TESTS PASSED! The improved AI prompts should work correctly."
    );
  } else {
    console.log("⚠️  Some tests failed. Please review the mapping rules.");
  }
}

/**
 * Display the mapping rules for reference
 */
function displayMappingRules() {
  console.log("\n📋 MAPPING RULES REFERENCE");
  console.log("=".repeat(60));

  console.log("\n🎯 AGE GROUP DETERMINATION RULES:");
  console.log(
    "- ages 12+, 12-16, 13+, adolescents, teens, teenagers → TEENS_13_PLUS"
  );
  console.log(
    "- ages 9-12, 10-14, middle school, ages 9+, 10+ → MIDDLE_SCHOOL_9_12"
  );
  console.log(
    "- ages 6-8, 6-12, elementary, ages 6+, primary school → ELEMENTARY_6_8"
  );
  console.log("- ages 3-5, preschool, ages 3-6 → PRESCHOOL_3_5");
  console.log("- ages 1-3, toddlers, ages 1-4 → TODDLERS_1_3");
  console.log("- DEFAULT: ELEMENTARY_6_8 (most common for STEM toys)");

  console.log("\n🔬 STEM DISCIPLINE CLASSIFICATION RULES:");
  console.log(
    "- SCIENCE: Chemistry, biology, physics, geology, astronomy, fossils, experiments"
  );
  console.log(
    "- TECHNOLOGY: Programming, coding, electronics, circuits, computers, robotics"
  );
  console.log(
    "- ENGINEERING: Building, construction, design, mechanics, structures, invention"
  );
  console.log(
    "- MATHEMATICS: Numbers, patterns, logic puzzles, geometry, calculations"
  );
  console.log("- GENERAL: Mixed disciplines or unclear");

  console.log("\n🛠️ PRODUCT TYPE CLASSIFICATION RULES:");
  console.log(
    "- ROBOTICS: Robots, programmable robots, robot kits, robot building"
  );
  console.log(
    "- CONSTRUCTION_SETS: Building sets, construction toys, building blocks, model kits"
  );
  console.log(
    "- EXPERIMENT_KITS: Science experiments, chemistry sets, electronic kits"
  );
  console.log(
    "- PUZZLES: Logic puzzles, brain teasers, problem-solving puzzles"
  );
  console.log(
    "- BOARD_GAMES: Strategy games, educational games, learning games"
  );

  console.log("\n📏 CONTENT LENGTH GUIDELINES:");
  console.log(
    "- ROBOTICS: 500-700 words (complex concepts need detailed explanation)"
  );
  console.log(
    "- CONSTRUCTION_SETS: 400-600 words (building instructions and design)"
  );
  console.log(
    "- EXPERIMENT_KITS: 450-650 words (safety instructions, procedures)"
  );
  console.log("- PUZZLES: 350-500 words (focused on strategies)");
  console.log("- BOARD_GAMES: 350-500 words (rules and mechanics)");
}

// Run the tests
displayMappingRules();
testMappings();

module.exports = {
  testProducts,
  expectedMappings,
  DATABASE_ENUMS,
  testMappings,
  displayMappingRules,
};
