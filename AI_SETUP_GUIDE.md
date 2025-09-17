# AI Bulk Upload Setup Guide

## Overview

The AI Bulk Upload feature allows you to enhance product data using AI services
like OpenAI, Anthropic, or Google Gemini. This guide will help you set up the
necessary API keys and configuration.

## Issues Fixed

✅ **Fixed TypeError: Failed to fetch error** - The main issue was missing AI
API keys and improved error handling ✅ **Fixed environment configuration syntax
error** - Resolved reserved word conflict in TypeScript ✅ **Improved error
messages** - Better error handling with detailed setup instructions ✅
**Enhanced frontend error display** - More informative error messages in the UI

## Prerequisites

1. **Admin Access**: You must be logged in as an admin to use AI enhancement
2. **API Keys**: At least one AI service API key is required
3. **Environment Variables**: Proper configuration in your `.env` file

## Step 1: Get AI API Keys

### Option 1: OpenAI (Recommended)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### Option 2: Anthropic

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-ant-`)

### Option 3: Google Gemini

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

### Option A: Single Provider (Gemini Only)

```bash
# AI Configuration - Gemini Only
GEMINI_API_KEY=AIzaSyDff9i1dRYfWAi0aDg1wCrjCp8zbmbTKbI

# AI Settings
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-pro
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_ENHANCEMENT_ENABLED=true

# Required for authentication
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Database (required)
DATABASE_URL=your-database-connection-string
```

### Option B: Dual Provider (Recommended)

```bash
# AI Configuration - Dual Provider
GEMINI_API_KEY=AIzaSyDff9i1dRYfWAi0aDg1wCrjCp8zbmbTKbI
OPENAI_API_KEY=sk-your-openai-api-key-here

# AI Settings
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-pro
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_ENHANCEMENT_ENABLED=true
AI_DUAL_PROVIDER_ENABLED=true

# Required for authentication
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Database (required)
DATABASE_URL=your-database-connection-string
```

## Step 3: Verify Configuration

Run the configuration checker:

```bash
node test-ai-config.js
```

You should see:

```
✅ AI Configuration:
  Provider: openai
  Model: gpt-4
  Max Tokens: 2000
  Temperature: 0.7
  Enhancement Enabled: ✅

🔑 API Key Status:
  OpenAI: ✅ Configured
  Is Configured: ✅

🎉 AI Bulk Upload system is ready to use!
```

## Step 4: Test the System

1. **Start the development server**:

   ```bash
   pnpm run dev
   ```

2. **Access the admin panel**:
   - Go to `http://localhost:3000/admin/products`
   - Make sure you're logged in as an admin

3. **Test AI Enhancement**:
   - Click on "Bulk Upload" or "AI-Enhanced Bulk Upload"
   - Upload a CSV/Excel file with product data
   - Enable AI enhancement
   - Click "Enhance with AI"

## Troubleshooting

### Error: "AI service not configured"

- **Cause**: No API keys are set in environment variables
- **Solution**: Add at least one API key to your `.env` file

### Error: "Not authorized"

- **Cause**: Not logged in as admin
- **Solution**: Log in with an admin account

### Error: "AI enhancement disabled"

- **Cause**: `AI_ENHANCEMENT_ENABLED=false` or not set
- **Solution**: Set `AI_ENHANCEMENT_ENABLED=true` in your `.env` file

### Error: "Rate limit exceeded"

- **Cause**: Too many API requests
- **Solution**: Wait a few minutes and try again, or upgrade your API plan

### Error: "Invalid API key"

- **Cause**: Incorrect or expired API key
- **Solution**: Verify your API key is correct and active

### Error: "You exceeded your current quota"

