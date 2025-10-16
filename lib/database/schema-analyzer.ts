import fs from "fs";
import path from "path";

export interface SchemaField {
  name: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
  isArray: boolean;
  defaultValue?: string;
  isRelation: boolean;
  relationTo?: string;
  relationName?: string;
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
  indexes: string[];
  uniqueConstraints: string[];
  relations: SchemaRelation[];
  domain: string;
}

export interface SchemaRelation {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  fieldName: string;
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface SchemaStatistics {
  totalModels: number;
  totalRelations: number;
  totalIndexes: number;
  totalEnums: number;
  totalFields: number;
  jsonFields: number;
  arrayFields: number;
  uniqueConstraints: number;
  securityFeatures: number;
  automationFeatures: number;
}

export interface ParsedSchema {
  models: SchemaModel[];
  enums: SchemaEnum[];
  relations: SchemaRelation[];
  statistics: SchemaStatistics;
}

/**
 * Domain mapping for tables based on their purpose
 */
const DOMAIN_MAPPING: Record<string, string> = {
  // Authentication & Security
  User: "auth",
  TwoFactor: "auth",
  PasswordResetToken: "auth",
  SecurityEventLog: "auth",
  ConsentLog: "auth",

  // Multi-tenancy
  Tenant: "tenancy",
  Organization: "tenancy",
  UserShard: "tenancy",

  // E-commerce Core
  Product: "ecommerce",
  Category: "ecommerce",
  Order: "ecommerce",
  OrderItem: "ecommerce",
  OrderStatusHistory: "ecommerce",
  Address: "ecommerce",
  PaymentCard: "ecommerce",
  Wishlist: "ecommerce",
  Review: "ecommerce",
  Return: "ecommerce",

  // Supplier Management
  Supplier: "supplier",
  SupplierOrder: "supplier",
  SupplierInvoice: "supplier",
  SupplierPayment: "supplier",
  SupplierMessage: "supplier",
  SupplierNotification: "supplier",
  SupplierSupportTicket: "supplier",
  SupplierTicketResponse: "supplier",
  SupplierPerformanceMetrics: "supplier",
  SupplierOrderTracking: "supplier",
  SupplierAnnouncement: "supplier",

  // Marketing & CRM
  SegmentationRule: "crm",
  Campaign: "marketing",
  CampaignApplication: "marketing",
  Coupon: "marketing",
  CouponUsage: "marketing",
  Newsletter: "marketing",

  // Email System
  EmailTemplate: "email",
  EmailLog: "email",
  EmailCampaign: "email",
  EmailEvent: "email",
  EmailSequence: "email",
  EmailSequenceStep: "email",
  EmailSequenceUser: "email",
  EmailTrigger: "email",
  EmailTriggerExecution: "email",

  // Content Management
  Blog: "content",
  Book: "content",
  DigitalFile: "content",
  Language: "content",
  ContentVersion: "content",

  // Analytics & Tracking
  FacebookPixelEvent: "analytics",
  FacebookPixelConfig: "analytics",
  InstagramPixelConfig: "analytics",
  TikTokPixelConfig: "analytics",
  RomanianViralContent: "analytics",
  SEOAnalytics: "analytics",
  ConversionLog: "analytics",
  PerformanceMetric: "analytics",

  // Digital Products
  DigitalDownload: "digital",

  // Configuration
  StoreSettings: "config",
  StoreSettingsBackup: "config",
  DataRetentionPolicy: "config",

  // Operations
  ProductCost: "operations",
  MarketingCost: "operations",
  ImageMetadata: "operations",
  ImageProcessingLog: "operations",
  Ticket: "operations",

  // Automation
  AutomationWorkflow: "automation",
  AiJob: "automation",
};

const DOMAIN_COLORS: Record<string, string> = {
  auth: "#3b82f6", // blue
  tenancy: "#8b5cf6", // purple
  ecommerce: "#10b981", // green
  supplier: "#f59e0b", // amber
  crm: "#ec4899", // pink
  marketing: "#f43f5e", // rose
  email: "#6366f1", // indigo
  content: "#14b8a6", // teal
  analytics: "#06b6d4", // cyan
  digital: "#84cc16", // lime
  config: "#64748b", // slate
  operations: "#f97316", // orange
  automation: "#a855f7", // violet
};

/**
 * Parse the Prisma schema file and extract structured information
 */
export function parseSchema(): ParsedSchema {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  const models: SchemaModel[] = [];
  const enums: SchemaEnum[] = [];
  const relations: SchemaRelation[] = [];

  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let modelMatch;

  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];

