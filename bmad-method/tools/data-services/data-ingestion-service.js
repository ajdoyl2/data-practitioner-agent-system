/**
 * Data Ingestion Service
 * REST API endpoints for data source management and PyAirbyte integration
 */

const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const multer = require('multer');
const yaml = require('js-yaml');

const PyAirbyteWrapper = require('./pyairbyte-wrapper');
const { requireFeatureMiddleware, isFeatureEnabled } = require('../lib/feature-flag-manager');
const { securityLogger } = require('../lib/security-logger');
const { verifyApiKey, requireScope } = require('./auth-middleware');

class DataIngestionService {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.dataDirectory = options.dataDirectory || path.join(process.cwd(), 'data');
    this.uploadsDirectory = path.join(this.dataDirectory, 'uploads');
    
    // Initialize PyAirbyte wrapper
    this.pyairbyte = new PyAirbyteWrapper({
      cacheDirectory: path.join(this.dataDirectory, 'cache', 'pyairbyte')
    });
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Ensure directories exist
    fs.ensureDirSync(this.configPath);
    fs.ensureDirSync(this.dataDirectory);
    fs.ensureDirSync(this.uploadsDirectory);
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // JSON parsing
    this.app.use(express.json({ limit: '50mb' }));
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
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });

    // File upload configuration
    this.uploadStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadsDirectory, Date.now().toString());
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, sanitized);
      }
    });

    this.upload = multer({ 
      storage: this.uploadStorage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10
      },
      fileFilter: (req, file, cb) => {
        // Allow common data file types
        const allowedTypes = [
          'text/csv',
          'application/json',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
      }
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
        service: 'data-ingestion',
        timestamp: new Date().toISOString(),
        features: {
          pyairbyte_integration: isFeatureEnabled('pyairbyte_integration')
        }
      });
    });

    // Feature flag check middleware for all data endpoints
    this.app.use('/api/v1/data-sources*', requireFeatureMiddleware('pyairbyte_integration'));
    
    // Authentication middleware for all data endpoints
    this.app.use('/api/v1/data-sources*', verifyApiKey);
    this.app.use('/api/v1/data-sources*', requireScope('data_write'));

    // Data source management endpoints
    this.app.get('/api/v1/data-sources/connectors', this.listConnectors.bind(this));
    this.app.post('/api/v1/data-sources/discover', this.discoverStreams.bind(this));
    this.app.post('/api/v1/data-sources/read', this.readStream.bind(this));
    this.app.post('/api/v1/data-sources/upload', this.upload.array('files'), this.uploadFiles.bind(this));
    this.app.post('/api/v1/data-sources/database', this.configureDatabase.bind(this));
    
    // Cache management endpoints
    this.app.get('/api/v1/data-sources/cache', this.getCacheInfo.bind(this));
    this.app.delete('/api/v1/data-sources/cache', this.clearCache.bind(this));
    
    // Configuration management endpoints
    this.app.get('/api/v1/data-sources/config', this.getConfigurations.bind(this));
    this.app.post('/api/v1/data-sources/config', this.saveConfiguration.bind(this));
    this.app.delete('/api/v1/data-sources/config/:name', this.deleteConfiguration.bind(this));

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * List available connectors
   */
  async listConnectors(req, res) {
    try {
      const availability = await this.pyairbyte.checkAvailability();
      
      if (!availability.available) {
        return res.status(503).json({
          error: 'PyAirbyte not available',
          reason: availability.reason || availability.error
        });
      }

      const connectors = await this.pyairbyte.listConnectors();
      
      res.json({
        success: true,
        data: connectors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to list connectors');
    }
  }

  /**
   * Discover streams from a data source
   */
  async discoverStreams(req, res) {
    try {
      const { connector_type, config } = req.body;
      
      if (!connector_type || !config) {
        return res.status(400).json({
          error: 'Missing required fields: connector_type, config'
        });
      }

      const streams = await this.pyairbyte.discoverStreams(connector_type, config);
      
      if (!streams.success) {
        return res.status(400).json({
          error: 'Failed to discover streams',
          details: streams.error
        });
      }

      res.json({
        success: true,
        data: streams,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to discover streams');
    }
  }

  /**
   * Read data from a stream
   */
  async readStream(req, res) {
    try {
      const { connector_type, config, stream_name, limit } = req.body;
      
      if (!connector_type || !config || !stream_name) {
        return res.status(400).json({
          error: 'Missing required fields: connector_type, config, stream_name'
        });
      }

      const data = await this.pyairbyte.readStream(connector_type, config, stream_name, limit);
      
      if (!data.success) {
        return res.status(400).json({
          error: 'Failed to read stream',
          details: data.error
        });
      }

      res.json({
        success: true,
        data: data.data,
        metadata: data.data.metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to read stream');
    }
  }

  /**
   * Upload and process files
   */
  async uploadFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded'
        });
      }

      const results = [];
      
      for (const file of req.files) {
        try {
          // Determine file format from extension
          const ext = path.extname(file.originalname).toLowerCase();
          let format = 'csv'; // default
          
          if (ext === '.json') format = 'json';
          else if (['.xlsx', '.xls'].includes(ext)) format = 'excel';
          else if (ext === '.parquet') format = 'parquet';

          // Create file connector config
          const config = this.pyairbyte.createFileConfig(file.path, format, {
            dataset_name: path.basename(file.originalname, ext)
          });

          // Discover streams from the uploaded file
          const streams = await this.pyairbyte.discoverStreams('file', config);
          
          results.push({
            filename: file.originalname,
            path: file.path,
            format,
            size: file.size,
            config,
            streams: streams.success ? streams.streams : null,
            error: streams.success ? null : streams.error
          });
        } catch (fileError) {
          results.push({
            filename: file.originalname,
            error: fileError.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          uploaded_files: req.files.length,
          results
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to upload files');
    }
  }

  /**
   * Configure database connection
   */
  async configureDatabase(req, res) {
    try {
      const { database_type, connection, test_connection = true } = req.body;
      
      if (!database_type || !connection) {
        return res.status(400).json({
          error: 'Missing required fields: database_type, connection'
        });
      }

      // Create database config
      const config = this.pyairbyte.createDatabaseConfig(database_type, connection);
      
      let streams = null;
      if (test_connection) {
        // Test connection and discover streams
        const streamsResult = await this.pyairbyte.discoverStreams(database_type, config);
        
        if (!streamsResult.success) {
          return res.status(400).json({
            error: 'Database connection test failed',
            details: streamsResult.error
          });
        }
        
        streams = streamsResult.streams;
      }

      // Save configuration
      const configName = `${database_type}_${connection.database}_${Date.now()}`;
      await this.saveConfigurationToFile(configName, {
        type: 'database',
        database_type,
        config,
        created: new Date().toISOString()
      });

      res.json({
        success: true,
        data: {
          config_name: configName,
          database_type,
          streams,
          connection_test: test_connection ? 'passed' : 'skipped'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to configure database');
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(req, res) {
    try {
      const cacheInfo = await this.pyairbyte.getCacheInfo();
      
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
   * Clear cache
   */
  async clearCache(req, res) {
    try {
      const { pattern } = req.query;
      
      const result = await this.pyairbyte.clearCache(pattern);
      
      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to clear cache',
          details: result.error
        });
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to clear cache');
    }
  }

  /**
   * Get all saved configurations
   */
  async getConfigurations(req, res) {
    try {
      const configDir = path.join(this.configPath, 'data-sources');
      
      if (!fs.existsSync(configDir)) {
        return res.json({
          success: true,
          data: { configurations: [] },
          timestamp: new Date().toISOString()
        });
      }

      const files = await fs.readdir(configDir);
      const configurations = [];
      
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          try {
            const filePath = path.join(configDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const config = yaml.load(content);
            
            configurations.push({
              name: path.basename(file, path.extname(file)),
              ...config,
              file_path: filePath
            });
          } catch (parseError) {
            // Skip files that can't be parsed
            console.warn(`Failed to parse config file ${file}:`, parseError.message);
          }
        }
      }

      res.json({
        success: true,
        data: { configurations },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get configurations');
    }
  }

  /**
   * Save a new configuration
   */
  async saveConfiguration(req, res) {
    try {
      const { name, configuration } = req.body;
      
      if (!name || !configuration) {
        return res.status(400).json({
          error: 'Missing required fields: name, configuration'
        });
      }

      await this.saveConfigurationToFile(name, configuration);

      res.json({
        success: true,
        data: {
          name,
          saved: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to save configuration');
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfiguration(req, res) {
    try {
      const { name } = req.params;
      
      const configPath = path.join(this.configPath, 'data-sources', `${name}.yaml`);
      
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({
          error: 'Configuration not found'
        });
      }

      await fs.unlink(configPath);

      res.json({
        success: true,
        data: {
          name,
          deleted: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to delete configuration');
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfigurationToFile(name, configuration) {
    const configDir = path.join(this.configPath, 'data-sources');
    fs.ensureDirSync(configDir);
    
    const filePath = path.join(configDir, `${name}.yaml`);
    const yamlContent = yaml.dump(configuration, { indent: 2 });
    
    await fs.writeFile(filePath, yamlContent, 'utf8');
  }

  /**
   * Handle errors consistently
   */
  handleError(res, error, message = 'Internal server error') {
    console.error(`${message}:`, error);
    
    securityLogger.logApiError({
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
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File too large',
          limit: '100MB'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          error: 'Too many files',
          limit: '10 files'
        });
      }
    }

    this.handleError(res, error);
  }

  /**
   * Start the service
   */
  async start() {
    try {
      // Check PyAirbyte availability
      const availability = await this.pyairbyte.checkAvailability();
      
      if (availability.available) {
        console.log('✅ PyAirbyte integration available');
      } else {
        console.warn('⚠️  PyAirbyte integration not available:', availability.reason || availability.error);
      }

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Data Ingestion Service running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        
        securityLogger.logServiceStart({
          service: 'data-ingestion',
          port: this.port,
          pyairbyte_available: availability.available,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Failed to start Data Ingestion Service:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Data Ingestion Service stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = DataIngestionService;