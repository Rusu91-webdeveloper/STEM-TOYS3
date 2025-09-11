# AI Bulk Upload User Guide

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Using the AI Enhancement Features](#using-the-ai-enhancement-features)
- [Bulk Upload Process](#bulk-upload-process)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Overview

The AI Bulk Upload system is designed to streamline product creation for STEM
toys by automatically generating high-quality, SEO-optimized content. This
system can reduce your product creation time by 80-90% while ensuring
consistency and quality across all products.

### Key Features

- **AI-Powered Content Generation**: Automatically creates compelling product
  descriptions
- **SEO Optimization**: Generates meta titles, descriptions, and keywords
- **Romanian Market Compliance**: Ensures content aligns with Romanian
  educational standards
- **Batch Processing**: Handle hundreds of products efficiently
- **Real-time Monitoring**: Track progress and system health
- **Quality Control**: Review and edit AI-generated content before publishing

## Getting Started

### Prerequisites

1. **Admin Access**: You must have admin privileges to use the AI enhancement
   features
2. **AI Configuration**: The system must be configured with valid AI API keys
3. **Product Data**: Prepare your product information in the correct format

### Accessing the Feature

1. Navigate to the Admin Dashboard
2. Go to **Products** → **Bulk Upload**
3. You'll see the enhanced bulk upload interface with AI options

## Using the AI Enhancement Features

### 1. AI Enhancement Toggle

The AI Enhancement toggle allows you to enable or disable AI-powered content
generation for your bulk upload.

**Location**: Top of the bulk upload form

**Options**:

- ✅ **Enable AI Enhancement**: Turn on AI content generation
- ❌ **Disable AI Enhancement**: Use only your provided content

### 2. AI Enhancement Options

When AI enhancement is enabled, you can configure which types of content to
generate:

#### Content Generation Options

- **✅ Romanian Market Optimization**
  - Generates Romanian educational competencies
  - Aligns with Romanian curriculum standards
  - Sets appropriate educational levels
  - Determines ministry approval status

- **✅ SEO Metadata**
  - Creates optimized meta titles (50-60 characters)
  - Generates meta descriptions (150-160 characters)
  - Produces relevant keywords (10-15 keywords)

- **✅ Learning Outcomes**
  - Identifies key learning objectives
  - Maps to educational competencies
  - Suggests age-appropriate outcomes

- **✅ Age Group Classification**
  - Automatically determines target age groups
  - Maps to educational levels
  - Ensures age-appropriate content

- **✅ STEM Discipline**
  - Classifies products by STEM category
  - Identifies primary learning areas
  - Suggests related disciplines

- **✅ Product Type**
  - Categorizes by product type
  - Identifies learning methodology
  - Suggests usage patterns

### 3. AI Enhancement Preview

After AI processing, you can review and edit the generated content:

#### Preview Interface

- **Side-by-side Comparison**: Original vs. AI-enhanced content
- **Edit Capabilities**: Modify any AI-generated content
- **Accept/Reject Options**: Approve or discard changes
- **Batch Actions**: Apply decisions to multiple products

#### Content Sections

1. **Enhanced Description**
   - Original description vs. AI-generated version
   - Word count and readability metrics
   - Educational focus highlights

2. **SEO Metadata**
   - Meta title with character count
   - Meta description with character count
   - Keyword suggestions with relevance scores

3. **Romanian Content**
   - Educational competencies
   - Curriculum alignment
   - Ministry approval status
   - Educational certification details

4. **Categorization**
   - Age group recommendations
   - STEM discipline classification
   - Product type identification
   - Learning outcomes mapping

## Bulk Upload Process

### Step 1: Prepare Your Data

#### Required Fields

- **Name**: Product name (required)
- **Price**: Product price in RON (required)
- **Category**: Product category (required)
- **Description**: Basic product description (optional but recommended)

#### Optional Fields

- **Images**: Product image URLs
- **SKU**: Product SKU
- **Stock Quantity**: Available inventory
- **Weight**: Product weight
- **Tags**: Existing product tags

#### Data Format

Use CSV or Excel format with the following columns:

```csv
name,price,category,description,images,sku,stockQuantity,weight,tags
"Robot Kit",299.99,"Robotics","Basic robotics kit","image1.jpg,image2.jpg","ROB-001",50,1.5,"robotics,programming"
```

### Step 2: Upload and Configure

1. **Select File**: Choose your CSV/Excel file
2. **Enable AI Enhancement**: Toggle AI features on/off
3. **Configure Options**: Select which AI features to use
4. **Start Upload**: Begin the processing

### Step 3: Monitor Progress

#### Progress Indicators

- **Total Products**: Number of products being processed
- **Processed**: Number of products completed
- **Successful**: Number of products successfully enhanced
- **Failed**: Number of products that failed processing
- **Current Product**: Currently being processed
- **Estimated Time**: Remaining processing time

#### Real-time Updates

- Progress bar with percentage completion
- Live status updates
- Error notifications
- Performance metrics

### Step 4: Review and Edit

#### Content Review

1. **Preview Generated Content**: Review AI-generated descriptions, metadata,
   and Romanian content
2. **Edit as Needed**: Modify any content that doesn't meet your standards
3. **Accept Changes**: Approve the enhanced content
4. **Reject Changes**: Keep original content
5. **Skip Product**: Skip processing for specific products

#### Quality Control

- **Content Accuracy**: Verify educational content accuracy
- **SEO Optimization**: Check meta titles and descriptions
- **Romanian Compliance**: Ensure Romanian educational standards compliance
- **Brand Consistency**: Maintain brand voice and style

### Step 5: Finalize Upload

1. **Review Summary**: Check final processing statistics
2. **Confirm Upload**: Proceed with product creation
3. **Monitor Results**: Track successful product creation

## Monitoring and Health Checks

### Health Dashboard

Access the AI monitoring dashboard to view system status:

**Location**: Admin Dashboard → AI Monitoring

#### Dashboard Sections

1. **Overall Health Status**
   - System health score (0-100%)
   - Health status (Healthy/Degraded/Unhealthy)
   - Active issues and recommendations

2. **Provider Status**
   - AI provider health (OpenAI, Anthropic, Gemini)
   - Response times and error rates
   - Rate limit usage

3. **Performance Metrics**
   - Request success rates
   - Average response times
   - Cache hit rates
   - Batch processing statistics

4. **System Resources**
   - Memory usage
   - Cache statistics
   - Rate limit status
   - Circuit breaker status

5. **Active Alerts**
   - Critical system issues
   - Performance warnings
   - Rate limit violations
   - Memory usage alerts

### Health Check API

You can also check system health programmatically:

```bash
curl "https://your-domain.com/api/admin/ai/health"
```

## Best Practices

### 1. Data Preparation

#### Product Information

- **Clear Descriptions**: Provide detailed, accurate product descriptions
- **Consistent Categories**: Use standardized category names
- **Accurate Pricing**: Ensure prices are correct and in RON
- **Complete Information**: Include all available product details

#### File Organization

- **Clean Data**: Remove duplicates and invalid entries
- **Consistent Format**: Use consistent naming conventions
- **Proper Encoding**: Ensure UTF-8 encoding for Romanian characters
- **File Size**: Keep files under 10MB for optimal performance

### 2. AI Enhancement Usage

#### Content Generation

- **Enable Romanian Optimization**: Always enable for Romanian market
- **Use SEO Metadata**: Generate for better search visibility
- **Include Learning Outcomes**: Essential for educational products
- **Review Generated Content**: Always review before publishing

#### Batch Processing

- **Optimal Batch Size**: Use 10-50 products per batch
- **Monitor Progress**: Watch for errors and performance issues
- **Handle Failures**: Retry failed products individually
- **Quality Control**: Review all generated content

### 3. Performance Optimization

#### System Resources

- **Monitor Memory Usage**: Watch for high memory consumption
- **Check Rate Limits**: Avoid exceeding API rate limits
- **Use Caching**: Leverage built-in caching for repeated requests
- **Batch Processing**: Process products in manageable batches

#### Error Handling

- **Retry Failed Requests**: Implement retry logic for temporary failures
- **Handle Rate Limits**: Wait and retry when rate limited
- **Monitor Alerts**: Respond to system alerts promptly
- **Log Issues**: Keep detailed logs for troubleshooting

### 4. Quality Assurance

#### Content Review

- **Accuracy Check**: Verify educational content accuracy
- **Brand Consistency**: Ensure content matches brand voice
- **SEO Optimization**: Check meta titles and descriptions
- **Romanian Compliance**: Verify Romanian educational standards

#### Testing

- **Small Batches**: Test with small batches first
- **Different Categories**: Test various product categories
- **Edge Cases**: Test with unusual or complex products
- **Performance Testing**: Monitor system performance

## Troubleshooting

### Common Issues

#### 1. AI Enhancement Not Working

**Symptoms**: AI enhancement toggle is disabled or not generating content

**Possible Causes**:

- AI service not configured
- Invalid API keys
- Rate limits exceeded
- Service temporarily unavailable

**Solutions**:

1. Check AI configuration in environment variables
2. Verify API keys are valid and have sufficient credits
3. Check rate limit status in monitoring dashboard
4. Wait for service to recover or contact support

#### 2. Slow Processing

**Symptoms**: Products taking longer than expected to process

**Possible Causes**:

- Large batch size
- High system load
- Network latency
- AI service delays

**Solutions**:

1. Reduce batch size to 10-20 products
2. Check system memory usage
3. Monitor AI service status
4. Use streaming mode for large batches

#### 3. Memory Issues

**Symptoms**: System running out of memory during processing

**Possible Causes**:

- Very large batches
- High memory usage from other processes
- Memory leaks in processing

**Solutions**:

1. Reduce batch size
2. Enable streaming mode
3. Restart the application
4. Monitor memory usage in dashboard

#### 4. Rate Limit Exceeded

**Symptoms**: Requests being rejected due to rate limits

**Possible Causes**:

- Too many requests in short time
- Multiple users processing simultaneously
- AI service rate limits

**Solutions**:

1. Wait for rate limit to reset
2. Reduce request frequency
3. Use smaller batch sizes
4. Check rate limit status in dashboard

#### 5. Content Quality Issues

**Symptoms**: AI-generated content is inaccurate or inappropriate

**Possible Causes**:

- Insufficient input data
- AI model limitations
- Incorrect product categorization

**Solutions**:

1. Provide more detailed product descriptions
2. Review and edit generated content
3. Use more specific categories
4. Adjust AI enhancement options

### Error Messages

#### Common Error Messages

- **"AI enhancement is disabled"**: AI service is not configured or enabled
- **"Rate limit exceeded"**: Too many requests, wait and retry
- **"AI service unavailable"**: AI service is temporarily down
- **"Memory limit exceeded"**: System running out of memory
- **"Validation error"**: Input data format is incorrect

#### Error Resolution

1. **Check Error Details**: Review full error message for specific information
2. **Check System Status**: Use monitoring dashboard to check system health
3. **Retry Request**: For temporary errors, wait and retry
4. **Contact Support**: For persistent issues, contact technical support

## FAQ

### General Questions

**Q: How much time can AI enhancement save?** A: AI enhancement can reduce
product creation time by 80-90%, from hours to minutes per product.

**Q: Is the AI-generated content accurate?** A: The AI generates high-quality
content based on your input, but you should always review and edit as needed.

**Q: Can I use AI enhancement for non-STEM products?** A: The system is
optimized for STEM toys, but can be used for other educational products.

**Q: How many products can I process at once?** A: Recommended batch size is
10-50 products. Larger batches may require streaming mode.

### Technical Questions

**Q: What AI providers are supported?** A: Currently supports OpenAI, Anthropic,
and Gemini (Google).

**Q: How long does processing take?** A: Typically 2-5 seconds per product,
depending on batch size and system load.

**Q: Is my data secure?** A: Yes, all data is processed securely and not stored
by AI providers.

**Q: Can I customize the AI prompts?** A: AI prompts are optimized for STEM
toys, but can be customized by developers.

### Romanian Market Questions

**Q: How does Romanian optimization work?** A: The AI generates content that
aligns with Romanian educational standards and curriculum.

**Q: What Romanian competencies are generated?** A: The system generates
competencies like "Programare", "Logica", "Rezolvare probleme", etc.

**Q: How is ministry approval determined?** A: The AI analyzes product
characteristics to determine if it meets Romanian educational standards.

**Q: Can I edit Romanian content?** A: Yes, all AI-generated content can be
reviewed and edited before publishing.

### Performance Questions

**Q: What's the maximum batch size?** A: No hard limit, but 50 products is
recommended for optimal performance.

**Q: How can I improve processing speed?** A: Use smaller batches, ensure good
system resources, and monitor rate limits.

**Q: What happens if processing fails?** A: Failed products are reported in the
results, and you can retry them individually.

**Q: Can I monitor processing in real-time?** A: Yes, the system provides
real-time progress updates and monitoring.

## Support

### Getting Help

1. **Check Documentation**: Review this guide and API documentation
2. **Monitor Dashboard**: Use the health dashboard to check system status
3. **Review Logs**: Check application logs for detailed error information
4. **Contact Support**: Reach out to the development team with specific issues

### Reporting Issues

When reporting issues, please include:

1. **Error Message**: Full error message and code
2. **Steps to Reproduce**: Detailed steps that led to the issue
3. **System Status**: Current system health and performance
4. **Data Sample**: Sample of the data being processed (anonymized)
5. **Expected vs. Actual**: What you expected vs. what happened

### Feature Requests

To request new features:

1. **Describe the Feature**: Detailed description of the requested feature
2. **Use Case**: Explain how it would improve your workflow
3. **Priority**: Indicate the importance and urgency
4. **Examples**: Provide examples of how it should work

---

_This guide is regularly updated. Check for the latest version and updates._