    const fields: SchemaField[] = [];
    const indexes: string[] = [];
    const uniqueConstraints: string[] = [];
    const modelRelations: SchemaRelation[] = [];

    // Parse fields
    const fieldLines = modelBody
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//"));

    for (const line of fieldLines) {
      // Skip index definitions
      if (
        line.startsWith("@@index") ||
        line.startsWith("@@unique") ||
        line.startsWith("@@map")
      ) {
        if (line.startsWith("@@index")) {
          indexes.push(line);
        }
        if (line.startsWith("@@unique")) {
          uniqueConstraints.push(line);
        }
        continue;
      }

      // Parse field
      const fieldMatch = line.match(/^(\w+)\s+(\w+(\[\])?(\?)?)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldTypeRaw = fieldMatch[2];

        const isArray = fieldTypeRaw.includes("[]");
        const isRequired = !fieldTypeRaw.includes("?");
        const fieldType = fieldTypeRaw.replace("[]", "").replace("?", "");

        const isUnique = line.includes("@unique");
        const defaultMatch = line.match(/@default\(([^)]+)\)/);
        const relationMatch = line.match(/@relation\(([^)]+)\)/);

        // Check if it's a relation field
        const isRelation =
          relationMatch !== null ||
          (fieldType.charAt(0) === fieldType.charAt(0).toUpperCase() &&
            fieldType !== "String" &&
            fieldType !== "Int" &&
            fieldType !== "Float" &&
            fieldType !== "Boolean" &&
            fieldType !== "DateTime" &&
            fieldType !== "Json");

        fields.push({
          name: fieldName,
          type: fieldType,
          isRequired,
          isUnique,
          isArray,
          defaultValue: defaultMatch ? defaultMatch[1] : undefined,
          isRelation,
          relationTo: isRelation ? fieldType : undefined,
        });

        // Extract relation
        if (isRelation && fieldType !== "Json") {
          const relationType: "one-to-one" | "one-to-many" | "many-to-many" =
            isArray
              ? "many-to-many"
              : isRequired
                ? "one-to-one"
                : "one-to-many";

          const relation: SchemaRelation = {
            from: modelName,
            to: fieldType,
            type: relationType,
            fieldName: fieldName,
          };

          modelRelations.push(relation);
          relations.push(relation);
        }
      }
    }

    const domain = DOMAIN_MAPPING[modelName] || "other";

    models.push({
      name: modelName,
      fields,
      indexes,
      uniqueConstraints,
      relations: modelRelations,
      domain,
    });
  }

  // Parse enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;

  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const enumName = enumMatch[1];
    const enumBody = enumMatch[2];

    const values = enumBody
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//"));

    enums.push({
      name: enumName,
      values,
    });
  }

  // Calculate statistics
  const statistics: SchemaStatistics = {
    totalModels: models.length,
    totalRelations: relations.length,
    totalIndexes: models.reduce((sum, m) => sum + m.indexes.length, 0),
    totalEnums: enums.length,
    totalFields: models.reduce((sum, m) => sum + m.fields.length, 0),
    jsonFields: models.reduce(
      (sum, m) => sum + m.fields.filter(f => f.type === "Json").length,
      0
    ),
    arrayFields: models.reduce(
      (sum, m) => sum + m.fields.filter(f => f.isArray).length,
      0
    ),
    uniqueConstraints: models.reduce(
      (sum, m) => sum + m.uniqueConstraints.length,
      0
    ),
    securityFeatures: models.filter(m =>
      [
        "SecurityEventLog",
        "TwoFactor",
        "ConsentLog",
        "PasswordResetToken",
      ].includes(m.name)
    ).length,
    automationFeatures: models.filter(m =>
      ["EmailSequence", "EmailTrigger", "AutomationWorkflow", "AiJob"].includes(
        m.name
      )
    ).length,
  };

  return {
    models,
    enums,
    relations,
    statistics,
  };
}

/**
 * Get domain color for a model
 */
export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || "#94a3b8";
}

/**
 * Get all unique domains from the schema
 */
export function getDomains(models: SchemaModel[]): string[] {
  const domains = new Set(models.map(m => m.domain));
  return Array.from(domains).sort();
}

/**
 * Filter models by domain
 */
export function filterByDomain(
  models: SchemaModel[],
  domain: string
): SchemaModel[] {
  return models.filter(m => m.domain === domain);
}

/**
 * Search models by name
 */
export function searchModels(
  models: SchemaModel[],
  query: string
): SchemaModel[] {
  const lowerQuery = query.toLowerCase();
  return models.filter(
    m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.fields.some(f => f.name.toLowerCase().includes(lowerQuery))
  );
}
