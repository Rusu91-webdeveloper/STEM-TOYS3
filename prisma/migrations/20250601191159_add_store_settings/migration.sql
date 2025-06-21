-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'TechTots',
    "storeUrl" TEXT NOT NULL DEFAULT 'https://techtots.com',
    "storeDescription" TEXT NOT NULL DEFAULT 'TechTots is a premier online destination for STEM toys that inspire learning through play.',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@techtots.com',
    "contactPhone" TEXT NOT NULL DEFAULT '+1 (555) 123-4567',
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "timezone" TEXT NOT NULL DEFAULT 'america-new_york',
    "dateFormat" TEXT NOT NULL DEFAULT 'mm-dd-yyyy',
    "weightUnit" TEXT NOT NULL DEFAULT 'lb',
    "metaTitle" TEXT NOT NULL DEFAULT 'TechTots | STEM Toys for Curious Minds',
    "metaDescription" TEXT NOT NULL DEFAULT 'Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun for children of all ages.',
    "metaKeywords" TEXT NOT NULL DEFAULT 'STEM toys, educational toys, science toys, technology toys, engineering toys, math toys',
    "shippingSettings" JSONB,
    "paymentSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
