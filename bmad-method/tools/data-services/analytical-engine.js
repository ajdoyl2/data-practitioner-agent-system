/**
 * Analytical Engine Service
 * DuckDB integration for embedded analytical operations
 */

const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const yaml = require('js-yaml');

const DuckDBWrapper = require('./duckdb-wrapper');
const { requireFeatureMiddleware, isFeatureEnabled } = require('../lib/feature-flag-manager');
const { securityLogger } = require('../lib/security-logger');
const { verifyApiKey, requireScope } = require('./auth-middleware');
const MemoryManager = require('../lib/memory-manager');

class AnalyticalEngine {
  constructor(options = {}) {
    this.port = options.port || 3002;
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.duckdbPath = options.duckdbPath || path.join(process.cwd(), '.duckdb');
    this.cachePath = options.cachePath || path.join(process.cwd(), '.cache', 'analytics');
    
    // Initialize DuckDB wrapper
    this.duckdb = new DuckDBWrapper({
      databasePath: path.join(this.duckdbPath, 'analytics.db'),
      memoryLimit: options.memoryLimit || '4GB',
      maxConnections: options.maxConnections || 10
    });
    
    // Initialize memory manager
    this.memoryManager = new MemoryManager({
      maxMemoryUsage: options.memoryLimit || '4GB'
    });
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Query cache
    this.queryCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 100;
    
    // Ensure directories exist
    fs.ensureDirSync(this.configPath);
    fs.ensureDirSync(this.duckdbPath);
    fs.ensureDirSync(this.cachePath);
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      securityLogger.logApiRequest({
        service: 'analytical-engine',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'analytical-engine',
        timestamp: new Date().toISOString(),
        features: {
          duckdb_analytics: isFeatureEnabled('duckdb_analytics')
        },
        duckdb: {
          available: this.duckdb.isAvailable(),
          version: this.duckdb.getVersion()
        }
      });
    });

    // Feature flag check middleware for all analytics endpoints
    this.app.use('/api/v1/analytics*', requireFeatureMiddleware('duckdb_analytics'));
    
    // Authentication middleware for all analytics endpoints
    this.app.use('/api/v1/analytics*', verifyApiKey);
    this.app.use('/api/v1/analytics*', requireScope('data_read'));

    // Analytics endpoints
    this.app.post('/api/v1/analytics/query', this.executeQuery.bind(this));
    this.app.get('/api/v1/analytics/tables', this.listTables.bind(this));
    this.app.get('/api/v1/analytics/schema/:table', this.getTableSchema.bind(this));
    this.app.post('/api/v1/analytics/load-data', this.loadDataFromSource.bind(this));
    this.app.delete('/api/v1/analytics/table/:table', this.dropTable.bind(this));
    
    // Query management endpoints
    this.app.get('/api/v1/analytics/queries/history', this.getQueryHistory.bind(this));
    this.app.get('/api/v1/analytics/cache/info', this.getCacheInfo.bind(this));
    this.app.delete('/api/v1/analytics/cache', this.clearCache.bind(this));
    
    // Performance monitoring
    this.app.get('/api/v1/analytics/performance', this.getPerformanceMetrics.bind(this));

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Execute SQL query
   */
  async executeQuery(req, res) {
    try {
      const { query, parameters = {}, options = {} } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid query parameter'
        });
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(query, parameters);
      if (options.useCache !== false && this.queryCache.has(cacheKey)) {
        const cachedResult = this.queryCache.get(cacheKey);
        
        securityLogger.logAnalyticsQuery({
          query_hash: this.hashQuery(query),
          cached: true,
          execution_time: 0,
          result_count: cachedResult.data.length,
          timestamp: new Date().toISOString()
        });

        return res.json({
          success: true,
          data: cachedResult.data,
          metadata: cachedResult.metadata,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Monitor memory usage
      const memoryBefore = await this.memoryManager.getCurrentUsage();
      const startTime = Date.now();

      // Execute query
      const result = await this.duckdb.execute(query, parameters, {
        timeout: options.timeout || 30000,
        maxRows: options.maxRows || 10000
      });

      const executionTime = Date.now() - startTime;
      const memoryAfter = await this.memoryManager.getCurrentUsage();

      // Cache result if enabled
      if (options.useCache !== false && result.success) {
        this.cacheQueryResult(cacheKey, result);
      }

      securityLogger.logAnalyticsQuery({
        query_hash: this.hashQuery(query),
        execution_time: executionTime,
        memory_delta: memoryAfter - memoryBefore,
        result_count: result.data?.length || 0,
        success: result.success,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: result.success,
        data: result.data,
        metadata: {
          ...result.metadata,
          execution_time: executionTime,
          memory_usage: memoryAfter - memoryBefore
        },
        cached: false,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to execute query');
    }
  }

  /**
   * List all tables in database
   */
  async listTables(req, res) {
    try {
      const tables = await this.duckdb.listTables();
      
      res.json({
        success: true,
        data: { tables },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to list tables');
    }
  }

  /**
   * Get table schema information
   */
  async getTableSchema(req, res) {
    try {
      const { table } = req.params;
      
      if (!table) {
        return res.status(400).json({
          error: 'Table name is required'
        });
      }

      const schema = await this.duckdb.getTableSchema(table);
      
      res.json({
        success: true,
        data: schema,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get table schema');
    }
  }

  /**
   * Load data from external source into DuckDB
   */
  async loadDataFromSource(req, res) {
    try {
      const { 
        source_type, 
        source_path, 
        table_name, 
        options = {},
        schema_override 
      } = req.body;
      
      if (!source_type || !source_path || !table_name) {
        return res.status(400).json({
          error: 'Missing required fields: source_type, source_path, table_name'
        });
      }

      const startTime = Date.now();
      const result = await this.duckdb.loadDataFromFile(
        source_type, 
        source_path, 
        table_name, 
        options,
        schema_override
      );

      const loadTime = Date.now() - startTime;

      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to load data',
          details: result.error
        });
      }

      securityLogger.logDataLoad({
        source_type,
        table_name,
        load_time: loadTime,
        rows_loaded: result.rows_affected,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: result,
        metadata: {
          load_time: loadTime,
          rows_loaded: result.rows_affected
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to load data');
    }
  }

  /**
   * Drop table
   */
  async dropTable(req, res) {
    try {
      const { table } = req.params;
      const { cascade = false } = req.query;
      
      if (!table) {
        return res.status(400).json({
          error: 'Table name is required'
        });
      }

      const result = await this.duckdb.dropTable(table, { cascade });
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to drop table',
          details: result.error
        });
      }

      securityLogger.logTableDrop({
        table_name: table,
        cascade,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: { table, dropped: true },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to drop table');
    }
  }

  /**
   * Get query history
   */
  async getQueryHistory(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      // In a real implementation, this would come from a persistent store
      // For now, return empty array as placeholder
      const history = [];
      
      res.json({
        success: true,
        data: {
          queries: history,
          total: history.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get query history');
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(req, res) {
    try {
      const cacheInfo = {
        size: this.queryCache.size,
        maxSize: this.maxCacheSize,
        utilization: this.queryCache.size / this.maxCacheSize,
        keys: Array.from(this.queryCache.keys())
      };
      
      res.json({
        success: true,
        data: cacheInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get cache info');
    }
  }

  /**
   * Clear query cache
   */
  async clearCache(req, res) {
    try {
      const sizeBefore = this.queryCache.size;
      this.queryCache.clear();
      
      res.json({
        success: true,
        data: {
          cleared: sizeBefore,
          remaining: this.queryCache.size
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to clear cache');
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req, res) {
    try {
      const memoryUsage = await this.memoryManager.getCurrentUsage();
      const duckdbStats = await this.duckdb.getStats();
      
      const metrics = {
        memory_usage: memoryUsage,
        duckdb_stats: duckdbStats,
        cache_hit_rate: this.calculateCacheHitRate(),
        active_connections: this.duckdb.getActiveConnections(),
        uptime: process.uptime()
      };
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get performance metrics');
    }
  }

  /**
   * Generate cache key for query
   */
  generateCacheKey(query, parameters) {
    const crypto = require('crypto');
    const content = JSON.stringify({ query, parameters });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Hash query for logging (remove sensitive data)
   */
  hashQuery(query) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(query).digest('hex').substring(0, 16);
  }

  /**
   * Cache query result
   */
  cacheQueryResult(key, result) {
    // Implement LRU eviction if cache is full
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
    
    this.queryCache.set(key, {
      data: result.data,
      metadata: result.metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    // This would be tracked over time in a real implementation
    return 0.0;
  }

  /**
   * Handle errors consistently
   */
  handleError(res, error, message = 'Internal server error') {
    console.error(`${message}:`, error);
    
    securityLogger.logApiError({
      service: 'analytical-engine',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: message,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Error handling middleware
   */
  errorHandler(error, req, res, next) {
    this.handleError(res, error);
  }

  /**
   * Start the service
   */
  async start() {
    try {
      // Initialize DuckDB
      await this.duckdb.initialize();
      
      console.log('✅ DuckDB analytical engine initialized');
      
      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Analytical Engine running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        
        securityLogger.logServiceStart({
          service: 'analytical-engine',
          port: this.port,
          duckdb_available: this.duckdb.isAvailable(),
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Failed to start Analytical Engine:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Analytical Engine stopped');
          resolve();
        });
      });
    }
    
    // Close DuckDB connections
    if (this.duckdb) {
      await this.duckdb.close();
    }
  }
}

module.exports = AnalyticalEngine;