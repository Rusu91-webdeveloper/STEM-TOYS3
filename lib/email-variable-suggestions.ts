/**
 * Dynamic Email Variable Suggestions
 * Provides contextual variable recommendations based on template category and content
 */

export interface VariableSuggestion {
  variable: string;
  label: string;
  description: string;
  category: string;
  priority: number;
  usage: string;
  example: string;
}

export interface VariableContext {
  templateCategory: string;
  content: string;
  subject: string;
  existingVariables: string[];
}

export class EmailVariableSuggestions {
  private static readonly VARIABLE_DATABASE: Record<
    string,
    VariableSuggestion
  > = {
    // User Variables
    "{{user.name}}": {
      variable: "{{user.name}}",
      label: "Full Name",
      description: "User's complete name",
      category: "user",
      priority: 10,
      usage: "Personalization, greetings",
      example: "John Doe",
    },
    "{{user.firstName}}": {
      variable: "{{user.firstName}}",
      label: "First Name",
      description: "User's first name only",
      category: "user",
      priority: 9,
      usage: "Personal greetings, casual communication",
      example: "John",
    },
    "{{user.lastName}}": {
      variable: "{{user.lastName}}",
      label: "Last Name",
      description: "User's last name only",
      category: "user",
      priority: 8,
      usage: "Formal communication",
      example: "Doe",
    },
    "{{user.email}}": {
      variable: "{{user.email}}",
      label: "Email Address",
      description: "User's email address",
      category: "user",
      priority: 7,
      usage: "Contact information, verification",
      example: "john.doe@example.com",
    },

    // Order Variables
    "{{order.number}}": {
      variable: "{{order.number}}",
      label: "Order Number",
      description: "Unique order identifier",
      category: "order",
      priority: 10,
      usage: "Order confirmations, tracking, support",
      example: "ORD-2024-001234",
    },
    "{{order.total}}": {
      variable: "{{order.total}}",
      label: "Order Total",
      description: "Total amount of the order",
      category: "order",
      priority: 9,
      usage: "Order confirmations, receipts",
      example: "€89.99",
    },
    "{{order.date}}": {
      variable: "{{order.date}}",
      label: "Order Date",
      description: "Date when the order was placed",
      category: "order",
      priority: 8,
      usage: "Order confirmations, receipts",
      example: "January 31, 2025",
    },
    "{{order.items}}": {
      variable: "{{order.items}}",
      label: "Order Items",
      description: "List of items in the order",
      category: "order",
      priority: 7,
      usage: "Order confirmations, receipts",
      example: "Solar System Explorer Kit, Robotics Coding Starter Kit",
    },
    "{{order.status}}": {
      variable: "{{order.status}}",
      label: "Order Status",
      description: "Current status of the order",
      category: "order",
      priority: 8,
      usage: "Order updates, tracking",
      example: "Shipped",
    },
    "{{order.trackingNumber}}": {
      variable: "{{order.trackingNumber}}",
      label: "Tracking Number",
      description: "Package tracking number",
      category: "order",
      priority: 9,
      usage: "Shipping notifications",
      example: "RO123456789",
    },

    // Product Variables
    "{{product.name}}": {
      variable: "{{product.name}}",
      label: "Product Name",
      description: "Name of the product",
      category: "product",
      priority: 10,
      usage: "Product recommendations, featured products",
      example: "STEM Learning Kit",
    },
    "{{product.price}}": {
      variable: "{{product.price}}",
      label: "Product Price",
      description: "Price of the product",
      category: "product",
      priority: 9,
      usage: "Product recommendations, promotions",
      example: "€149.99",
    },
    "{{product.description}}": {
      variable: "{{product.description}}",
      label: "Product Description",
      description: "Brief description of the product",
      category: "product",
      priority: 7,
      usage: "Product recommendations, featured products",
      example: "Educational STEM kit for kids ages 8-12",
    },
    "{{product.image}}": {
      variable: "{{product.image}}",
      label: "Product Image",
      description: "URL to product image",
      category: "product",
      priority: 8,
      usage: "Product recommendations, visual content",
      example: "https://techtots.com/images/product.jpg",
    },

    // Site Variables
    "{{site.name}}": {
      variable: "{{site.name}}",
      label: "Site Name",
      description: "Name of the website/store",
      category: "site",
      priority: 10,
      usage: "Branding, signatures, footers",
      example: "TechTots",
    },
    "{{site.url}}": {
      variable: "{{site.url}}",
      label: "Site URL",
      description: "Website URL",
      category: "site",
      priority: 9,
      usage: "Links, CTAs, branding",
      example: "https://techtots.com",
    },
    "{{site.logo}}": {
      variable: "{{site.logo}}",
      label: "Site Logo",
      description: "URL to site logo",
      category: "site",
      priority: 8,
      usage: "Branding, headers",
      example: "https://techtots.com/logo.png",
    },

    // Current Date/Time Variables
    "{{current.date}}": {
      variable: "{{current.date}}",
      label: "Current Date",
      description: "Today's date",
      category: "current",
      priority: 8,
      usage: "Newsletters, updates, timestamps",
      example: "January 31, 2025",
    },
    "{{current.year}}": {
      variable: "{{current.year}}",
      label: "Current Year",
      description: "Current year",
      category: "current",
      priority: 7,
      usage: "Copyright, footers",
      example: "2025",
    },
    "{{current.month}}": {
      variable: "{{current.month}}",
      label: "Current Month",
      description: "Current month name",
      category: "current",
      priority: 6,
      usage: "Monthly newsletters, seasonal content",
      example: "January",
    },

    // Unsubscribe Variables
    "{{unsubscribe.link}}": {
      variable: "{{unsubscribe.link}}",
      label: "Unsubscribe Link",
      description: "Link for users to unsubscribe",
      category: "unsubscribe",
      priority: 10,
      usage: "Legal compliance, footer links",
      example: "https://techtots.com/unsubscribe?token=xyz",
    },
    "{{unsubscribe.text}}": {
      variable: "{{unsubscribe.text}}",
      label: "Unsubscribe Text",
      description: "Text for unsubscribe link",
      category: "unsubscribe",
      priority: 9,
      usage: "Legal compliance, footer links",
      example: "Unsubscribe",
    },

    // STEM-Specific Variables
    "{{stem.ageGroup}}": {
      variable: "{{stem.ageGroup}}",
      label: "Age Group",
      description: "Recommended age group for STEM products",
      category: "stem",
      priority: 8,
      usage: "Product recommendations, educational content",
      example: "Ages 8-12",
    },
    "{{stem.subject}}": {
      variable: "{{stem.subject}}",
      label: "STEM Subject",
      description: "STEM subject area (Science, Technology, Engineering, Math)",
      category: "stem",
      priority: 7,
      usage: "Educational content, product categorization",
      example: "Science",
    },
    "{{stem.difficulty}}": {
      variable: "{{stem.difficulty}}",
      label: "Difficulty Level",
      description: "Difficulty level of the STEM activity",
      category: "stem",
      priority: 6,
      usage: "Educational content, skill-based recommendations",
      example: "Beginner",
    },

    // Supplier Variables
    "{{supplier.name}}": {
      variable: "{{supplier.name}}",
      label: "Supplier Name",
      description: "Name of the supplier",
      category: "supplier",
      priority: 8,
      usage: "Supplier communications, product sourcing",
      example: "STEM Solutions Ltd",
    },
    "{{supplier.commission}}": {
      variable: "{{supplier.commission}}",
      label: "Commission Rate",
      description: "Commission rate for the supplier",
      category: "supplier",
      priority: 7,
      usage: "Financial reports, commission statements",
      example: "15%",
    },
  };

