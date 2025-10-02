-- Create all missing advanced tables based on schema.prisma

-- Security Tables
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sessionToken TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Tables
CREATE TABLE IF NOT EXISTS "PaymentCard" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT NOT NULL,
    stripeCardId TEXT NOT NULL,
    last4 TEXT NOT NULL,
    brand TEXT NOT NULL,
    expMonth INTEGER NOT NULL,
    expYear INTEGER NOT NULL,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Management Tables
CREATE TABLE IF NOT EXISTS "Supplier" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT UNIQUE,
    companyName TEXT NOT NULL,
    companySlug TEXT NOT NULL UNIQUE,
    description TEXT,
    website TEXT,
    phone TEXT NOT NULL,
    vatNumber TEXT,
    taxId TEXT,
    businessAddress TEXT NOT NULL,
    businessCity TEXT NOT NULL,
    businessState TEXT NOT NULL,
    businessCountry TEXT DEFAULT 'România',
    businessPostalCode TEXT NOT NULL,
    contactPersonName TEXT NOT NULL,
    contactPersonEmail TEXT NOT NULL,
    contactPersonPhone TEXT NOT NULL,
    yearEstablished INTEGER,
    employeeCount INTEGER,
    industry TEXT,
    certifications TEXT[] DEFAULT '{}',
    paymentTerms TEXT DEFAULT 'NET_30',
    shippingTerms TEXT,
    minimumOrderValue DECIMAL(10,2),
    averageDeliveryTime INTEGER,
    returnPolicy TEXT,
    warrantyPolicy TEXT,
    qualityRating DECIMAL(3,2),
    deliveryRating DECIMAL(3,2),
    communicationRating DECIMAL(3,2),
    overallRating DECIMAL(3,2),
    totalOrders INTEGER DEFAULT 0,
    totalRevenue DECIMAL(15,2) DEFAULT 0,
    isVerified BOOLEAN DEFAULT false,
    isActive BOOLEAN DEFAULT true,
    verificationDocuments TEXT[] DEFAULT '{}',
    bankAccountDetails JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital Content Tables
CREATE TABLE IF NOT EXISTS "DigitalFile" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    productId TEXT NOT NULL,
    fileName TEXT NOT NULL,
    originalName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    downloadCount INTEGER DEFAULT 0,
    maxDownloads INTEGER,
    expiresAt TIMESTAMP WITH TIME ZONE,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Management Tables
CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    orderId TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    changedBy TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    productName TEXT NOT NULL,
    productSku TEXT,
    productImage TEXT,
    attributes JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Management Tables
CREATE TABLE IF NOT EXISTS "StoreSettings" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT,
    category TEXT,
    isPublic BOOLEAN DEFAULT false,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedBy TEXT
);

-- Analytics Tables
CREATE TABLE IF NOT EXISTS "PerformanceMetric" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    metricType TEXT NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    metadata JSONB,
    recordedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ConversionLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sessionId TEXT,
    userId TEXT,
    eventType TEXT NOT NULL,
    eventData JSONB,
    conversionValue DECIMAL(10,2),
    source TEXT,
    campaignId TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Tables
CREATE TABLE IF NOT EXISTS "Campaign" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    targetAudience JSONB,
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    startDate TIMESTAMP WITH TIME ZONE,
    endDate TIMESTAMP WITH TIME ZONE,
    goals JSONB,
    metrics JSONB,
    content JSONB,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CampaignApplication" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campaignId TEXT NOT NULL,
    applicantId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    applicationData JSONB,
    reviewNotes TEXT,
    reviewedBy TEXT,
    reviewedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AutomationWorkflow" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    triggerType TEXT NOT NULL,
    triggerConditions JSONB,
    actions JSONB,
    isActive BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    executionCount INTEGER DEFAULT 0,
    lastExecutedAt TIMESTAMP WITH TIME ZONE,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Order Management
CREATE TABLE IF NOT EXISTS "SupplierOrder" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplierId TEXT NOT NULL,
    orderNumber TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'PENDING',
    totalAmount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'RON',
    items JSONB,
    shippingAddress JSONB,
    expectedDeliveryDate TIMESTAMP WITH TIME ZONE,
    actualDeliveryDate TIMESTAMP WITH TIME ZONE,
    trackingNumber TEXT,
    notes TEXT,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupplierInvoice" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplierId TEXT NOT NULL,
    orderId TEXT,
    invoiceNumber TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'RON',
    status TEXT DEFAULT 'PENDING',
    issueDate TIMESTAMP WITH TIME ZONE NOT NULL,
    dueDate TIMESTAMP WITH TIME ZONE NOT NULL,
    paidDate TIMESTAMP WITH TIME ZONE,
    fileUrl TEXT,
    notes TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication Tables
