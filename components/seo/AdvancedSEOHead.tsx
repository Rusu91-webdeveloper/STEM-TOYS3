/**
 * Advanced SEO Head Component
 * Implements cutting-edge SEO strategies for Romanian STEM toys market
 */

import { Product } from "@/types/product";
import { generateCompleteProductSchema, generateEducationalOrganizationSchema } from "@/lib/seo/advanced-schema";

interface AdvancedSEOHeadProps {
  product?: Product;
  pageType?: "product" | "category" | "homepage" | "blog";
  categoryName?: string;
  ageGroup?: string;
  customSchema?: any[];
}

export function AdvancedSEOHead({ 
  product, 
  pageType = "homepage", 
  categoryName,
  ageGroup,
  customSchema = []
}: AdvancedSEOHeadProps) {
  let schemas: any[] = [];

  // Add organization schema to all pages
  schemas.push(generateEducationalOrganizationSchema());

  // Page-specific schemas
  if (product && pageType === "product") {
    schemas.push(...generateCompleteProductSchema(product));
  }

  // Add custom schemas
  schemas.push(...customSchema);

  return (
    <>
      {/* Advanced Meta Tags for Romanian Market */}
      <meta name="geo.region" content="RO" />
      <meta name="geo.placename" content="România" />
      <meta name="geo.position" content="45.9432;24.9668" />
      <meta name="ICBM" content="45.9432, 24.9668" />
      
      {/* Educational Context */}
      <meta name="educational-audience" content="parents,educators,children" />
      <meta name="educational-level" content={product?.romanianEducationalLevel || "all-levels"} />
      <meta name="curriculum-alignment" content="curriculum-national-romanesc" />
      
      {/* Romanian Market Targeting */}
      <meta name="market-focus" content="romania" />
      <meta name="language-market" content="ro-RO" />
      <meta name="target-audience" content="romanian-parents-educators" />
      
      {/* Product-specific meta */}
      {product && (
        <>
          <meta name="product-age-group" content={product.ageGroup || ""} />
          <meta name="stem-discipline" content={product.stemDiscipline || ""} />
          <meta name="learning-outcomes" content={product.learningOutcomes?.join(",") || ""} />
          <meta name="ministry-approved" content={product.romanianMinistryApproval ? "true" : "false"} />
        </>
      )}
      
      {/* Advanced Schema.org Structured Data */}
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
      
      {/* Preconnect to critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      
      {/* Romanian language declaration */}
      <meta httpEquiv="content-language" content="ro" />
      <meta name="language" content="Romanian" />
    </>
  );
}