  /**
   * Get contextual variable suggestions based on template category and content
   */
  static getSuggestions(context: VariableContext): VariableSuggestion[] {
    const suggestions: VariableSuggestion[] = [];
    const usedVariables = new Set(context.existingVariables);

    // Category-based suggestions
    const categorySuggestions = this.getCategorySuggestions(
      context.templateCategory
    );
    suggestions.push(...categorySuggestions);

    // Content-based suggestions
    const contentSuggestions = this.getContentBasedSuggestions(
      context.content,
      context.subject
    );
    suggestions.push(...contentSuggestions);

    // STEM-specific suggestions for educational templates
    if (this.isSTEMRelated(context.templateCategory, context.content)) {
      const stemSuggestions = this.getSTEMSuggestions();
      suggestions.push(...stemSuggestions);
    }

    // Filter out already used variables and sort by priority
    return suggestions
      .filter(suggestion => !usedVariables.has(suggestion.variable))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 12); // Limit to top 12 suggestions
  }

  /**
   * Get suggestions based on template category
   */
  private static getCategorySuggestions(
    category: string
  ): VariableSuggestion[] {
    const categoryMap: Record<string, string[]> = {
      welcome: [
        "user.name",
        "user.firstName",
        "site.name",
        "site.url",
        "current.date",
      ],
      "order-confirmation": [
        "user.name",
        "order.number",
        "order.total",
        "order.date",
        "order.items",
        "order.status",
      ],
      "order-shipped": [
        "user.name",
        "order.number",
        "order.trackingNumber",
        "order.items",
        "order.status",
      ],
      "order-delivered": [
        "user.name",
        "order.number",
        "order.items",
        "order.status",
      ],
      "password-reset": ["user.name", "user.email", "site.name", "site.url"],
      "email-verification": ["user.name", "user.email", "site.name"],
      "abandoned-cart": [
        "user.name",
        "product.name",
        "product.price",
        "site.url",
      ],
      newsletter: [
        "user.name",
        "current.date",
        "current.year",
        "unsubscribe.link",
      ],
      promotional: [
        "user.name",
        "product.name",
        "product.price",
        "site.url",
        "current.date",
      ],
      supplier: [
        "supplier.name",
        "supplier.commission",
        "current.date",
        "site.name",
      ],
    };

    const variables = categoryMap[category] || [];
    return variables
      .map(variableKey => this.VARIABLE_DATABASE[`{{${variableKey}}}`])
      .filter(Boolean);
  }

  /**
   * Get suggestions based on content analysis
   */
  private static getContentBasedSuggestions(
    content: string,
    subject: string
  ): VariableSuggestion[] {
    const suggestions: VariableSuggestion[] = [];
    const text = `${content} ${subject}`.toLowerCase();

    // Analyze content for contextual suggestions
    if (text.includes("order") || text.includes("purchase")) {
      suggestions.push(
        this.VARIABLE_DATABASE["{{order.number}}"],
        this.VARIABLE_DATABASE["{{order.total}}"],
        this.VARIABLE_DATABASE["{{order.date}}"]
      );
    }

    if (text.includes("product") || text.includes("item")) {
      suggestions.push(
        this.VARIABLE_DATABASE["{{product.name}}"],
        this.VARIABLE_DATABASE["{{product.price}}"],
        this.VARIABLE_DATABASE["{{product.description}}"]
      );
    }

    if (text.includes("shipping") || text.includes("tracking")) {
      suggestions.push(
        this.VARIABLE_DATABASE["{{order.trackingNumber}}"],
        this.VARIABLE_DATABASE["{{order.status}}"]
      );
    }

    if (text.includes("welcome") || text.includes("greeting")) {
      suggestions.push(
        this.VARIABLE_DATABASE["{{user.firstName}}"],
        this.VARIABLE_DATABASE["{{user.name}}"]
      );
    }

    if (text.includes("newsletter") || text.includes("update")) {
      suggestions.push(
        this.VARIABLE_DATABASE["{{current.date}}"],
        this.VARIABLE_DATABASE["{{unsubscribe.link}}"]
      );
    }

    return suggestions.filter(Boolean);
  }

  /**
   * Get STEM-specific variable suggestions
   */
  private static getSTEMSuggestions(): VariableSuggestion[] {
    return [
      this.VARIABLE_DATABASE["{{stem.ageGroup}}"],
      this.VARIABLE_DATABASE["{{stem.subject}}"],
      this.VARIABLE_DATABASE["{{stem.difficulty}}"],
    ].filter(Boolean);
  }

  /**
   * Check if content is STEM-related
   */
  private static isSTEMRelated(category: string, content: string): boolean {
    const stemKeywords = [
      "stem",
      "science",
      "technology",
      "engineering",
      "math",
      "educational",
      "learning",
      "kids",
      "children",
    ];
    const text = `${category} ${content}`.toLowerCase();
    return stemKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Get all available variables grouped by category
   */
  static getAllVariablesByCategory(): Record<string, VariableSuggestion[]> {
    const categories: Record<string, VariableSuggestion[]> = {};

    Object.values(this.VARIABLE_DATABASE).forEach(suggestion => {
      if (!categories[suggestion.category]) {
        categories[suggestion.category] = [];
      }
      categories[suggestion.category].push(suggestion);
    });

    // Sort each category by priority
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => b.priority - a.priority);
    });

    return categories;
  }

  /**
   * Search variables by keyword
   */
  static searchVariables(keyword: string): VariableSuggestion[] {
    const searchTerm = keyword.toLowerCase();

    return Object.values(this.VARIABLE_DATABASE)
      .filter(
        suggestion =>
          suggestion.variable.toLowerCase().includes(searchTerm) ||
          suggestion.label.toLowerCase().includes(searchTerm) ||
          suggestion.description.toLowerCase().includes(searchTerm) ||
          suggestion.usage.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  }

  /**
   * Get variable details
   */
  static getVariableDetails(variable: string): VariableSuggestion | null {
    return this.VARIABLE_DATABASE[variable] || null;
  }

  /**
   * Validate if a variable exists
   */
  static isValidVariable(variable: string): boolean {
    return variable in this.VARIABLE_DATABASE;
  }

  /**
   * Get usage statistics for variables (mock data for now)
   */
  static getVariableUsageStats(): Record<string, number> {
    // In a real implementation, this would come from analytics data
    return {
      "{{user.name}}": 95,
      "{{user.firstName}}": 87,
      "{{order.number}}": 92,
      "{{order.total}}": 88,
      "{{site.name}}": 98,
      "{{current.date}}": 76,
      "{{unsubscribe.link}}": 100,
      "{{product.name}}": 82,
      "{{product.price}}": 79,
      "{{order.date}}": 85,
    };
  }
}