CREATE TABLE IF NOT EXISTS "SupplierMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplierId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    recipientId TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    messageType TEXT DEFAULT 'GENERAL',
    priority TEXT DEFAULT 'NORMAL',
    isRead BOOLEAN DEFAULT false,
    readAt TIMESTAMP WITH TIME ZONE,
    attachments TEXT[] DEFAULT '{}',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupplierNotification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplierId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    isRead BOOLEAN DEFAULT false,
    readAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tables
CREATE TABLE IF NOT EXISTS "SupplierSupportTicket" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    supplierId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN',
    assignedTo TEXT,
    tags TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupplierTicketResponse" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticketId TEXT NOT NULL,
    responderId TEXT NOT NULL,
    response TEXT NOT NULL,
    isInternal BOOLEAN DEFAULT false,
    attachments TEXT[] DEFAULT '{}',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SupplierAnnouncement" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    targetAudience TEXT[] DEFAULT '{}',
    priority TEXT DEFAULT 'NORMAL',
    isPublished BOOLEAN DEFAULT false,
    publishedAt TIMESTAMP WITH TIME ZONE,
    expiresAt TIMESTAMP WITH TIME ZONE,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Marketing Tables
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    templateId TEXT,
    senderEmail TEXT NOT NULL,
    senderName TEXT NOT NULL,
    recipientList JSONB,
    status TEXT DEFAULT 'DRAFT',
    scheduledAt TIMESTAMP WITH TIME ZONE,
    sentAt TIMESTAMP WITH TIME ZONE,
    metrics JSONB,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EmailSequence" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    triggerEvent TEXT NOT NULL,
    triggerConditions JSONB,
    isActive BOOLEAN DEFAULT false,
    totalSubscribers INTEGER DEFAULT 0,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EmailSequenceStep" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sequenceId TEXT NOT NULL,
    stepNumber INTEGER NOT NULL,
    templateId TEXT NOT NULL,
    delayDays INTEGER DEFAULT 0,
    delayHours INTEGER DEFAULT 0,
    conditions JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EmailSequenceUser" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sequenceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    currentStep INTEGER DEFAULT 1,
    startedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completedAt TIMESTAMP WITH TIME ZONE,
    isActive BOOLEAN DEFAULT true,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS "EmailEvent" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    campaignId TEXT,
    sequenceId TEXT,
    userId TEXT,
    emailType TEXT NOT NULL,
    eventType TEXT NOT NULL,
    eventData JSONB,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital Downloads
CREATE TABLE IF NOT EXISTS "DigitalDownload" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    orderId TEXT NOT NULL,
    orderItemId TEXT NOT NULL,
    userId TEXT NOT NULL,
    fileId TEXT NOT NULL,
    downloadToken TEXT NOT NULL UNIQUE,
    downloadCount INTEGER DEFAULT 0,
    maxDownloads INTEGER DEFAULT 5,
    expiresAt TIMESTAMP WITH TIME ZONE,
    lastDownloadedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon Management
CREATE TABLE IF NOT EXISTS "CouponUsage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    couponId TEXT NOT NULL,
    orderId TEXT NOT NULL,
    userId TEXT NOT NULL,
    discountAmount DECIMAL(10,2) NOT NULL,
    usedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Management
CREATE TABLE IF NOT EXISTS "ContentVersion" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contentType TEXT NOT NULL,
    contentId TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    metadata JSONB,
    createdBy TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX IF NOT EXISTS "Session_sessionToken_idx" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "PaymentCard_userId_idx" ON "PaymentCard"("userId");
CREATE INDEX IF NOT EXISTS "Supplier_userId_idx" ON "Supplier"("userId");
CREATE INDEX IF NOT EXISTS "Supplier_companySlug_idx" ON "Supplier"("companySlug");
CREATE INDEX IF NOT EXISTS "DigitalFile_productId_idx" ON "DigitalFile"("productId");
CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "Campaign_slug_idx" ON "Campaign"("slug");
CREATE INDEX IF NOT EXISTS "CampaignApplication_campaignId_idx" ON "CampaignApplication"("campaignId");
CREATE INDEX IF NOT EXISTS "SupplierOrder_supplierId_idx" ON "SupplierOrder"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierInvoice_supplierId_idx" ON "SupplierInvoice"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierMessage_supplierId_idx" ON "SupplierMessage"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierNotification_supplierId_idx" ON "SupplierNotification"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierSupportTicket_supplierId_idx" ON "SupplierSupportTicket"("supplierId");
CREATE INDEX IF NOT EXISTS "EmailCampaign_templateId_idx" ON "EmailCampaign"("templateId");
CREATE INDEX IF NOT EXISTS "EmailSequenceStep_sequenceId_idx" ON "EmailSequenceStep"("sequenceId");
CREATE INDEX IF NOT EXISTS "EmailSequenceUser_sequenceId_idx" ON "EmailSequenceUser"("sequenceId");
CREATE INDEX IF NOT EXISTS "DigitalDownload_orderId_idx" ON "DigitalDownload"("orderId");
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX IF NOT EXISTS "ContentVersion_contentId_idx" ON "ContentVersion"("contentId");
