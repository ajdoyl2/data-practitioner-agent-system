/**
 * Observability Integration
 * Integrates data pipeline monitoring with existing BMad monitoring systems
 * Provides unified observability across all system components
 */

const fs = require('fs-extra');
const path = require('path');
const { securityLogger } = require('../lib/security-logger');
const { system } = require('./monitoring-logger');
const { alertingEngine } = require('./alerting-engine');
const { performanceMonitor } = require('./performance-monitor');
const { dashboard } = require('./monitoring-dashboard');

/**
 * Observability Integration Class
 */
class ObservabilityIntegration {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      bMadIntegration: options.bMadIntegration !== false,
      collectSystemMetrics: options.collectSystemMetrics !== false,
      correlationEnabled: options.correlationEnabled !== false,
      unifiedLogging: options.unifiedLogging !== false
    };
    
    this.state = {
      isRunning: false,
      integrations: new Map(),
      correlationMap: new Map(),
      healthChecks: new Map()
    };
    
    this.setupBMadIntegration();
  }
  
  /**
   * Setup BMad integration
   */
  setupBMadIntegration() {
    // Map existing BMad components to data pipeline monitoring
    this.bmadComponents = {
      // CLI and workflow components
      'cli-main': { category: 'system', priority: 'high' },
      'web-builder': { category: 'publication', priority: 'medium' },
      'installer': { category: 'system', priority: 'low' },
      
      // Security and authentication
      'security-logger': { category: 'security', priority: 'critical' },
      'auth-middleware': { category: 'security', priority: 'high' },
      'feature-flag-manager': { category: 'system', priority: 'medium' },
      
      // Data services
      'duckdb-wrapper': { category: 'analytics', priority: 'high' },
      'pyairbyte-wrapper': { category: 'ingestion', priority: 'high' },
      'dagster-wrapper': { category: 'orchestration', priority: 'high' },
      
      // Quality and testing
      'quality-assurance-engine': { category: 'quality', priority: 'critical' },
      'test-orchestrator': { category: 'testing', priority: 'medium' }
    };
  }
  
  /**
   * Start observability integration
   */
  async start() {
    if (this.state.isRunning) {
      console.log('Observability integration already running');
      return;
    }
    
    if (!this.config.enabled) {
      console.log('Observability integration is disabled');
      return;
    }
    
    console.log('🔍 Starting observability integration...');
    
    await system.monitoringStarted({
      component: 'observability-integration',
      bmad_integration: this.config.bMadIntegration,
      correlation_enabled: this.config.correlationEnabled,
      unified_logging: this.config.unifiedLogging
    });
    
    // Initialize integrations
    await this.initializeIntegrations();
    
    // Setup event forwarding
    this.setupEventForwarding();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    this.state.isRunning = true;
    
    console.log('✅ Observability integration started');
  }
  
  /**
   * Stop observability integration
   */
  async stop() {
    if (!this.state.isRunning) {
      return;
    }
    
    console.log('⏹️ Stopping observability integration...');
    
    await system.monitoringStopped({
      component: 'observability-integration',
      integrations: this.state.integrations.size
    });
    
    this.state.isRunning = false;
    console.log('✅ Observability integration stopped');
  }
  
  /**
   * Initialize integrations with existing BMad systems
   */
  async initializeIntegrations() {
    try {
      // Integrate with existing security logger
      this.integrateSecurityLogger();
      
      // Integrate with existing monitoring systems
      this.integrateExistingMonitoring();
      
      // Setup unified health checks
      this.setupUnifiedHealthChecks();
      
      console.log(`🔗 Initialized ${this.state.integrations.size} observability integrations`);
      
    } catch (error) {
      console.error('Failed to initialize integrations:', error.message);
    }
  }
  
  /**
   * Integrate with existing security logger
   */
  integrateSecurityLogger() {
    // Extend security logger to include data pipeline events
    const originalLogApiRequest = securityLogger.logApiRequest;
    const originalLogApiError = securityLogger.logApiError;
    const originalLogSecurityEvent = securityLogger.logSecurityEvent;
    
    // Enhance API request logging with pipeline context
    securityLogger.logApiRequest = (data) => {
      originalLogApiRequest(data);
      
      // Forward to pipeline monitoring if relevant
      if (this.isPipelineRelated(data)) {
        this.forwardToPipelineMonitoring('api_request', data);
      }
    };
    
    // Enhance API error logging with pipeline context
    securityLogger.logApiError = (data) => {
      originalLogApiError(data);
      
      // Forward pipeline-related errors to alerting system
      if (this.isPipelineRelated(data)) {
        this.forwardToPipelineMonitoring('api_error', data);
        
        // Trigger alert for critical pipeline errors
        if (data.status >= 500) {
          alertingEngine.sendAlert({
            title: 'Pipeline API Error',
            message: `API error in ${data.endpoint}: ${data.error}`,
            severity: 'error',
            category: 'pipeline',
            source: 'api',
            metadata: data
          });
        }
      }
    };
    
    // Enhance security event logging
    securityLogger.logSecurityEvent = (level, event, data) => {
      originalLogSecurityEvent(level, event, data);
      
      // Forward security events to unified monitoring
      this.forwardSecurityEvent(level, event, data);
    };
    
    this.state.integrations.set('security-logger', {
      type: 'security',
      status: 'active',
      enhanced: true
    });
    
    console.log('🔐 Enhanced security logger with pipeline integration');
  }
  
  /**
   * Check if data/event is pipeline-related
   */
  isPipelineRelated(data) {
    const pipelineIndicators = [
      'duckdb', 'pyairbyte', 'dagster', 'quality', 'pipeline',
      'transformation', 'ingestion', 'analytics', 'publication'
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return pipelineIndicators.some(indicator => dataString.includes(indicator));
  }
  
  /**
   * Forward event to pipeline monitoring
   */
  forwardToPipelineMonitoring(eventType, data) {
    if (dashboard.state.isRunning) {
      dashboard.emit('pipeline:metric', {
        name: eventType,
        value: 1,
        timestamp: Date.now(),
        category: this.categorizeEvent(eventType, data),
        metadata: data
      });
    }
  }
  
  /**
   * Forward security event to unified monitoring
   */
  forwardSecurityEvent(level, event, data) {
    if (level === 'ERROR' || level === 'CRITICAL') {
      alertingEngine.sendAlert({
        title: 'Security Event',
        message: `Security event: ${event}`,
        severity: level.toLowerCase(),
        category: 'security',
        source: 'security-logger',
        metadata: data
      });
    }
  }
  
  /**
   * Integrate with existing monitoring systems
   */
  integrateExistingMonitoring() {
    // Monitor BMad CLI operations
    this.monitorBMadCLI();
    
    // Monitor web builder operations
    this.monitorWebBuilder();
    
    // Monitor installer operations
    this.monitorInstaller();
    
    console.log('📊 Integrated with existing BMad monitoring systems');
  }
  
  /**
   * Monitor BMad CLI operations
   */
  monitorBMadCLI() {
    const cliLogPath = path.join(__dirname, '../../logs/cli-operations.log');
    
    // Watch for CLI log changes if file exists
    if (fs.existsSync(cliLogPath)) {
      fs.watchFile(cliLogPath, (curr, prev) => {
        if (curr.size > prev.size) {
          this.processCLILogs(cliLogPath);
        }
      });
    }
    
    this.state.integrations.set('bmad-cli', {
      type: 'system',
      status: 'monitoring',
      log_path: cliLogPath
    });
  }
  
  /**
   * Monitor web builder operations
   */
  monitorWebBuilder() {
    // Hook into web builder events if available
    try {
      const webBuilderPath = path.join(__dirname, '../builders/web-builder.js');
      if (fs.existsSync(webBuilderPath)) {
        // Monitor web builder build events
        this.state.integrations.set('web-builder', {
          type: 'publication',
          status: 'monitoring',
          component_path: webBuilderPath
        });
      }
    } catch (error) {
      console.log('Web builder monitoring setup failed:', error.message);
    }
  }
  
  /**
   * Monitor installer operations
   */
  monitorInstaller() {
    const installerLogPath = path.join(__dirname, '../../logs/installer.log');
    
    if (fs.existsSync(installerLogPath)) {
      this.state.integrations.set('installer', {
        type: 'system',
        status: 'monitoring',
        log_path: installerLogPath
      });
    }
  }
  
  /**
   * Setup unified health checks
   */
  setupUnifiedHealthChecks() {
    const healthChecks = {
      'security-logger': this.checkSecurityLoggerHealth,
      'data-pipeline': this.checkDataPipelineHealth,
      'monitoring-systems': this.checkMonitoringSystemsHealth,
      'alert-systems': this.checkAlertSystemsHealth
    };
    
    for (const [checkName, checkFunction] of Object.entries(healthChecks)) {
      this.state.healthChecks.set(checkName, {
        name: checkName,
        check: checkFunction.bind(this),
        interval: 60000, // 1 minute
        lastRun: null,
        status: 'unknown'
      });
    }
    
    console.log(`🏥 Setup ${this.state.healthChecks.size} unified health checks`);
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    for (const [checkName, healthCheck] of this.state.healthChecks.entries()) {
      setInterval(async () => {
        try {
          const result = await healthCheck.check();
          healthCheck.lastRun = new Date().toISOString();
          healthCheck.status = result.status;
          
          if (result.status !== 'healthy') {
            await this.handleUnhealthyComponent(checkName, result);
          }
        } catch (error) {
          console.error(`Health check failed for ${checkName}:`, error.message);
          healthCheck.status = 'error';
        }
      }, healthCheck.interval);
    }
  }
  
  /**
   * Check security logger health
   */
  async checkSecurityLoggerHealth() {
    try {
      const securityLogPath = path.join(__dirname, '../../logs/security.log');
      const auditLogPath = path.join(__dirname, '../../logs/audit.log');
      
      const securityExists = await fs.pathExists(securityLogPath);
      const auditExists = await fs.pathExists(auditLogPath);
      
      if (!securityExists || !auditExists) {
        return {
          status: 'warning',
          message: 'Log files missing',
          details: { security_log: securityExists, audit_log: auditExists }
        };
      }
      
      // Check if logs are being written (file modified in last 10 minutes)
      const securityStats = await fs.stat(securityLogPath);
      const timeSinceModified = Date.now() - securityStats.mtime.getTime();
      
      if (timeSinceModified > 10 * 60 * 1000) {
        return {
          status: 'warning',
          message: 'Security logs not recently updated',
          details: { last_modified: securityStats.mtime.toISOString() }
        };
      }
      
      return {
        status: 'healthy',
        message: 'Security logger functioning normally',
        details: { logs_present: true, recently_active: true }
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: 'Security logger health check failed',
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Check data pipeline health
   */
  async checkDataPipelineHealth() {
    const components = ['dashboard', 'alerting', 'performance-monitor'];
    const health = {
      dashboard: dashboard.state?.isRunning || false,
      alerting: alertingEngine.state?.isRunning || false,
      performance_monitor: performanceMonitor.state?.isRunning || false
    };
    
    const healthyComponents = Object.values(health).filter(Boolean).length;
    const totalComponents = Object.keys(health).length;
    
    if (healthyComponents === totalComponents) {
      return {
        status: 'healthy',
        message: 'All data pipeline components running',
        details: health
      };
    } else if (healthyComponents > 0) {
      return {
        status: 'warning',
        message: `${healthyComponents}/${totalComponents} components running`,
        details: health
      };
    } else {
      return {
        status: 'critical',
        message: 'No data pipeline components running',
        details: health
      };
    }
  }
  
  /**
   * Check monitoring systems health
   */
  async checkMonitoringSystemsHealth() {
    const integrations = Array.from(this.state.integrations.values());
    const activeIntegrations = integrations.filter(i => i.status === 'active' || i.status === 'monitoring');
    
    return {
      status: activeIntegrations.length > 0 ? 'healthy' : 'warning',
      message: `${activeIntegrations.length}/${integrations.length} integrations active`,
      details: {
        total: integrations.length,
        active: activeIntegrations.length,
        integrations: Object.fromEntries(this.state.integrations)
      }
    };
  }
  
  /**
   * Check alert systems health
   */
  async checkAlertSystemsHealth() {
    const alertStats = alertingEngine.getAlertStats ? alertingEngine.getAlertStats() : null;
    
    if (!alertStats) {
      return {
        status: 'warning',
        message: 'Alert system not available',
        details: { alerting_engine_running: false }
      };
    }
    
    // Check if we're getting too many alerts (possible alert storm)
    if (alertStats.last_hour > 20) {
      return {
        status: 'warning',
        message: 'High alert volume detected',
        details: { alerts_last_hour: alertStats.last_hour }
      };
    }
    
    return {
      status: 'healthy',
      message: 'Alert system functioning normally',
      details: {
        total_alerts: alertStats.total_alerts,
        last_hour: alertStats.last_hour,
        escalations: alertStats.escalations
      }
    };
  }
  
  /**
   * Handle unhealthy component
   */
  async handleUnhealthyComponent(componentName, healthResult) {
    console.log(`🚨 Unhealthy component detected: ${componentName} (${healthResult.status})`);
    
    await alertingEngine.sendAlert({
      title: `Component Health Issue: ${componentName}`,
      message: healthResult.message,
      severity: healthResult.status === 'critical' ? 'critical' : 'warning',
      category: 'system_health',
      source: 'observability-integration',
      component: componentName,
      metadata: healthResult.details || {}
    });
  }
  
  /**
   * Setup event forwarding between systems
   */
  setupEventForwarding() {
    if (this.config.correlationEnabled) {
      this.setupEventCorrelation();
    }
    
    console.log('🔄 Setup event forwarding between monitoring systems');
  }
  
  /**
   * Setup event correlation
   */
  setupEventCorrelation() {
    // Correlate events from different sources using timing and context
    const correlationWindow = 30000; // 30 seconds
    
    // Listen for events from different sources
    dashboard.on('dashboard:alert', (alert) => {
      this.correlateEvent('dashboard', alert, correlationWindow);
    });
    
    // Add more event sources as needed
  }
  
  /**
   * Correlate events from different sources
   */
  correlateEvent(source, event, windowMs) {
    const eventKey = `${event.category}_${event.source}`;
    const now = Date.now();
    
    // Clean old correlations
    for (const [key, correlation] of this.state.correlationMap.entries()) {
      if (now - correlation.timestamp > windowMs) {
        this.state.correlationMap.delete(key);
      }
    }
    
    // Check for existing correlations
    const existingCorrelation = this.state.correlationMap.get(eventKey);
    
    if (existingCorrelation) {
      existingCorrelation.events.push({ source, event, timestamp: now });
      existingCorrelation.count++;
      
      // If we have multiple correlated events, create a correlation alert
      if (existingCorrelation.count >= 3) {
        this.createCorrelationAlert(eventKey, existingCorrelation);
        this.state.correlationMap.delete(eventKey); // Reset after alert
      }
    } else {
      this.state.correlationMap.set(eventKey, {
        eventKey,
        timestamp: now,
        count: 1,
        events: [{ source, event, timestamp: now }]
      });
    }
  }
  
  /**
   * Create correlation alert
   */
  async createCorrelationAlert(eventKey, correlation) {
    await alertingEngine.sendAlert({
      title: `Correlated Events Detected: ${eventKey}`,
      message: `${correlation.count} related events occurred within 30 seconds`,
      severity: 'warning',
      category: 'system_health',
      source: 'observability-integration',
      metadata: {
        event_key: eventKey,
        event_count: correlation.count,
        time_window: '30s',
        sources: correlation.events.map(e => e.source)
      }
    });
  }
  
  /**
   * Process CLI logs for monitoring
   */
  async processCLILogs(logPath) {
    try {
      // Read last few lines of log file
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.length > 0);
      const recentLines = lines.slice(-10); // Last 10 lines
      
      // Process each line for relevant events
      for (const line of recentLines) {
        if (line.includes('ERROR') || line.includes('CRITICAL')) {
          await this.handleCLIError(line);
        }
      }
    } catch (error) {
      console.error('Failed to process CLI logs:', error.message);
    }
  }
  
  /**
   * Handle CLI errors
   */
  async handleCLIError(logLine) {
    await alertingEngine.sendAlert({
      title: 'BMad CLI Error',
      message: `CLI error detected: ${logLine}`,
      severity: 'error',
      category: 'system_health',
      source: 'bmad-cli',
      metadata: { log_line: logLine }
    });
  }
  
  /**
   * Categorize event for monitoring
   */
  categorizeEvent(eventType, data) {
    const eventCategories = {
      'api_request': 'system',
      'api_error': 'system',
      'data_ingestion': 'ingestion',
      'transformation': 'transformation',
      'quality_check': 'quality',
      'pipeline_execution': 'orchestration',
      'publication': 'publication'
    };
    
    return eventCategories[eventType] || 'general';
  }
  
  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      enabled: this.config.enabled,
      running: this.state.isRunning,
      integrations: Object.fromEntries(this.state.integrations),
      health_checks: Array.from(this.state.healthChecks.values()).map(hc => ({
        name: hc.name,
        status: hc.status,
        last_run: hc.lastRun
      })),
      correlations: this.state.correlationMap.size
    };
  }
}

