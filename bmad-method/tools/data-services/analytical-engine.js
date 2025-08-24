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
const EDAEngine = require('./eda-engine');
const HypothesisGenerator = require('./hypothesis-generator');
const StatisticalTester = require('./statistical-tester');

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
    
    // Initialize EDA engine
    this.edaEngine = new EDAEngine({
      cachePath: path.join(this.cachePath, 'eda'),
      timeout: options.edaTimeout || 600000, // 10 minutes
      maxDatasetSize: options.maxDatasetSize || 1000000,
      samplingThreshold: options.samplingThreshold || 500000
    });
    
    // Initialize hypothesis generator
    this.hypothesisGenerator = new HypothesisGenerator({
      cachePath: path.join(this.cachePath, 'hypotheses'),
      maxHypotheses: options.maxHypotheses || 10,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      defaultAgent: options.defaultHypothesisAgent || 'data-analyst'
    });
    
    // Initialize statistical tester
    this.statisticalTester = new StatisticalTester({
      alphaLevel: options.alphaLevel || 0.05,
      correctionMethod: options.correctionMethod || 'benjamini_hochberg',
      maxTestsPerAnalysis: options.maxTestsPerAnalysis || 50,
      cachePath: path.join(this.cachePath, 'statistical-tests')
    });
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Query cache
    this.queryCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 100;
    
    // EDA report cache
    this.edaReportCache = new Map();
    this.maxEDAReportCacheSize = options.maxEDAReportCacheSize || 50;
    
    // Statistical results cache
    this.statisticalResultsCache = new Map();
    this.maxStatisticalResultsCacheSize = options.maxStatisticalResultsCacheSize || 100;
    
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
    
    // EDA endpoints
    this.app.post('/api/v1/analytics/eda/analyze', this.runEDAAnalysis.bind(this));
    this.app.get('/api/v1/analytics/eda/reports', this.listEDAReports.bind(this));
    this.app.get('/api/v1/analytics/eda/report/:reportId', this.getEDAReport.bind(this));
    this.app.post('/api/v1/analytics/eda/table/:table', this.analyzeTable.bind(this));
    this.app.get('/api/v1/analytics/eda/insights/:reportId', this.getEDAInsights.bind(this));
    this.app.delete('/api/v1/analytics/eda/report/:reportId', this.deleteEDAReport.bind(this));
    this.app.delete('/api/v1/analytics/eda/cache', this.clearEDACache.bind(this));
    
    // Hypothesis generation endpoints
    this.app.post('/api/v1/analytics/hypotheses/generate', this.generateHypotheses.bind(this));
    this.app.post('/api/v1/analytics/hypotheses/from-eda/:reportId', this.generateHypothesesFromEDAReport.bind(this));
    this.app.get('/api/v1/analytics/hypotheses', this.listHypotheses.bind(this));
    this.app.delete('/api/v1/analytics/hypotheses/cache', this.clearHypothesesCache.bind(this));
    
    // Statistical testing endpoints
    this.app.post('/api/v1/analytics/statistics/test', this.executeStatisticalTests.bind(this));
    this.app.post('/api/v1/analytics/statistics/test-hypotheses/:reportId', this.testHypothesesFromEDAReport.bind(this));
    this.app.post('/api/v1/analytics/statistics/select-tests', this.selectAppropriateTests.bind(this));
    this.app.get('/api/v1/analytics/statistics/catalog', this.getTestCatalog.bind(this));
    this.app.get('/api/v1/analytics/statistics/results/:resultId', this.getStatisticalResults.bind(this));
    this.app.delete('/api/v1/analytics/statistics/cache', this.clearStatisticsCache.bind(this));
    
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

  // ==================== EDA Analysis Methods ====================

  /**
   * Run EDA analysis on provided data
   */
  async runEDAAnalysis(req, res) {
    try {
      const { 
        dataConfig, 
        tools = ['pandas_profiling'], 
        options = {}, 
        analysisDepth = 'standard' 
      } = req.body;

      if (!dataConfig || !dataConfig.source) {
        return res.status(400).json({
          error: 'Missing or invalid dataConfig parameter'
        });
      }

      // Configure analysis depth
      const depthConfig = this.configureAnalysisDepth(analysisDepth);
      const mergedOptions = { ...depthConfig, ...options };

      securityLogger.logDataOperation({
        operation: 'eda_analysis_request',
        tools: tools.join(','),
        depth: analysisDepth,
        user: req.user?.id || 'unknown',
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();

      // If only one tool specified, run single tool analysis
      let report;
      if (tools.length === 1) {
        report = await this.edaEngine.executeEDATool(tools[0], dataConfig, mergedOptions);
      } else {
        // Run comprehensive analysis
        report = await this.edaEngine.generateComprehensiveReport(dataConfig, mergedOptions);
      }

      const executionTime = Date.now() - startTime;

      // Store report in cache
      const reportId = this.generateReportId();
      this.storeEDAReport(reportId, report, { tools, analysisDepth, executionTime });

      // Optionally store insights in DuckDB
      if (mergedOptions.storeInDuckDB !== false) {
        await this.storeEDAResultsInDuckDB(reportId, report, dataConfig);
      }

      res.json({
        success: true,
        reportId,
        data: report,
        metadata: {
          tools,
          analysisDepth,
          executionTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to run EDA analysis');
    }
  }

  /**
   * Analyze a DuckDB table directly
   */
  async analyzeTable(req, res) {
    try {
      const { table } = req.params;
      const { 
        tools = ['pandas_profiling'], 
        options = {}, 
        analysisDepth = 'standard',
        sampleSize 
      } = req.body;

      // Check if table exists
      const tableExists = await this.duckdb.tableExists(table);
      if (!tableExists) {
        return res.status(404).json({
          error: `Table '${table}' not found`
        });
      }

      // Get table info for sampling decision
      const tableInfo = await this.duckdb.getTableInfo(table);
      const shouldSample = sampleSize || (tableInfo.rowCount > 500000);

      // Build data config for DuckDB table
      const dataConfig = {
        source: table,
        type: 'duckdb',
        database_path: path.join(this.duckdbPath, 'analytics.db'),
        query: shouldSample ? 
          `SELECT * FROM ${table} USING SAMPLE ${sampleSize || '500000 ROWS'}` :
          `SELECT * FROM ${table}`,
        rowCount: tableInfo.rowCount,
        columnCount: tableInfo.columnCount
      };

      // Configure analysis depth
      const depthConfig = this.configureAnalysisDepth(analysisDepth);
      const mergedOptions = { ...depthConfig, ...options };

      const startTime = Date.now();
      const report = await this.edaEngine.generateComprehensiveReport(dataConfig, mergedOptions);
      const executionTime = Date.now() - startTime;

      // Store report
      const reportId = this.generateReportId();
      this.storeEDAReport(reportId, report, { 
        table, tools, analysisDepth, executionTime, sampled: shouldSample 
      });

      // Store insights in DuckDB
      await this.storeEDAResultsInDuckDB(reportId, report, dataConfig);

      res.json({
        success: true,
        reportId,
        data: report,
        metadata: {
          table,
          tools,
          analysisDepth,
          sampled: shouldSample,
          executionTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to analyze table');
    }
  }

  /**
   * List EDA reports
   */
  async listEDAReports(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const reports = Array.from(this.edaReportCache.entries())
        .slice(offset, offset + limit)
        .map(([reportId, reportData]) => ({
          reportId,
          metadata: reportData.metadata,
          createdAt: reportData.createdAt,
          tools: reportData.tools,
          analysisDepth: reportData.analysisDepth
        }));

      res.json({
        success: true,
        data: reports,
        metadata: {
          total: this.edaReportCache.size,
          limit: parseInt(limit),
          offset: parseInt(offset),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to list EDA reports');
    }
  }

  /**
   * Get specific EDA report
   */
  async getEDAReport(req, res) {
    try {
      const { reportId } = req.params;
      const { includeRawData = false } = req.query;

      const reportData = this.edaReportCache.get(reportId);
      if (!reportData) {
        return res.status(404).json({
          error: `EDA report '${reportId}' not found`
        });
      }

      const response = {
        success: true,
        reportId,
        data: includeRawData ? reportData.report : this.sanitizeReportData(reportData.report),
        metadata: reportData.metadata,
        tools: reportData.tools,
        analysisDepth: reportData.analysisDepth,
        createdAt: reportData.createdAt,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      this.handleError(res, error, 'Failed to get EDA report');
    }
  }

  /**
   * Get EDA insights for a report
   */
  async getEDAInsights(req, res) {
    try {
      const { reportId } = req.params;

      const reportData = this.edaReportCache.get(reportId);
      if (!reportData) {
        return res.status(404).json({
          error: `EDA report '${reportId}' not found`
        });
      }

      const insights = this.edaEngine.extractInsights(reportData.report);

      res.json({
        success: true,
        reportId,
        insights,
        metadata: {
          extractedAt: new Date().toISOString(),
          reportCreatedAt: reportData.createdAt
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to extract EDA insights');
    }
  }

  /**
   * Delete EDA report
   */
  async deleteEDAReport(req, res) {
    try {
      const { reportId } = req.params;

      const exists = this.edaReportCache.has(reportId);
      if (!exists) {
        return res.status(404).json({
          error: `EDA report '${reportId}' not found`
        });
      }

      this.edaReportCache.delete(reportId);

      // Also try to clean up DuckDB stored data
      try {
        await this.duckdb.execute(`DELETE FROM eda_insights WHERE report_id = ?`, [reportId]);
      } catch (error) {
        console.warn(`Failed to clean up DuckDB data for report ${reportId}:`, error.message);
      }

      res.json({
        success: true,
        message: `EDA report '${reportId}' deleted`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to delete EDA report');
    }
  }

  /**
   * Clear EDA cache
   */
  async clearEDACache(req, res) {
    try {
      const sizeBefore = this.edaReportCache.size;
      this.edaReportCache.clear();

      // Also clear EDA engine cache
      await this.edaEngine.cleanCache(0); // Clean all cache

      res.json({
        success: true,
        data: {
          reportsCleared: sizeBefore,
          remaining: this.edaReportCache.size
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to clear EDA cache');
    }
  }

  // ==================== EDA Helper Methods ====================

  /**
   * Configure analysis depth
   */
  configureAnalysisDepth(depth) {
    const configs = {
      minimal: {
        timeout: 120000, // 2 minutes
        samplingThreshold: 50000,
        tools: ['pandas_profiling'],
        explorative: false
      },
      standard: {
        timeout: 600000, // 10 minutes
        samplingThreshold: 500000,
        tools: ['pandas_profiling', 'sweetviz'],
        explorative: true
      },
      comprehensive: {
        timeout: 1800000, // 30 minutes
        samplingThreshold: 1000000,
        tools: ['pandas_profiling', 'sweetviz', 'autoviz'],
        explorative: true
      }
    };

    return configs[depth] || configs.standard;
  }

  /**
   * Generate unique report ID
   */
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `eda_${timestamp}_${random}`;
  }

  /**
   * Store EDA report in cache
   */
  storeEDAReport(reportId, report, metadata) {
    // Implement LRU-style cache management
    if (this.edaReportCache.size >= this.maxEDAReportCacheSize) {
      const oldestKey = this.edaReportCache.keys().next().value;
      this.edaReportCache.delete(oldestKey);
    }

    this.edaReportCache.set(reportId, {
      report,
      metadata,
      createdAt: new Date().toISOString(),
      tools: metadata.tools,
      analysisDepth: metadata.analysisDepth
    });
  }

  /**
   * Store EDA results in DuckDB for querying
   */
  async storeEDAResultsInDuckDB(reportId, report, dataConfig) {
    try {
      // Create EDA insights table if it doesn't exist
      await this.duckdb.execute(`
        CREATE TABLE IF NOT EXISTS eda_insights (
          report_id VARCHAR PRIMARY KEY,
          source_table VARCHAR,
          source_type VARCHAR,
          analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          insights JSON,
          metadata JSON
        )
      `);

      // Extract insights
      const insights = this.edaEngine.extractInsights(report);

      // Store insights
      await this.duckdb.execute(`
        INSERT OR REPLACE INTO eda_insights 
        (report_id, source_table, source_type, insights, metadata) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        reportId,
        dataConfig.source,
        dataConfig.type || 'unknown',
        JSON.stringify(insights),
        JSON.stringify({
          dataset_info: report.dataset_info,
          tools_executed: report.metadata?.tools_executed || [],
          execution_time: report.metadata?.execution_time_ms || 0
        })
      ]);

      console.log(`✅ Stored EDA insights for report ${reportId} in DuckDB`);

    } catch (error) {
      console.warn(`Failed to store EDA results in DuckDB:`, error.message);
      // Don't fail the main operation if DuckDB storage fails
    }
  }

  /**
   * Sanitize report data for API response
   */
  sanitizeReportData(report) {
    // Remove large binary data or sensitive information from report
    const sanitized = { ...report };
    
    // Remove large file paths that might contain sensitive info
    if (sanitized.reports) {
      Object.keys(sanitized.reports).forEach(tool => {
        if (sanitized.reports[tool].output_files) {
          // Keep only filename, not full paths
          Object.keys(sanitized.reports[tool].output_files).forEach(format => {
            const fullPath = sanitized.reports[tool].output_files[format];
            sanitized.reports[tool].output_files[format] = path.basename(fullPath);
          });
        }
      });
    }

    return sanitized;
  }

  // ==================== Hypothesis Generation Methods ====================

  /**
   * Generate hypotheses from EDA report by reportId
   */
  async generateHypothesesFromEDAReport(req, res) {
    try {
      const { reportId } = req.params;
      const {
        agent = 'data-analyst',
        domain = 'general',
        businessContext = '',
        options = {}
      } = req.body;

      // Get EDA report
      const reportData = this.edaReportCache.get(reportId);
      if (!reportData) {
        return res.status(404).json({
          error: `EDA report '${reportId}' not found`
        });
      }

      const startTime = Date.now();

      // Generate hypotheses using the agent-based approach
      const result = await this.hypothesisGenerator.generateHypothesesFromEDA(reportData.report, {
        agent,
        domain,
        businessContext,
        user: req.user?.id || 'unknown',
        ...options
      });

      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        reportId,
        ...result,
        metadata: {
          ...result.metadata,
          eda_report_id: reportId,
          execution_time_total: executionTime
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to generate hypotheses from EDA report');
    }
  }

  /**
   * Generate hypotheses from provided EDA data
   */
  async generateHypotheses(req, res) {
    try {
      const {
        edaReport,
        agent = 'data-analyst',
        domain = 'general',
        businessContext = '',
        options = {}
      } = req.body;

      if (!edaReport) {
        return res.status(400).json({
          error: 'Missing edaReport parameter'
        });
      }

      const startTime = Date.now();

      // Generate hypotheses using the agent-based approach
      const result = await this.hypothesisGenerator.generateHypothesesFromEDA(edaReport, {
        agent,
        domain,
        businessContext,
        user: req.user?.id || 'unknown',
        ...options
      });

      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        ...result,
        metadata: {
          ...result.metadata,
          execution_time_total: executionTime
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to generate hypotheses');
    }
  }

  /**
   * List cached hypotheses
   */
  async listHypotheses(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      // Get cached hypotheses from the hypothesis generator
      const allHypotheses = [];
      
      // This is a simplified version - in a full implementation, 
      // we might store hypotheses in DuckDB for better querying
      for (const [key, value] of this.hypothesisGenerator.hypothesisCache.entries()) {
        allHypotheses.push({
          cacheKey: key,
          ...value,
          createdAt: value.cached_at || value.metadata?.timestamp
        });
      }

      // Apply pagination
      const paginatedHypotheses = allHypotheses
        .slice(offset, offset + limit)
        .map(item => ({
          cacheKey: item.cacheKey,
          dataset_source: item.metadata?.dataset_source,
          agent_used: item.metadata?.agent_used,
          total_hypotheses: item.metadata?.total_hypotheses,
          createdAt: item.createdAt,
          hypotheses: item.hypotheses?.slice(0, 3) // Show first 3 hypotheses
        }));

      res.json({
        success: true,
        data: paginatedHypotheses,
        metadata: {
          total: allHypotheses.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to list hypotheses');
    }
  }

  /**
   * Clear hypotheses cache
   */
  async clearHypothesesCache(req, res) {
    try {
      await this.hypothesisGenerator.clearCache(0); // Clear all cache

      res.json({
        success: true,
        message: 'Hypotheses cache cleared',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to clear hypotheses cache');
    }
  }

  // =====================
  // STATISTICAL TESTING ENDPOINTS
  // =====================

  /**
   * Execute statistical tests
   */
  async executeStatisticalTests(req, res) {
    try {
      const {
        data_source,
        tests,
        options = {}
      } = req.body;

      if (!data_source) {
        return res.status(400).json({
          error: 'data_source is required'
        });
      }

      if (!tests || !Array.isArray(tests) || tests.length === 0) {
        return res.status(400).json({
          error: 'tests array is required and must contain at least one test'
        });
      }

      securityLogger.logDataOperation({
        operation: 'statistical_testing_request',
        data_source: data_source,
        test_count: tests.length,
        user: req.user?.id || 'unknown',
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();

      // Execute statistical tests
      const results = await this.statisticalTester.executeStatisticalTests(
        tests, 
        { source: data_source }
      );

      const executionTime = Date.now() - startTime;

      // Generate result ID for retrieval
      const resultId = this.generateStatisticalResultId();
      this.storeStatisticalResults(resultId, results, { tests, data_source, executionTime });

      res.json({
        success: true,
        resultId,
        data: results,
        metadata: {
          test_count: tests.length,
          data_source,
          execution_time: executionTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to execute statistical tests');
    }
  }

  /**
   * Test hypotheses from EDA report
   */
  async testHypothesesFromEDAReport(req, res) {
    try {
      const { reportId } = req.params;
      const { options = {} } = req.body;

      if (!reportId) {
        return res.status(400).json({
          error: 'EDA report ID is required'
        });
      }

      // Get EDA report
      const edaReport = this.edaReportCache.get(reportId);
      if (!edaReport) {
        return res.status(404).json({
          error: 'EDA report not found. Generate an EDA report first.'
        });
      }

      // Generate hypotheses if not already present
      let hypotheses = [];
      const hypothesesCacheKey = this.hypothesisGenerator.generateCacheKey(edaReport.report, { agent: 'data-analyst' });
      const cachedHypotheses = await this.hypothesisGenerator.getCachedHypotheses(hypothesesCacheKey);
      
      if (cachedHypotheses && cachedHypotheses.hypotheses) {
        hypotheses = cachedHypotheses.hypotheses;
      } else {
        // Generate hypotheses first
        const hypothesesResult = await this.hypothesisGenerator.generateHypothesesFromEDA(
          edaReport.report, 
          options
        );
        hypotheses = hypothesesResult.hypotheses || [];
      }

      // Extract data characteristics from EDA report
      const dataCharacteristics = this.extractDataCharacteristics(edaReport.report);

      // Select appropriate tests
      const selectedTests = this.statisticalTester.selectAppropriatTests(dataCharacteristics, hypotheses);

      // Execute tests
      const testResults = await this.statisticalTester.executeStatisticalTests(
        selectedTests,
        { source: edaReport.metadata?.data_source || 'unknown' }
      );

      // Interpret results
      const interpretations = this.statisticalTester.interpretResults(testResults, hypotheses);

      const resultId = this.generateStatisticalResultId();
      this.storeStatisticalResults(resultId, {
        ...testResults,
        interpretations,
        related_hypotheses: hypotheses,
        eda_report_id: reportId
      }, { reportId, hypotheses_count: hypotheses.length });

      res.json({
        success: true,
        resultId,
        data: {
          ...testResults,
          interpretations,
          related_hypotheses: hypotheses
        },
        metadata: {
          eda_report_id: reportId,
          hypotheses_tested: hypotheses.length,
          tests_executed: selectedTests.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to test hypotheses from EDA report');
    }
  }

  /**
   * Select appropriate tests for data characteristics
   */
  async selectAppropriateTests(req, res) {
    try {
      const {
        data_characteristics,
        hypotheses = [],
        options = {}
      } = req.body;

      if (!data_characteristics) {
        return res.status(400).json({
          error: 'data_characteristics object is required'
        });
      }

      const selectedTests = this.statisticalTester.selectAppropriatTests(
        data_characteristics, 
        hypotheses
      );

      res.json({
        success: true,
        data: {
          selected_tests: selectedTests,
          total_tests: selectedTests.length,
          data_characteristics,
          hypotheses_considered: hypotheses.length
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to select appropriate tests');
    }
  }

  /**
   * Get test catalog
   */
  async getTestCatalog(req, res) {
    try {
      const catalog = this.statisticalTester.getTestCatalog();

      res.json({
        success: true,
        data: catalog,
        metadata: {
          total_categories: Object.keys(catalog).length,
          total_tests: Object.values(catalog).reduce((sum, cat) => sum + cat.tests.length, 0),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to get test catalog');
    }
  }

  /**
   * Get statistical results by ID
   */
  async getStatisticalResults(req, res) {
    try {
      const { resultId } = req.params;

      if (!resultId) {
        return res.status(400).json({
          error: 'Result ID is required'
        });
      }

      const results = this.statisticalResultsCache.get(resultId);
      if (!results) {
        return res.status(404).json({
          error: 'Statistical results not found'
        });
      }

      res.json({
        success: true,
        resultId,
        data: results.results,
        metadata: {
          ...results.metadata,
          retrieved_at: new Date().toISOString()
        }
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to get statistical results');
    }
  }

  /**
   * Clear statistics cache
   */
  async clearStatisticsCache(req, res) {
    try {
      this.statisticalResultsCache.clear();

      res.json({
        success: true,
        message: 'Statistics cache cleared',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to clear statistics cache');
    }
  }

  // =====================
  // HELPER METHODS FOR STATISTICAL TESTING
  // =====================

  /**
   * Generate statistical result ID
   */
  generateStatisticalResultId() {
    return `stat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store statistical results in cache
   */
  storeStatisticalResults(resultId, results, metadata) {
    // Manage cache size
    if (this.statisticalResultsCache.size >= this.maxStatisticalResultsCacheSize) {
      const firstKey = this.statisticalResultsCache.keys().next().value;
      this.statisticalResultsCache.delete(firstKey);
    }

    this.statisticalResultsCache.set(resultId, {
      results,
      metadata: {
        ...metadata,
        stored_at: new Date().toISOString()
      }
    });
  }

  /**
   * Extract data characteristics from EDA report
   */
  extractDataCharacteristics(edaReport) {
    const characteristics = {
      sample_size: 0,
      num_variables: 0,
      variable_types: {
        numeric: 0,
        categorical: 0,
        datetime: 0
      },
      normality_likely: false,
      equal_variances_likely: true,
      paired_data: false,
      time_series: false,
      missing_data_percentage: 0,
      outliers_present: false
    };

    // Extract from dataset_info
    if (edaReport.dataset_info) {
      characteristics.sample_size = edaReport.dataset_info.n_rows || 0;
      characteristics.num_variables = edaReport.dataset_info.n_columns || 0;
      characteristics.missing_data_percentage = edaReport.dataset_info.missing_percentage || 0;
    }

    // Extract from pandas profiling insights
    if (edaReport.reports?.pandas_profiling?.insights) {
      const insights = edaReport.reports.pandas_profiling.insights;
      
      // Extract variable types from summary
      if (insights.summary) {
        characteristics.variable_types.numeric = insights.summary.numeric_variables || 0;
        characteristics.variable_types.categorical = insights.summary.categorical_variables || 0;
      }

      // Check for normality based on warnings
      characteristics.normality_likely = !insights.warnings?.some(w => 
        w.type === 'skewed' || w.type === 'non_normal'
      );

      // Check for outliers
      characteristics.outliers_present = insights.warnings?.some(w => 
        w.type === 'high_outliers' || w.type === 'outliers'
      ) || false;
    }

    // Detect time series data
    if (edaReport.reports?.pandas_profiling?.insights?.summary) {
      characteristics.time_series = edaReport.reports.pandas_profiling.insights.summary.datetime_variables > 0;
    }

    return characteristics;
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

  /**
   * Execute EDA analysis (alias for runEDAAnalysis for integration tests)
   */
  async executeEdaAnalysis(dataConfig, options = {}) {
    // Create a mock request object for the internal API
    const mockReq = {
      body: {
        ...dataConfig,
        ...options
      }
    };
    
    // Create a mock response object to capture the result
    let result = null;
    const mockRes = {
      json: (data) => { result = data; },
      status: () => mockRes,
      send: (data) => { result = data; }
    };
    
    try {
      await this.runEDAAnalysis(mockReq, mockRes);
      return result;
    } catch (error) {
      throw new Error(`EDA analysis execution failed: ${error.message}`);
    }
  }
}

module.exports = AnalyticalEngine;