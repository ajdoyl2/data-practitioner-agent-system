/**
 * Workflow Orchestrator Service  
 * Dagster integration for asset-centric workflow orchestration
 */

const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const { spawn, exec } = require('child_process');
const yaml = require('js-yaml');

const { requireFeatureMiddleware, isFeatureEnabled } = require('../lib/feature-flag-manager');
const { securityLogger } = require('../lib/security-logger');
const { verifyApiKey, requireScope } = require('./auth-middleware');
const DagsterWrapper = require('./dagster-wrapper');
const AssetManager = require('./asset-manager');
const PipelineMonitor = require('./pipeline-monitor');

class WorkflowOrchestrator {
  constructor(options = {}) {
    this.port = options.port || 3003;
    this.configPath = options.configPath || path.join(process.cwd(), 'config');
    this.dagsterProjectPath = options.dagsterProjectPath || path.join(
      process.cwd(), 
      'expansion-packs', 
      'bmad-data-practitioner', 
      'dagster-project'
    );
    
    // Initialize components
    this.dagsterWrapper = new DagsterWrapper({
      projectPath: this.dagsterProjectPath,
      webUIPort: options.dagsterWebPort || 3001,
      daemonPort: options.dagsterDaemonPort || 3070
    });
    
    this.assetManager = new AssetManager({
      projectPath: this.dagsterProjectPath
    });
    
    this.pipelineMonitor = new PipelineMonitor({
      dagsterWrapper: this.dagsterWrapper
    });
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // State management
    this.isRunning = false;
    this.services = {
      daemon: null,
      webUI: null
    };
    
    // Ensure directories exist
    fs.ensureDirSync(this.configPath);
    fs.ensureDirSync(this.dagsterProjectPath);
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
        service: 'workflow-orchestrator',
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
        service: 'workflow-orchestrator',
        timestamp: new Date().toISOString(),
        features: {
          dagster_orchestration: isFeatureEnabled('dagster_orchestration')
        },
        dagster: {
          available: this.dagsterWrapper.isAvailable(),
          daemon_running: this.dagsterWrapper.isDaemonRunning(),
          webui_running: this.dagsterWrapper.isWebUIRunning()
        }
      });
    });

    // Feature flag check middleware for all orchestration endpoints
    this.app.use('/api/v1/orchestration*', requireFeatureMiddleware('dagster_orchestration'));
    
    // Authentication middleware for all orchestration endpoints
    this.app.use('/api/v1/orchestration*', verifyApiKey);
    this.app.use('/api/v1/orchestration*', requireScope('orchestration_manage'));

    // Dagster service management endpoints
    this.app.post('/api/v1/orchestration/services/start', this.startServices.bind(this));
    this.app.post('/api/v1/orchestration/services/stop', this.stopServices.bind(this));
    this.app.get('/api/v1/orchestration/services/status', this.getServicesStatus.bind(this));
    
    // Asset management endpoints
    this.app.get('/api/v1/orchestration/assets', this.listAssets.bind(this));
    this.app.get('/api/v1/orchestration/assets/:asset_key', this.getAssetDetails.bind(this));
    this.app.post('/api/v1/orchestration/assets/:asset_key/materialize', this.materializeAsset.bind(this));
    this.app.get('/api/v1/orchestration/assets/:asset_key/lineage', this.getAssetLineage.bind(this));
    
    // Pipeline execution endpoints
    this.app.post('/api/v1/orchestration/runs/launch', this.launchRun.bind(this));
    this.app.get('/api/v1/orchestration/runs', this.listRuns.bind(this));
    this.app.get('/api/v1/orchestration/runs/:run_id', this.getRunDetails.bind(this));
    this.app.post('/api/v1/orchestration/runs/:run_id/cancel', this.cancelRun.bind(this));
    
    // Monitoring endpoints
    this.app.get('/api/v1/orchestration/monitoring/pipeline-status', this.getPipelineStatus.bind(this));
    this.app.get('/api/v1/orchestration/monitoring/performance', this.getPerformanceMetrics.bind(this));
    this.app.get('/api/v1/orchestration/monitoring/alerts', this.getAlerts.bind(this));
    
    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Start Dagster services (daemon and web UI)
   */
  async startServices(req, res) {
    try {
      if (this.isRunning) {
        return res.json({
          success: true,
          message: 'Services are already running',
          services: await this.getServicesStatusData()
        });
      }

      const { daemon = true, webUI = true } = req.body;
      
      securityLogger.logServiceOperation({
        service: 'workflow-orchestrator',
        operation: 'start_services',
        daemon,
        webUI,
        timestamp: new Date().toISOString()
      });

      const results = [];

      // Start Dagster daemon
      if (daemon) {
        const daemonResult = await this.dagsterWrapper.startDaemon();
        results.push({ service: 'daemon', ...daemonResult });
      }

      // Start Dagster web UI
      if (webUI) {
        const webUIResult = await this.dagsterWrapper.startWebUI();
        results.push({ service: 'webUI', ...webUIResult });
      }

      this.isRunning = true;

      res.json({
        success: true,
        message: 'Dagster services started successfully',
        results,
        services: await this.getServicesStatusData(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to start Dagster services');
    }
  }

  /**
   * Stop Dagster services
   */
  async stopServices(req, res) {
    try {
      const { daemon = true, webUI = true } = req.body;
      
      securityLogger.logServiceOperation({
        service: 'workflow-orchestrator',
        operation: 'stop_services',
        daemon,
        webUI,
        timestamp: new Date().toISOString()
      });

      const results = [];

      // Stop Dagster daemon
      if (daemon) {
        const daemonResult = await this.dagsterWrapper.stopDaemon();
        results.push({ service: 'daemon', ...daemonResult });
      }

      // Stop Dagster web UI  
      if (webUI) {
        const webUIResult = await this.dagsterWrapper.stopWebUI();
        results.push({ service: 'webUI', ...webUIResult });
      }

      this.isRunning = false;

      res.json({
        success: true,
        message: 'Dagster services stopped successfully',
        results,
        services: await this.getServicesStatusData(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to stop Dagster services');
    }
  }

  /**
   * Get status of Dagster services
   */
  async getServicesStatus(req, res) {
    try {
      const servicesStatus = await this.getServicesStatusData();
      
      res.json({
        success: true,
        data: servicesStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get services status');
    }
  }

  /**
   * Get services status data
   */
  async getServicesStatusData() {
    return {
      daemon: {
        running: await this.dagsterWrapper.isDaemonRunning(),
        port: this.dagsterWrapper.daemonPort,
        pid: this.dagsterWrapper.getDaemonPid()
      },
      webUI: {
        running: await this.dagsterWrapper.isWebUIRunning(),
        port: this.dagsterWrapper.webUIPort,
        pid: this.dagsterWrapper.getWebUIPid(),
        url: `http://localhost:${this.dagsterWrapper.webUIPort}`
      },
      orchestrator: {
        running: this.isRunning,
        uptime: process.uptime()
      }
    };
  }

  /**
   * List all available assets
   */
  async listAssets(req, res) {
    try {
      const assets = await this.assetManager.listAssets();
      
      res.json({
        success: true,
        data: { assets },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to list assets');
    }
  }

  /**
   * Get asset details
   */
  async getAssetDetails(req, res) {
    try {
      const { asset_key } = req.params;
      const assetDetails = await this.assetManager.getAssetDetails(asset_key);
      
      res.json({
        success: true,
        data: assetDetails,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get asset details');
    }
  }

  /**
   * Materialize an asset
   */
  async materializeAsset(req, res) {
    try {
      const { asset_key } = req.params;
      const { config = {}, tags = {} } = req.body;
      
      const run = await this.dagsterWrapper.materializeAsset(asset_key, config, tags);
      
      securityLogger.logAssetMaterialization({
        asset_key,
        run_id: run.run_id,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: run,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to materialize asset');
    }
  }

  /**
   * Get asset lineage
   */
  async getAssetLineage(req, res) {
    try {
      const { asset_key } = req.params;
      const lineage = await this.assetManager.getAssetLineage(asset_key);
      
      res.json({
        success: true,
        data: lineage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get asset lineage');
    }
  }

  /**
   * Launch a pipeline run
   */
  async launchRun(req, res) {
    try {
      const { 
        job_name, 
        asset_selection = [], 
        config = {},
        tags = {},
        run_config = {}
      } = req.body;
      
      const run = await this.dagsterWrapper.launchRun({
        jobName: job_name,
        assetSelection: asset_selection,
        config,
        tags,
        runConfig: run_config
      });
      
      securityLogger.logPipelineRun({
        job_name,
        run_id: run.run_id,
        asset_selection,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: run,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to launch pipeline run');
    }
  }

  /**
   * List pipeline runs
   */
  async listRuns(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        status_filter,
        job_name_filter 
      } = req.query;
      
      const runs = await this.dagsterWrapper.listRuns({
        limit: parseInt(limit),
        offset: parseInt(offset),
        statusFilter: status_filter,
        jobNameFilter: job_name_filter
      });
      
      res.json({
        success: true,
        data: runs,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to list pipeline runs');
    }
  }

  /**
   * Get run details
   */
  async getRunDetails(req, res) {
    try {
      const { run_id } = req.params;
      const runDetails = await this.dagsterWrapper.getRunDetails(run_id);
      
      res.json({
        success: true,
        data: runDetails,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get run details');
    }
  }

  /**
   * Cancel a pipeline run
   */
  async cancelRun(req, res) {
    try {
      const { run_id } = req.params;
      const result = await this.dagsterWrapper.cancelRun(run_id);
      
      securityLogger.logPipelineOperation({
        operation: 'cancel_run',
        run_id,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to cancel run');
    }
  }

  /**
   * Get pipeline status monitoring data
   */
  async getPipelineStatus(req, res) {
    try {
      const status = await this.pipelineMonitor.getPipelineStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get pipeline status');
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req, res) {
    try {
      const metrics = await this.pipelineMonitor.getPerformanceMetrics();
      
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
   * Get alerts
   */
  async getAlerts(req, res) {
    try {
      const { severity = 'all', limit = 100 } = req.query;
      const alerts = await this.pipelineMonitor.getAlerts({
        severity,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: { alerts },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError(res, error, 'Failed to get alerts');
    }
  }

  /**
   * Handle errors consistently
   */
  handleError(res, error, message = 'Internal server error') {
    console.error(`${message}:`, error);
    
    securityLogger.logApiError({
      service: 'workflow-orchestrator',
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
   * Start the orchestrator service
   */
  async start() {
    try {
      console.log('🚀 Starting Workflow Orchestrator...');
      
      // Validate Dagster project setup
      await this.dagsterWrapper.validateProject();
      console.log('✅ Dagster project validated');
      
      // Initialize asset manager
      await this.assetManager.initialize();
      console.log('✅ Asset manager initialized');
      
      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Workflow Orchestrator running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🎯 Dagster Web UI will be available at: http://localhost:${this.dagsterWrapper.webUIPort}`);
        
        securityLogger.logServiceStart({
          service: 'workflow-orchestrator',
          port: this.port,
          dagster_project_path: this.dagsterProjectPath,
          dagster_available: this.dagsterWrapper.isAvailable(),
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Failed to start Workflow Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Stop the orchestrator service
   */
  async stop() {
    try {
      // Stop Dagster services first
      if (this.isRunning) {
        await this.dagsterWrapper.stopServices();
        this.isRunning = false;
      }
      
      // Stop HTTP server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('🛑 Workflow Orchestrator stopped');
            resolve();
          });
        });
      }
    } catch (error) {
      console.error('Error stopping Workflow Orchestrator:', error);
      throw error;
    }
  }
}

module.exports = WorkflowOrchestrator;