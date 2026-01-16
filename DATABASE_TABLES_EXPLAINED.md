# Database Tables Purpose Explanation

**Purpose:** Detailed explanation of partially implemented and schema-only
tables

---

## ⚠️ Partially Implemented Tables (13 tables - 15%)

### Multi-Tenancy Features

#### **1. Tenant Table**

**Purpose:** Top-level organization/company that owns and isolates data in a
multi-tenant SaaS architecture.

**What it does:**

- Allows one application instance to serve multiple customers (tenants)
- Each tenant has completely isolated data (users, products, orders, etc.)
- Supports custom domains, settings, and resource limits per tenant

**Real-world example:**

- If you're building a SaaS platform, "Acme Corp" and "Widget Inc" would each be
  a Tenant
- Each tenant has their own users, products, and orders - completely separate
- Tenant 1's users can't see Tenant 2's data

**Current status:**

- ✅ Schema fully defined with fields: `name`, `slug`, `domain`, `settings`,
  `limits`
- ✅ Middleware exists: `lib/middleware/tenant.ts` - can detect tenant from:
  - Subdomain (acme.yourplatform.com)
  - Path prefix (/acme/...)
  - Header (x-tenant-id)
  - Query parameter (?tenant=acme)
  - Cookie (tenant_slug)
  - User session
- ⚠️ **Not actively used** - Your app is currently single-tenant (one customer:
  you)
- **When to activate:** If you want to sell your platform as SaaS to multiple
  companies

**Fields explained:**

- `slug`: URL-friendly identifier (e.g., "acme-corp")
- `domain`: Custom domain (e.g., "acme.com")
- `settings`: JSON for tenant-specific configs (themes, features, etc.)
- `limits`: Resource limits (max users, storage, etc.)

---

#### **2. Organization Table**

**Purpose:** Sub-organizations within a tenant (departments, divisions,
subsidiaries).

**What it does:**

- Allows a Tenant to have multiple Organizations
- Example: "Acme Corp" (Tenant) might have "Acme Sales" and "Acme Support"
  (Organizations)
- Each organization can have its own users and settings

**Real-world example:**

- Tenant: "Microsoft"
- Organizations: "Microsoft Azure", "Microsoft Office", "Microsoft Gaming"
- Each org has separate teams/users but shares the same tenant account

**Current status:**

- ✅ Schema defined with `tenantId` relationship
- ✅ Middleware can resolve organizations
- ⚠️ **Not actively used** - You're single-tenant, so no need for
  sub-organizations
- **When to activate:** If a tenant needs multiple departments/divisions

**Fields explained:**

- `tenantId`: Links to parent Tenant
- `slug`: URL-friendly identifier
- `domain`: Optional custom subdomain
- `settings`: Organization-specific configurations

---

### Pixel Configuration Tables

#### **3. InstagramPixelConfig Table**

**Purpose:** Stores configuration for Instagram Pixel tracking (Meta's
advertising pixel).

**What it does:**

- Tracks user behavior on your website for Instagram advertising
- Allows you to:
  - Create custom audiences (people who visited your site)
  - Track conversions (purchases, signups)
  - Optimize ad delivery
  - Measure ad performance

**Real-world example:**

- User visits your product page → Instagram Pixel fires
- User later sees your Instagram ad → Pixel tracks the click
- User purchases → Pixel tracks conversion
- You can now see: "Instagram ads generated $5,000 in sales"

**Current status:**

- ✅ Schema defined with `pixelId`, `accessToken`, `isActive`
- ❌ **Not implemented** - No code uses this table
- **Why:** You're using Facebook Pixel (which tracks both Facebook AND
  Instagram)
- **When to activate:** If you need separate Instagram-only tracking

**Fields explained:**

- `pixelId`: Your Instagram Pixel ID from Meta Business Manager
- `accessToken`: API token for syncing data
- `isActive`: Enable/disable tracking
- `lastSyncAt`: Last time data was synced with Instagram

---

#### **4. TikTokPixelConfig Table**

**Purpose:** Stores configuration for TikTok Pixel tracking (TikTok's
advertising pixel).

**What it does:**

- Similar to Instagram Pixel but for TikTok ads
- Tracks website events for TikTok advertising campaigns
- Enables TikTok ad optimization and conversion tracking

**Real-world example:**

- User views product on your site → TikTok Pixel fires
- User sees TikTok ad → Pixel tracks engagement
- User purchases → Conversion tracked
- You can measure TikTok ad ROI

**Current status:**

- ✅ Schema defined with same structure as Instagram Pixel
- ❌ **Not implemented** - No code uses this table
- **Why:** You're not currently advertising on TikTok
- **When to activate:** When you start TikTok advertising campaigns

**Fields explained:**

- Same as InstagramPixelConfig
- `pixelId`: TikTok Pixel ID from TikTok Ads Manager
- `accessToken`: TikTok API access token

---

### AI Job System

#### **5. AiJob Table**

**Purpose:** Tracks background AI processing jobs (image generation, content
enhancement, etc.).

**What it does:**

- Stores AI job requests and results
- Tracks job status (pending, processing, completed, failed)
- Stores input data and AI-generated output
- Links jobs to users who requested them

**Real-world example:**

- User requests: "Generate product description for this toy"
- Job created in `AiJob` table with status "pending"
- AI service processes request
- Job updated with status "completed" and generated description
- User receives result

**Current status:**