- **Cause**: The provided Gemini API key has reached its quota limit
- **Solution**: Create your own API key at
  [Google AI Studio](https://makersuite.google.com/app/apikey) or upgrade the
  existing key's quota limits

## Features

### AI Enhancement Options

- ✅ **Romanian Optimization**: Romanian market-specific content
- ✅ **SEO Metadata**: Meta titles, descriptions, and keywords
- ✅ **Learning Outcomes**: Educational benefits and skills
- ✅ **Age Group Classification**: Appropriate age ranges
- ✅ **STEM Discipline**: Science, Technology, Engineering, Math
- ✅ **Product Type**: Robotics, Puzzles, Construction Sets, etc.
- ✅ **Dual-Provider Mode**: Combine Gemini and OpenAI for optimal results

### Dual-Provider Enhancement

The system now supports a two-stage enhancement pipeline:

1. **Initial Generation** with Gemini (free tier) for bulk content creation
2. **Refinement & Validation** with OpenAI for quality assurance

This approach offers:

- **Cost Optimization**: Using Gemini's free quota for the heavy lifting
- **Quality Control**: Using OpenAI to verify and improve the content
- **Better Database Compatibility**: Ensuring content meets schema requirements
- **Enhanced SEO**: Multiple models collaborating on better search optimization

### Supported File Formats

- CSV files (.csv)
- Excel files (.xls, .xlsx)

### Batch Processing

- Processes multiple products simultaneously
- Progress tracking with real-time updates
- Error handling for individual products
- Memory optimization for large batches

## API Endpoints

### Standard AI Enhancement (Single Provider)

#### GET `/api/admin/products/ai-enhance`

- **Purpose**: Check AI service health and configuration
- **Auth**: Admin required
- **Response**: Service status and configuration

#### POST `/api/admin/products/ai-enhance`

- **Purpose**: Enhance products with single AI provider
- **Auth**: Admin required
- **Body**: `{ products: BasicProduct[], options: EnhancementOptions }`
- **Response**: Enhanced products with AI-generated content

### Dual-Provider AI Enhancement

#### GET `/api/admin/products/dual-enhance`

- **Purpose**: Check dual-provider mode availability and configuration
- **Auth**: Admin required
- **Response**: Dual-mode status and configuration

#### POST `/api/admin/products/dual-enhance`

- **Purpose**: Enhance products using both Gemini and OpenAI in sequence
- **Auth**: Admin required
- **Body**:
  ```
  {
    products: BasicProduct[],
    options: EnhancementOptions,
    config: {
      primaryProvider: "gemini",
      primaryModel: "gemini-1.5-pro",
      secondaryProvider: "openai",
      secondaryModel: "gpt-3.5-turbo",
      refinementOptions: {
        validateContent: true,
        improveSEO: true,
        fixGrammar: true,
        ensureDbCompatibility: true
      }
    }
  }
  ```
- **Response**: Enhanced products with dual AI processing and refinements

## Cost Considerations

### OpenAI Pricing (as of 2024)

- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- GPT-3.5-turbo: ~$0.001 per 1K input tokens, ~$0.002 per 1K output tokens

### Gemini Pricing (as of 2024)

- Gemini 1.5 Pro: ~$0.00025 per 1K input tokens, ~$0.0005 per 1K output tokens
- **Free tier**: Limited quota available each month at no cost

### Estimated Costs

#### Single Provider (OpenAI)

- **Small batch (10 products)**: ~$0.50-1.00
- **Medium batch (50 products)**: ~$2.50-5.00
- **Large batch (100 products)**: ~$5.00-10.00

#### Dual Provider (Gemini + OpenAI)

- **Small batch (10 products)**: ~$0.25-0.50 (50% savings)
- **Medium batch (50 products)**: ~$1.25-2.50 (50% savings)
- **Large batch (100 products)**: ~$2.50-5.00 (50% savings)

_Costs vary based on product description length and enhancement options_

> **Cost Optimization Tip**: Using the dual provider approach with Gemini for
> initial generation can reduce costs by up to 50-70% while maintaining high
> quality output.

## Security Notes

- 🔒 API keys are stored in environment variables (never commit to git)
- 🔒 Admin authentication required for all AI operations
- 🔒 Rate limiting prevents abuse
- 🔒 Input validation and sanitization
- 🔒 Error messages don't expose sensitive information

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your API keys are correct and active
3. Ensure you have sufficient API credits/quota
4. Check the server logs for backend errors
5. Run the configuration checker: `node test-ai-config.js`

## Next Steps

Once configured, you can:

- Upload product spreadsheets with basic information
- Let AI enhance descriptions, SEO metadata, and categorization
- Review and edit AI-generated content before publishing
- Export enhanced products back to your system
- Monitor usage, costs, and performance through the AI dashboard

The AI enhancement will significantly improve your product data quality and SEO
performance!

## Monitoring & Usage Tracking

The system now includes comprehensive monitoring features:

- **Usage Dashboard**: Access AI usage statistics at `/admin/ai-monitoring`
- **Cost Tracking**: Monitor token usage and estimated costs
- **Performance Metrics**: Track response times, error rates, and system health
- **Export Data**: Download usage reports in CSV format
- **Usage Alerts**: Get warnings when approaching budget thresholds

Run the following command to verify AI configuration and test the connection:

```bash
node scripts/test-ai-config.js
```

This script will validate your environment variables, API keys, and run a simple
enhancement test.
