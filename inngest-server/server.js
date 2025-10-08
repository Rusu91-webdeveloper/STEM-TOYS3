/**
 * Standalone Inngest Server for Railway Deployment
 * 
 * This server runs only the Inngest endpoint to bypass Vercel Hobby plan timeout limits.
 * It imports the Inngest functions from the parent directory and serves them via Express.
 */

import 'dotenv/config';
import express from 'express';
import { serve } from 'inngest/express';

// Import from parent directory (main app)
import { inngest } from '../inngest/client.js';
import { generateBlogJob } from '../inngest/functions/generate-blog.js';
import { enhanceProductsJob } from '../inngest/functions/enhance-products.js';
import { bulkUploadProductsJob } from '../inngest/functions/bulk-upload-products.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware for JSON parsing
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'inngest-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Inngest Server',
    description: 'Standalone Inngest endpoint for blog generation',
    endpoints: {
      health: '/health',
      inngest: '/api/inngest'
    }
  });
});

// Inngest endpoint - this is what Inngest Cloud will call
const inngestHandler = serve({
  client: inngest,
  functions: [
    generateBlogJob,
    enhanceProductsJob,
    bulkUploadProductsJob
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Mount Inngest handler
app.use('/api/inngest', inngestHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Inngest Server Started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔧 Inngest: http://localhost:${PORT}/api/inngest`);
  console.log('');
  console.log('✅ Server ready to receive Inngest function calls');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