- ✅ Schema defined with: `type`, `status`, `input`, `result`, `error`
- ✅ User relationship exists
- ⚠️ **Prepared but not active** - No AI features currently use this
- **When to activate:** When you implement AI features like:
  - Auto-generating product descriptions
  - Image generation/editing
  - Content translation
  - SEO optimization suggestions

**Fields explained:**

- `type`: Job type (e.g., "generate_description", "enhance_image")
- `status`: "pending", "processing", "completed", "failed"
- `input`: What the user requested (JSON or text)
- `result`: AI-generated output
- `error`: Error message if job failed
- `startedAt`/`completedAt`: Timing information

---

## ❌ Schema Only / Not Functional (8 tables - 10%)

### Database Sharding

#### **6. UserShard Table**

**Purpose:** Manages horizontal database scaling by distributing users across
multiple database instances (shards).

**What it does:**

- When you have millions of users, one database becomes slow
- Sharding splits users across multiple databases:
  - Shard 1: Users A-F (1 million users)
  - Shard 2: Users G-M (1 million users)
  - Shard 3: Users N-Z (1 million users)
- Each shard is a separate database server
- This table tracks which shard each user belongs to

**Real-world example:**

- **Without sharding:** 10 million users in one database → slow queries
- **With sharding:**
  - 10 shards, 1 million users each
  - User lookup: "Find user in shard 3" → fast query
  - Parallel processing across shards

**Current status:**

- ✅ Schema fully defined with comprehensive fields:
  - `shardId`: Unique identifier for each shard
  - `databaseUrl`: Connection string to shard database
  - `capacity`: Max users per shard (default: 1 million)
  - `currentUsers`: How many users are in this shard
  - `region`: Geographic location of shard
  - `readReplicas`: Backup read-only databases
  - `healthStatus`: Is shard healthy?
  - `failoverPriority`: Which shard to use if this one fails
- ✅ User model has `shardId` field
- ❌ **Not implemented** - No code routes users to shards
- **When to activate:** When you have 500,000+ users and database performance
  degrades

**Why you don't need it now:**

- Your current user base fits in one database
- Sharding adds complexity (cross-shard queries, data migration, etc.)
- Only needed at massive scale (millions of users)

**Fields explained:**

- `shardId`: Unique identifier (e.g., "shard-1", "shard-2")
- `databaseUrl`: PostgreSQL connection string for this shard
- `capacity`: Maximum users before creating new shard
- `currentUsers`: Current user count (for load balancing)
- `region`: Geographic region (e.g., "us-east", "eu-west")
- `readReplicas`: JSON array of read-only replica URLs
- `writeEndpoint`: Primary database for writes
- `readEndpoints`: Read-only replicas for load distribution
- `healthStatus`: "HEALTHY", "DEGRADED", "DOWN"
- `failoverPriority`: Lower number = higher priority if shard fails
- `backupSchedule`: When to backup this shard
- `migrationStatus`: "NONE", "IN_PROGRESS", "COMPLETED" (for moving users
  between shards)

---

## Summary Table

| Table                    | Purpose                     | Status             | When to Activate              |
| ------------------------ | --------------------------- | ------------------ | ----------------------------- |
| **Tenant**               | Multi-tenant SaaS support   | ⚠️ Ready, not used | When selling platform as SaaS |
| **Organization**         | Sub-orgs within tenants     | ⚠️ Ready, not used | When tenants need departments |
| **InstagramPixelConfig** | Instagram ad tracking       | ❌ Schema only     | When running Instagram ads    |
| **TikTokPixelConfig**    | TikTok ad tracking          | ❌ Schema only     | When running TikTok ads       |
| **AiJob**                | AI background jobs          | ⚠️ Prepared        | When implementing AI features |
| **UserShard**            | Database horizontal scaling | ❌ Schema only     | When you have 500K+ users     |

---

## Key Insights

### Why These Tables Exist But Aren't Used

1. **Future-proofing:** Your schema is designed for growth
   - Multi-tenancy: Ready if you pivot to SaaS
   - Sharding: Ready for massive scale
   - AI jobs: Ready for AI features

2. **Optional features:** Some tables are for features you haven't enabled
   - Instagram/TikTok pixels: Only needed if advertising on those platforms
   - Currently using Facebook Pixel which covers both Facebook and Instagram

3. **Current deployment:** You're running single-tenant, single-database
   - This is perfectly fine for your current scale
   - These tables are "insurance" for future needs

### Should You Remove Them?

**No!** Keep them because:

- ✅ They don't hurt performance (empty tables are fine)
- ✅ They're ready when you need them
- ✅ Removing them would require migrations if you need them later
- ✅ They document your architecture's scalability

### When to Activate Each Feature

1. **Multi-tenancy (Tenant/Organization):**
   - When: You want to sell your platform to other companies
   - Effort: Medium (need to add tenant filtering to all queries)
   - Benefit: New revenue stream (SaaS model)

2. **Database Sharding (UserShard):**
   - When: Database queries become slow with 500K+ users
   - Effort: High (complex data migration, query routing)
   - Benefit: Handles millions of users

3. **Instagram/TikTok Pixels:**
   - When: You start advertising on those platforms
   - Effort: Low (just add pixel code)
   - Benefit: Better ad tracking and optimization

4. **AI Jobs (AiJob):**
   - When: You implement AI features
   - Effort: Medium (need to build job processing system)
   - Benefit: Background AI processing without blocking users

---

**End of Document**
