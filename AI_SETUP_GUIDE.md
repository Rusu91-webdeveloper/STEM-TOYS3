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

```bash
# AI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
# GEMINI_API_KEY=your-gemini-api-key-here

# AI Settings
AI_PROVIDER=openai
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_ENHANCEMENT_ENABLED=true

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

## Features

### AI Enhancement Options

- ✅ **Romanian Optimization**: Romanian market-specific content
- ✅ **SEO Metadata**: Meta titles, descriptions, and keywords
- ✅ **Learning Outcomes**: Educational benefits and skills
- ✅ **Age Group Classification**: Appropriate age ranges
- ✅ **STEM Discipline**: Science, Technology, Engineering, Math
- ✅ **Product Type**: Robotics, Puzzles, Construction Sets, etc.

### Supported File Formats

- CSV files (.csv)
- Excel files (.xls, .xlsx)

### Batch Processing

- Processes multiple products simultaneously
- Progress tracking with real-time updates
- Error handling for individual products
- Memory optimization for large batches

## API Endpoints

### GET `/api/admin/products/ai-enhance`

- **Purpose**: Check AI service health and configuration
- **Auth**: Admin required
- **Response**: Service status and configuration

### POST `/api/admin/products/ai-enhance`

- **Purpose**: Enhance products with AI
- **Auth**: Admin required
- **Body**: `{ products: BasicProduct[], options: EnhancementOptions }`
- **Response**: Enhanced products with AI-generated content

## Cost Considerations

### OpenAI Pricing (as of 2024)

- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- GPT-3.5-turbo: ~$0.001 per 1K input tokens, ~$0.002 per 1K output tokens

### Estimated Costs

- **Small batch (10 products)**: ~$0.50-1.00
- **Medium batch (50 products)**: ~$2.50-5.00
- **Large batch (100 products)**: ~$5.00-10.00

_Costs vary based on product description length and enhancement options_

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

The AI enhancement will significantly improve your product data quality and SEO
performance!
