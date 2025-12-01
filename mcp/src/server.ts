/**
 * LRF Riksdag & Regering MCP Server - M365 Copilot Compatible
 *
 * Microsoft 365 Copilot-kompatibel HTTP server som använder StreamableHTTPServerTransport.
 * Optimerad för deployment på Render.com och M365 Copilot Studio integration.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import winston from 'winston';
import { createMCPServer } from './core/mcpServer.js';
import { getSyncStatus } from './tools/health.js';

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create and configure Express app
 */
function createApp() {
  const app = express();

  // Trust proxy - required for Render.com and rate limiting
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/mcp', limiter);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const sync = await getSyncStatus();
      res.json({
        status: 'ok',
        service: 'lrf-riksdag-regering-mcp',
        version: '3.0.0',
        transport: 'StreamableHTTP',
        m365Compatible: true,
        timestamp: new Date().toISOString(),
        sync,
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        service: 'lrf-riksdag-regering-mcp',
        version: '3.0.0',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MCP Server instance
  const mcpServer = createMCPServer(logger);

  // GET handler for /mcp - Information page
  app.get('/mcp', (req, res) => {
    res.json({
      service: 'LRF Riksdag & Regering MCP',
      version: '3.0.0',
      description: 'M365 Copilot-kompatibel MCP Server för Riksdagen och Regeringskansliet',
      transport: 'StreamableHTTP',
      status: 'operational',
      m365Copilot: {
        compatible: true,
        setupInstructions: 'Use Microsoft Copilot Studio: Tools → Add Tool → Model Context Protocol',
        serverUrl: req.protocol + '://' + req.get('host') + '/mcp',
        authentication: 'None (public access) or configure API key in Copilot Studio'
      },
      capabilities: {
        tools: true,
        resources: true,
        prompts: false
      },
      statistics: {
        tools: 27,
        resources: 5,
        totalRecords: '14,372+'
      },
      sources: ['Riksdagen Öppna Data', 'Regeringskansliet'],
      endpoints: {
        '/health': 'GET - Health check and sync status',
        '/mcp': 'POST - MCP protocol endpoint (StreamableHTTP)'
      },
      documentation: 'See README.md for full documentation'
    });
  });

  // Main MCP endpoint - StreamableHTTP transport (M365 Copilot compatible)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // Create new transport for each request to prevent session conflicts
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
        enableJsonResponse: true
      });

      // Cleanup on client disconnect
      res.on('close', () => {
        transport.close();
      });

      // Connect server to transport
      await mcpServer.connect(transport);

      // Handle the MCP request
      await transport.handleRequest(req, res, req.body);

      logger.info('[MCP] Request handled successfully', {
        method: req.body?.method,
        hasParams: !!req.body?.params
      });
    } catch (error) {
      logger.error('[MCP] Error handling request:', error);

      // Only send error response if headers not already sent
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: {
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          },
          id: req.body?.id || null
        });
      }
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      availableEndpoints: ['/health', '/mcp']
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    }
  });

  return app;
}

/**
 * Start the server
 */
async function main() {
  try {
    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`🚀 LRF Riksdag & Regering MCP Server v3.0 started`);
      logger.info(`📡 HTTP Server listening on port ${PORT}`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`✨ Transport: StreamableHTTP (M365 Copilot Compatible)`);
      logger.info(`\nEndpoints:`);
      logger.info(`  GET  /health - Health check and sync status`);
      logger.info(`  GET  /mcp    - Server information`);
      logger.info(`  POST /mcp    - MCP protocol endpoint (StreamableHTTP)`);
      logger.info(`\nM365 Copilot Studio Setup:`);
      logger.info(`  1. Open Copilot Studio`);
      logger.info(`  2. Tools → Add Tool → Model Context Protocol`);
      logger.info(`  3. Enter server URL: http://localhost:${PORT}/mcp`);
      logger.info(`  4. Configure authentication (None for development)`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main();
