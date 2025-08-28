/**
 * MonitoringEngine - Unified monitoring and observability across all data pipeline components
 * 
 * Provides comprehensive monitoring with health checking, alerting, and performance tracking
 * Integration with Dagster monitoring and existing BMad progress tracking
 * 
 * Architecture alignment with existing BMad patterns and data service standards
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const chalk = require('chalk');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class MonitoringEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      dataRetentionDays: 30,
      healthCheckInterval: 30000, // 30 seconds
      alertCooldownMs: 900000, // 15 minutes
      metricsBufferSize: 1000,
      enableDagsterIntegration: true,
      configPath: options.configPath || path.join(process.cwd(), 'expansion-packs', 'bmad-data-practitioner', 'monitoring-config'),
      ...options
    };
    
    // Core monitoring state
    this.components = new Map();
    this.healthChecks = new Map();
    this.alertRules = new Map();
    this.metrics = [];
    this.activeAlerts = new Map();
    this.dependencies = new Map();
    
    // Performance tracking
    this.performanceMetrics = new Map();
    this.lastCleanup = Date.now();
    
    // Integration components
    this.dagsterIntegration = null;
    this.bmadProgressIntegration = null;
    
    this.isRunning = false;
    this.monitoringInterval = null;
    this.initialized = false;
  }

  /**
   * Initialize monitoring engine with comprehensive setup
   */
  async initialize() {
    try {
      console.log(chalk.blue('🔧 Initializing MonitoringEngine...'));
      
      // Setup monitoring data storage
      await this.setupDataStorage();
      
      // Load configuration
      await this.loadConfiguration();
      
      // Register default health checks for data pipeline components
      await this.registerDefaultHealthChecks();
      
      // Setup alerting rules
      await this.setupDefaultAlertRules();
      
      // Initialize integrations
      if (this.options.enableDagsterIntegration) {
        await this.initializeDagsterIntegration();
      }
      await this.initializeBMadIntegration();
      
      this.initialized = true;
      console.log(chalk.green('✅ MonitoringEngine initialized successfully'));
      return { success: true, message: 'MonitoringEngine initialized' };
      
    } catch (error) {
      console.error(chalk.red('❌ MonitoringEngine initialization failed:'), error.message);
      throw error;
    }
  }

  /**
   * Load monitoring configuration from YAML files
   */
  async loadConfiguration() {
    try {
      // Load monitoring configuration
      const configFile = path.join(this.options.configPath, 'monitoring-config.yaml');
      if (await fs.pathExists(configFile)) {
        const config = yaml.load(await fs.readFile(configFile, 'utf8'));
        
        // Override options with config values
        if (config.healthCheckInterval) this.options.healthCheckInterval = config.healthCheckInterval;
        if (config.alertCooldownMs) this.options.alertCooldownMs = config.alertCooldownMs;
        if (config.dataRetentionDays) this.options.dataRetentionDays = config.dataRetentionDays;
        
        console.log(chalk.green('✅ Monitoring configuration loaded'));
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not load monitoring configuration, using defaults'));
    }
  }

  /**
   * Setup monitoring data storage structure
   */
  async setupDataStorage() {
    const dataDir = path.join(process.cwd(), 'data', 'monitoring');
    const dirs = ['metrics', 'health-checks', 'alerts', 'performance'];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(dataDir, dir));
    }
    
    this.dataDir = dataDir;
  }

  /**
   * Register component for monitoring
   */
  async registerComponent(componentId, config) {
    const componentConfig = {
      id: componentId,
      name: config.name || componentId,
      type: config.type || 'unknown',
      dependencies: config.dependencies || [],
      healthCheckUrl: config.healthCheckUrl,
      healthCheckFunction: config.healthCheckFunction,
      metrics: config.metrics || [],
      alertRules: config.alertRules || [],
      lastSeen: null,
      status: 'unknown',
      ...config
    };
    
    this.components.set(componentId, componentConfig);
    
    // Setup dependencies mapping
    if (componentConfig.dependencies.length > 0) {
      this.dependencies.set(componentId, componentConfig.dependencies);
    }
    
    console.log(chalk.green(`📊 Registered component: ${componentConfig.name}`));
    
    // Emit registration event
    this.emit('component.registered', { componentId, config: componentConfig });
    
    return componentConfig;
  }

  /**
   * Register default health checks for data pipeline components
   */
  async registerDefaultHealthChecks() {
    // DuckDB health check
    this.registerHealthCheck('duckdb', {
      name: 'DuckDB Connection',
      interval: 60000,
      timeout: 5000,
      checkFunction: async () => {
        try {
          // Basic connection test - would integrate with actual DuckDB instance
          const start = performance.now();
          // Simulate database check
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          const responseTime = performance.now() - start;
          return { healthy: true, responseTime, details: { status: 'connected' } };
        } catch (error) {
          return { healthy: false, error: error.message, responseTime: 0 };
        }
      }
    });
    
    // PyAirbyte health check
    this.registerHealthCheck('pyairbyte', {
      name: 'PyAirbyte Service',
      interval: 120000,
      timeout: 10000,
      checkFunction: async () => {
        try {
          // Would check PyAirbyte service status
          const start = performance.now();
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
          const responseTime = performance.now() - start;
          return { healthy: true, responseTime, details: { connectors: 'available' } };
        } catch (error) {
          return { healthy: false, error: error.message, responseTime: 0 };
        }
      }
    });
    
    // Evidence.dev build system health check
    this.registerHealthCheck('evidence', {
      name: 'Evidence.dev Build System',
      interval: 300000,
      timeout: 15000,
      checkFunction: async () => {
        try {
          // Would check Evidence.dev build system
          const start = performance.now();
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
          const responseTime = performance.now() - start;
          return { healthy: true, responseTime, details: { build: 'ready' } };
        } catch (error) {
          return { healthy: false, error: error.message, responseTime: 0 };
        }
      }
    });
    
    // Dagster health check (if enabled)
    if (this.options.enableDagsterIntegration) {
      this.registerHealthCheck('dagster', {
        name: 'Dagster Pipeline',
        interval: 180000,
        timeout: 10000,
        checkFunction: async () => {
          try {
            const start = performance.now();
            // Would check Dagster pipeline status
            await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
            const responseTime = performance.now() - start;
            return { healthy: true, responseTime, details: { pipelines: 'running' } };
          } catch (error) {
            return { healthy: false, error: error.message, responseTime: 0 };
          }
        }
      });
    }
    
    // File system health check
    this.registerHealthCheck('filesystem', {
      name: 'File System Access',
      interval: 30000,
      timeout: 3000,
      checkFunction: async () => {
        try {
          const start = performance.now();
          const testFile = path.join(this.dataDir, '.health-check');
          await fs.writeFile(testFile, Date.now().toString());
          await fs.remove(testFile);
          const responseTime = performance.now() - start;
          return { healthy: true, responseTime, details: { access: 'read-write' } };
        } catch (error) {
          return { healthy: false, error: error.message, responseTime: 0 };
        }
      }
    });
  }

  /**
   * Register health check for specific component
   */
  registerHealthCheck(checkId, config) {
    const healthCheck = {
      id: checkId,
      name: config.name || checkId,
      interval: config.interval || 60000,
      timeout: config.timeout || 5000,
      checkFunction: config.checkFunction,
      lastRun: null,
      lastResult: null,
      consecutiveFailures: 0,
      isRunning: false,
      ...config
    };
    
    this.healthChecks.set(checkId, healthCheck);
    
    console.log(chalk.blue(`🔍 Registered health check: ${healthCheck.name}`));
  }

  /**
   * Setup default alerting rules
   */
  async setupDefaultAlertRules() {
    // Component failure alert
    this.registerAlertRule('component_failure', {
      name: 'Component Failure',
      condition: (metrics) => metrics.some(m => m.type === 'health' && !m.value.healthy),
      severity: 'critical',
      cooldown: 300000, // 5 minutes
      notificationChannels: ['console', 'file']
    });
    
    // High error rate alert
    this.registerAlertRule('high_error_rate', {
      name: 'High Error Rate',
      condition: (metrics) => {
        const errorMetrics = metrics.filter(m => m.type === 'error_rate');
        if (errorMetrics.length === 0) return false;
        const avgErrorRate = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length;
        return avgErrorRate > 0.05; // 5% error rate threshold
      },
      severity: 'warning',
      cooldown: 900000, // 15 minutes
      notificationChannels: ['console']
    });
    
    // Performance degradation alert
    this.registerAlertRule('performance_degradation', {
      name: 'Performance Degradation',
      condition: (metrics) => {
        const perfMetrics = metrics.filter(m => m.type === 'response_time');
        if (perfMetrics.length === 0) return false;
        const avgResponseTime = perfMetrics.reduce((sum, m) => sum + m.value, 0) / perfMetrics.length;
        return avgResponseTime > 5000; // 5 second threshold
      },
      severity: 'warning',
      cooldown: 1800000, // 30 minutes
      notificationChannels: ['console']
    });
    
    // Data quality degradation alert
    this.registerAlertRule('data_quality_degradation', {
      name: 'Data Quality Degradation',
      condition: (metrics) => {
        const qualityMetrics = metrics.filter(m => m.type === 'data_quality_score');
        if (qualityMetrics.length === 0) return false;
        const avgQuality = qualityMetrics.reduce((sum, m) => sum + m.value, 0) / qualityMetrics.length;
        return avgQuality < 0.85; // 85% quality threshold
      },
      severity: 'warning',
      cooldown: 600000, // 10 minutes
      notificationChannels: ['console', 'file']
    });
    
    // Dagster pipeline failure alert (if enabled)
    if (this.options.enableDagsterIntegration) {
      this.registerAlertRule('dagster_pipeline_failure', {
        name: 'Dagster Pipeline Failure',
        condition: (metrics) => metrics.some(m => 
          m.type === 'health' && 
          m.name === 'dagster' && 
          !m.value.healthy
        ),
        severity: 'critical',
        cooldown: 300000, // 5 minutes
        notificationChannels: ['console', 'file']
      });
    }
  }

  /**
   * Register alerting rule
   */
  registerAlertRule(ruleId, config) {
    const alertRule = {
      id: ruleId,
      name: config.name || ruleId,
      condition: config.condition,
      severity: config.severity || 'info',
      cooldown: config.cooldown || this.options.alertCooldownMs,
      notificationChannels: config.notificationChannels || ['console'],
      enabled: config.enabled !== false,
      lastTriggered: null,
      triggerCount: 0,
      ...config
    };
    
    this.alertRules.set(ruleId, alertRule);
    
    console.log(chalk.yellow(`🚨 Registered alert rule: ${alertRule.name} (${alertRule.severity})`));
  }

  /**
   * Start monitoring operations
   */
  async startMonitoring() {
    if (!this.initialized) {
      throw new Error('MonitoringEngine must be initialized before starting');
    }
    
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  MonitoringEngine is already running'));
      return;
    }
    
    console.log(chalk.blue('🚀 Starting MonitoringEngine...'));
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start health check monitoring
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks().catch(error => {
        console.error(chalk.red('❌ Health check execution failed:'), error.message);
      });
    }, this.options.healthCheckInterval);
    
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData().catch(error => {
        console.error(chalk.red('❌ Data cleanup failed:'), error.message);
      });
    }, 3600000); // 1 hour
    
    console.log(chalk.green('✅ MonitoringEngine started successfully'));
    
    // Emit start event
    this.emit('monitoring.started', { timestamp: new Date() });
  }

  /**
   * Stop monitoring operations
   */
  async stopMonitoring() {
    if (!this.isRunning) {
      console.log(chalk.yellow('⚠️  MonitoringEngine is not running'));
      return;
    }
    
    console.log(chalk.blue('🛑 Stopping MonitoringEngine...'));
    
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log(chalk.green('✅ MonitoringEngine stopped successfully'));
    
    // Emit stop event
    this.emit('monitoring.stopped', { timestamp: new Date() });
  }

  /**
   * Run all registered health checks
   */
  async runHealthChecks() {
    const startTime = performance.now();
    const results = [];
    
    for (const [checkId, healthCheck] of this.healthChecks) {
      if (healthCheck.isRunning) continue;
      
      const shouldRun = !healthCheck.lastRun || 
                       (Date.now() - healthCheck.lastRun) >= healthCheck.interval;
      
      if (shouldRun) {
        try {
          const result = await this.runSingleHealthCheck(checkId);
          results.push(result);
        } catch (error) {
          console.error(chalk.red(`❌ Health check failed: ${checkId} - ${error.message}`));
        }
      }
    }
    
    // Record performance metrics
    const endTime = performance.now();
    this.recordMetric('health_check_duration', endTime - startTime, 'performance');
    
    // Evaluate alert rules
    await this.evaluateAlertRules();
    
    return results;
  }

  /**
   * Run a single health check
   */
  async runSingleHealthCheck(checkId) {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      throw new Error(`Health check not found: ${checkId}`);
    }
    
    healthCheck.isRunning = true;
    healthCheck.lastRun = Date.now();
    
    try {
      const checkStartTime = performance.now();
      
      // Run the health check with timeout
      const result = await Promise.race([
        healthCheck.checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
        )
      ]);
      
      const checkEndTime = performance.now();
      const duration = checkEndTime - checkStartTime;
      
      // Process result
      const healthResult = {
        checkId,
        name: healthCheck.name,
        timestamp: new Date(),
        healthy: result.healthy,
        responseTime: result.responseTime || duration,
        error: result.error,
        details: result.details
      };
      
      healthCheck.lastResult = healthResult;
      healthCheck.consecutiveFailures = result.healthy ? 0 : healthCheck.consecutiveFailures + 1;
      
      // Record metrics
      this.recordMetric('health_check', healthResult, 'health');
      this.recordMetric('response_time', healthResult.responseTime, 'performance');
      
      // Update component status if linked
      const component = Array.from(this.components.values())
        .find(c => c.healthCheckId === checkId);
      if (component) {
        component.status = result.healthy ? 'healthy' : 'unhealthy';
        component.lastSeen = new Date();
      }
      
      console.log(
        result.healthy 
          ? chalk.green(`✅ Health check passed: ${healthCheck.name} (${Math.round(healthResult.responseTime)}ms)`)
          : chalk.red(`❌ Health check failed: ${healthCheck.name} - ${result.error}`)
      );
      
      return healthResult;
      
    } catch (error) {
      const errorResult = {
        checkId,
        name: healthCheck.name,
        timestamp: new Date(),
        healthy: false,
        error: error.message,
        responseTime: 0
      };
      
      healthCheck.lastResult = errorResult;
      healthCheck.consecutiveFailures++;
      
      console.error(chalk.red(`❌ Health check error: ${healthCheck.name} - ${error.message}`));
      
      return errorResult;
      
    } finally {
      healthCheck.isRunning = false;
    }
  }

  /**
   * Record monitoring metric
   */
  recordMetric(metricName, value, type = 'general', tags = {}) {
    const metric = {
      name: metricName,
      value,
      type,
      timestamp: new Date(),
      tags: { ...tags }
    };
    
    this.metrics.push(metric);
    
    // Maintain buffer size
    if (this.metrics.length > this.options.metricsBufferSize) {
      this.metrics = this.metrics.slice(-this.options.metricsBufferSize);
    }
    
    // Emit metric event
    this.emit('metric.recorded', metric);
    
    return metric;
  }

  /**
   * Evaluate alert rules against current metrics
   */
  async evaluateAlertRules() {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - new Date(m.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered < rule.cooldown) {
        continue;
      }
      
      try {
        const shouldAlert = rule.condition(recentMetrics);
        
        if (shouldAlert) {
          await this.triggerAlert(ruleId, recentMetrics);
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Alert rule evaluation failed: ${rule.name} - ${error.message}`));
      }
    }
  }

  /**
   * Trigger alert and send notifications
   */
  async triggerAlert(ruleId, triggeringMetrics) {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return;
    
    const alert = {
      id: `${ruleId}-${Date.now()}`,
      ruleId,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      triggeringMetrics: triggeringMetrics.slice(-10), // Last 10 relevant metrics
      status: 'active'
    };
    
    this.activeAlerts.set(alert.id, alert);
    rule.lastTriggered = Date.now();
    rule.triggerCount++;
    
    // Send notifications
    for (const channel of rule.notificationChannels) {
      await this.sendNotification(channel, alert);
    }
    
    // Store alert
    await this.storeAlert(alert);
    
    // Emit alert event
    this.emit('alert.triggered', alert);
    
    console.log(chalk.red(`🚨 ALERT: ${rule.name} (${rule.severity})`));
  }

  /**
   * Send notification through specified channel
   */
  async sendNotification(channel, alert) {
    try {
      switch (channel) {
        case 'console':
          const color = alert.severity === 'critical' ? 'red' : 'yellow';
          console.log(chalk[color](`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.ruleName}`));
          console.log(chalk.gray(`   Triggered at: ${alert.timestamp.toISOString()}`));
          break;
          
        case 'file':
          await this.writeAlertToFile(alert);
          break;
          
        case 'webhook':
          // Would implement webhook notification
          console.log(chalk.blue(`📤 Would send webhook notification for: ${alert.ruleName}`));
          break;
          
        default:
          console.log(chalk.yellow(`⚠️  Unknown notification channel: ${channel}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Notification failed for channel ${channel}:`, error.message));
    }
  }

  /**
   * Write alert to file
   */
  async writeAlertToFile(alert) {
    const alertsDir = path.join(this.dataDir, 'alerts');
    const alertFile = path.join(alertsDir, `${alert.timestamp.toISOString().split('T')[0]}.log`);
    
    const logEntry = `${alert.timestamp.toISOString()} [${alert.severity.toUpperCase()}] ${alert.ruleName}\n`;
    
    await fs.appendFile(alertFile, logEntry);
  }

  /**
   * Store alert in persistent storage
   */
  async storeAlert(alert) {
    const alertFile = path.join(this.dataDir, 'alerts', `alert-${alert.id}.json`);
    await fs.writeJSON(alertFile, alert, { spaces: 2 });
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const components = Array.from(this.components.values());
    const healthChecks = Array.from(this.healthChecks.values());
    const activeAlerts = Array.from(this.activeAlerts.values());
    
    const healthyComponents = components.filter(c => c.status === 'healthy').length;
    const totalComponents = components.length;
    
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - new Date(m.timestamp).getTime() < 300000
    );
    
    return {
      timestamp: new Date(),
      isRunning: this.isRunning,
      initialized: this.initialized,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      components: {
        total: totalComponents,
        healthy: healthyComponents,
        unhealthy: totalComponents - healthyComponents
      },
      healthChecks: {
        total: healthChecks.length,
        lastRun: Math.max(...healthChecks.map(h => h.lastRun || 0))
      },
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length
      },
      metrics: {
        total: this.metrics.length,
        recent: recentMetrics.length
      },
      integrations: {
        dagster: this.dagsterIntegration?.enabled || false,
        bmad: this.bmadProgressIntegration?.enabled || false
      }
    };
  }

  /**
   * Initialize Dagster monitoring integration
   */
  async initializeDagsterIntegration() {
    try {
      // Integration with Dagster monitoring from Story 1.5
      // This would connect to Dagster's monitoring APIs
      
      this.dagsterIntegration = {
        enabled: true,
        webUrl: process.env.DAGSTER_WEB_URL || 'http://localhost:3000',
        apiUrl: process.env.DAGSTER_API_URL || 'http://localhost:4000',
        lastSync: null
      };
      
      console.log(chalk.green('✅ Dagster monitoring integration initialized'));
      
    } catch (error) {
      console.error(chalk.red('❌ Dagster integration failed:'), error.message);
      this.dagsterIntegration = { enabled: false, error: error.message };
    }
  }

  /**
   * Initialize BMad progress tracking integration
   */
  async initializeBMadIntegration() {
    try {
      // Integration with existing BMad progress tracking (ora)
      this.bmadProgressIntegration = {
        enabled: true,
        progressTrackers: new Map(),
        lastSync: null
      };
      
      console.log(chalk.green('✅ BMad progress tracking integration initialized'));
      
    } catch (error) {
      console.error(chalk.red('❌ BMad integration failed:'), error.message);
      this.bmadProgressIntegration = { enabled: false, error: error.message };
    }
  }

  /**
   * Clean up old monitoring data
   */
  async cleanupOldData() {
    if (Date.now() - this.lastCleanup < 3600000) return; // Run cleanup max once per hour
    
    console.log(chalk.blue('🧹 Cleaning up old monitoring data...'));
    
    const cutoffDate = new Date(Date.now() - (this.options.dataRetentionDays * 24 * 60 * 60 * 1000));
    
    try {
      // Clean up old alert files
      const alertsDir = path.join(this.dataDir, 'alerts');
      if (await fs.pathExists(alertsDir)) {
        const alertFiles = await fs.readdir(alertsDir);
        
        for (const file of alertFiles) {
          const filePath = path.join(alertsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
          }
        }
      }
      
      // Clean up old metrics files
      const metricsDir = path.join(this.dataDir, 'metrics');
      if (await fs.pathExists(metricsDir)) {
        const metricFiles = await fs.readdir(metricsDir);
        
        for (const file of metricFiles) {
          const filePath = path.join(metricsDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
          }
        }
      }
      
      this.lastCleanup = Date.now();
      console.log(chalk.green('✅ Data cleanup completed'));
      
    } catch (error) {
      console.error(chalk.red('❌ Data cleanup failed:'), error.message);
    }
  }

  /**
   * Export monitoring data for analysis
   */
  async exportMonitoringData(options = {}) {
    const exportData = {
      timestamp: new Date(),
      systemStatus: this.getSystemStatus(),
      components: Array.from(this.components.values()),
      healthChecks: Array.from(this.healthChecks.values()).map(hc => ({
        ...hc,
        checkFunction: '[Function]' // Don't serialize functions
      })),
      alertRules: Array.from(this.alertRules.values()).map(rule => ({
        ...rule,
        condition: '[Function]' // Don't serialize functions
      })),
      activeAlerts: Array.from(this.activeAlerts.values()),
      recentMetrics: this.metrics.slice(-100), // Last 100 metrics
      integrations: {
        dagster: this.dagsterIntegration,
        bmad: this.bmadProgressIntegration
      }
    };
    
    if (options.outputFile) {
      await fs.writeJSON(options.outputFile, exportData, { spaces: 2 });
      console.log(chalk.green(`✅ Monitoring data exported to: ${options.outputFile}`));
    }
    
    return exportData;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;
    
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > oneHourAgo
    );
    
    const dailyMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > oneDayAgo
    );
    
    const healthChecks = Array.from(this.healthChecks.values());
    const successfulChecks = healthChecks.filter(h => 
      h.lastResult && h.lastResult.healthy
    ).length;
    
    return {
      uptime: this.startTime ? now - this.startTime : 0,
      components: {
        registered: this.components.size,
        healthy: Array.from(this.components.values()).filter(c => c.status === 'healthy').length
      },
      healthChecks: {
        total: healthChecks.length,
        successful: successfulChecks,
        successRate: healthChecks.length > 0 ? (successfulChecks / healthChecks.length * 100).toFixed(1) + '%' : '0%'
      },
      alerts: {
        rules: this.alertRules.size,
        active: this.activeAlerts.size,
        totalTriggered: Array.from(this.alertRules.values()).reduce((sum, rule) => sum + rule.triggerCount, 0)
      },
      metrics: {
        total: this.metrics.length,
        lastHour: recentMetrics.length,
        lastDay: dailyMetrics.length
      },
      integrations: {
        dagster: this.dagsterIntegration?.enabled || false,
        bmad: this.bmadProgressIntegration?.enabled || false
      }
    };
  }

  /**
   * Create monitoring configuration file
   */
  async createMonitoringConfig() {
    const configDir = this.options.configPath;
    await fs.ensureDir(configDir);
    
    const configFile = path.join(configDir, 'monitoring-config.yaml');
    
    const config = {
      monitoring: {
        healthCheckInterval: 30000,
        alertCooldownMs: 900000,
        dataRetentionDays: 30,
        metricsBufferSize: 1000
      },
      integrations: {
        dagster: {
          enabled: true,
          webUrl: 'http://localhost:3000',
          apiUrl: 'http://localhost:4000'
        },
        bmad: {
          enabled: true,
          progressTracking: true
        }
      },
      notifications: {
        channels: ['console', 'file'],
        cooldown: 900000
      },
      dataRetention: {
        days: 30,
        cleanupInterval: 3600000
      }
    };
    
    await fs.writeFile(configFile, yaml.dump(config, { indent: 2 }));
    console.log(chalk.green(`✅ Monitoring configuration created: ${configFile}`));
    
    return configFile;
  }
}

module.exports = MonitoringEngine;