// Create global observability integration instance
const observabilityIntegration = new ObservabilityIntegration();

/**
 * Console interface for observability integration
 */
const observabilityCLI = {
  /**
   * Start observability integration
   */
  async start() {
    await observabilityIntegration.start();
  },
  
  /**
   * Stop observability integration
   */
  async stop() {
    await observabilityIntegration.stop();
  },
  
  /**
   * Show integration status
   */
  status() {
    const status = observabilityIntegration.getIntegrationStatus();
    
    console.log('\n🔍 Observability Integration Status:');
    console.log('═'.repeat(50));
    console.log(`Enabled: ${status.enabled ? '✅' : '❌'}`);
    console.log(`Running: ${status.running ? '✅' : '❌'}`);
    console.log(`Integrations: ${Object.keys(status.integrations).length}`);
    console.log(`Health Checks: ${status.health_checks.length}`);
    console.log(`Active Correlations: ${status.correlations}`);
    
    console.log('\nIntegrations:');
    for (const [name, integration] of Object.entries(status.integrations)) {
      console.log(`  ${name}: ${integration.status} (${integration.type})`);
    }
    
    console.log('\nHealth Checks:');
    for (const healthCheck of status.health_checks) {
      const statusIcon = healthCheck.status === 'healthy' ? '🟢' :
                        healthCheck.status === 'warning' ? '🟡' : '🔴';
      console.log(`  ${statusIcon} ${healthCheck.name}: ${healthCheck.status}`);
    }
  }
};

module.exports = {
  ObservabilityIntegration,
  observabilityIntegration,
  observabilityCLI
};