/**
 * DuckDB Resource Monitor
 * Real-time monitoring and alerting for DuckDB memory and performance
 */

const os = require('os');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const { securityLogger } = require('../lib/security-logger');
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class DuckDBResourceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.duckdb = options.duckdb;
    this.config = {
      // Memory thresholds (percentage of configured memory limit)
      memoryWarningThreshold: options.memoryWarningThreshold || 75,
      memoryCriticalThreshold: options.memoryCriticalThreshold || 90,
      memoryEmergencyThreshold: options.memoryEmergencyThreshold || 95,
      
      // Performance thresholds
      queryTimeoutWarning: options.queryTimeoutWarning || 10000, // 10 seconds
      queryTimeoutCritical: options.queryTimeoutCritical || 30000, // 30 seconds
      
      // System resource thresholds
      systemMemoryThreshold: options.systemMemoryThreshold || 85,
      cpuUsageThreshold: options.cpuUsageThreshold || 80,
      
      // Monitoring intervals
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      alertingCooldown: options.alertingCooldown || 300000, // 5 minutes
      
      // Cleanup thresholds
      automaticCleanupThreshold: options.automaticCleanupThreshold || 80,
      cleanupInterval: options.cleanupInterval || 600000, // 10 minutes
    };
    
    this.monitoring = {
      isActive: false,
      lastAlert: new Map(),
      monitoringTimer: null,
      cleanupTimer: null,
      metrics: {
        memory: [],
        queries: [],
        system: []
      }
    };
    
    this.alertHandlers = new Map();
    this.setupDefaultAlertHandlers();
  }

  /**
   * Start resource monitoring
   */
  async startMonitoring() {
    if (this.monitoring.isActive) {
      console.log('Resource monitoring already active');
      return;
    }

    if (!isFeatureEnabled('duckdb_monitoring')) {
      console.log('DuckDB monitoring is disabled via feature flag');
      return;
    }

    console.log('Starting DuckDB resource monitoring...');
    
    this.monitoring.isActive = true;
    
    // Start periodic monitoring
    this.monitoring.monitoringTimer = setInterval(
      () => this.performMonitoringCheck(),
      this.config.monitoringInterval
    );
    
    // Start periodic cleanup
    this.monitoring.cleanupTimer = setInterval(
      () => this.performAutomaticCleanup(),
      this.config.cleanupInterval
    );
    
    // Initial monitoring check
    await this.performMonitoringCheck();
    
    securityLogger.logDuckDBOperation({
      operation: 'monitoring_started',
      config: this.config,
      timestamp: new Date().toISOString()
    });
    
    this.emit('monitoring:started', { config: this.config });
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring() {
    if (!this.monitoring.isActive) {
      return;
    }

    console.log('Stopping DuckDB resource monitoring...');
    
    this.monitoring.isActive = false;
    
    if (this.monitoring.monitoringTimer) {
      clearInterval(this.monitoring.monitoringTimer);
      this.monitoring.monitoringTimer = null;
    }
    
    if (this.monitoring.cleanupTimer) {
      clearInterval(this.monitoring.cleanupTimer);
      this.monitoring.cleanupTimer = null;
    }
    
    securityLogger.logDuckDBOperation({
      operation: 'monitoring_stopped',
      timestamp: new Date().toISOString()
    });
    
    this.emit('monitoring:stopped');
  }

  /**
   * Perform monitoring check
   */
  async performMonitoringCheck() {
    try {
      const metrics = await this.collectMetrics();
      
      // Store metrics history (keep last 100 measurements)
      this.monitoring.metrics.memory.push(metrics.memory);
      this.monitoring.metrics.queries.push(metrics.queries);
      this.monitoring.metrics.system.push(metrics.system);
      
      // Trim history
      ['memory', 'queries', 'system'].forEach(type => {
        if (this.monitoring.metrics[type].length > 100) {
          this.monitoring.metrics[type].shift();
        }
      });
      
      // Check thresholds and trigger alerts
      await this.checkThresholds(metrics);
      
      this.emit('monitoring:check', metrics);
      
    } catch (error) {
      console.error('Monitoring check failed:', error);
      this.emit('monitoring:error', error);
    }
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    const timestamp = new Date().toISOString();
    const systemMetrics = this.getSystemMetrics();
    
    let duckdbMetrics = {
      memoryUsage: 0,
      memoryPercent: 0,
      activeQueries: 0,
      connectionCount: 0,
      error: null
    };
    
    // Get DuckDB-specific metrics if available
    if (this.duckdb && this.duckdb.isInitialized) {
      try {
        const stats = await this.duckdb.getStats();
        duckdbMetrics = {
          memoryUsage: stats.memory_usage || 0,
          memoryPercent: this.calculateMemoryPercent(),
          activeQueries: stats.active_queries || 0,
          connectionCount: this.duckdb.getActiveConnections(),
          error: null
        };
      } catch (error) {
        duckdbMetrics.error = error.message;
      }
    }
    
    return {
      timestamp,
      memory: {
        duckdb_memory_usage_bytes: duckdbMetrics.memoryUsage,
        duckdb_memory_percent: duckdbMetrics.memoryPercent,
        system_memory_usage_bytes: systemMetrics.memoryUsage,
        system_memory_percent: systemMetrics.memoryPercent,
        memory_limit_bytes: this.parseMemoryLimit(this.duckdb?.memoryLimit || '4GB')
      },
      queries: {
        active_queries: duckdbMetrics.activeQueries,
        active_connections: duckdbMetrics.connectionCount,
        avg_query_time_ms: this.calculateAverageQueryTime()
      },
      system: {
        cpu_usage_percent: systemMetrics.cpuUsage,
        load_average: systemMetrics.loadAverage,
        free_memory_bytes: systemMetrics.freeMemory,
        uptime_seconds: systemMetrics.uptime
      },
      errors: {
        duckdb_error: duckdbMetrics.error
      }
    };
  }

  /**
   * Get system-level metrics
   */
  getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      memoryUsage: usedMem,
      memoryPercent: (usedMem / totalMem) * 100,
      freeMemory: freeMem,
      totalMemory: totalMem,
      cpuUsage: this.getCPUUsage(),
      loadAverage: os.loadavg()[0], // 1-minute load average
      uptime: os.uptime()
    };
  }

  /**
   * Calculate DuckDB memory usage percentage
   */
  calculateMemoryPercent() {
    if (!this.duckdb?.memoryLimit) return 0;
    
    const memoryLimitBytes = this.parseMemoryLimit(this.duckdb.memoryLimit);
    const processMemory = process.memoryUsage().heapUsed;
    
    return (processMemory / memoryLimitBytes) * 100;
  }

  /**
   * Parse memory limit string to bytes
   */
  parseMemoryLimit(memoryLimit) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    const match = memoryLimit.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) return 4 * 1024 * 1024 * 1024; // Default 4GB
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return value * (units[unit] || 1);
  }

  /**
   * Get CPU usage (simplified)
   */
  getCPUUsage() {
    const loadAvg = os.loadavg()[0];
    const numCPUs = os.cpus().length;
    return Math.min((loadAvg / numCPUs) * 100, 100);
  }

  /**
   * Calculate average query time from recent metrics
   */
  calculateAverageQueryTime() {
    // This is a simplified implementation
    // In a real scenario, you'd track actual query times
    return 0;
  }

  /**
   * Check thresholds and trigger alerts
   */
  async checkThresholds(metrics) {
    const checks = [
      {
        name: 'duckdb_memory_warning',
        condition: metrics.memory.duckdb_memory_percent > this.config.memoryWarningThreshold,
        level: 'warning',
        message: `DuckDB memory usage at ${metrics.memory.duckdb_memory_percent.toFixed(1)}%`
      },
      {
        name: 'duckdb_memory_critical',
        condition: metrics.memory.duckdb_memory_percent > this.config.memoryCriticalThreshold,
        level: 'critical',
        message: `DuckDB memory usage critical at ${metrics.memory.duckdb_memory_percent.toFixed(1)}%`
      },
      {
        name: 'duckdb_memory_emergency',
        condition: metrics.memory.duckdb_memory_percent > this.config.memoryEmergencyThreshold,
        level: 'emergency',
        message: `DuckDB memory usage emergency at ${metrics.memory.duckdb_memory_percent.toFixed(1)}%`
      },
      {
        name: 'system_memory_high',
        condition: metrics.system.free_memory_bytes < (os.totalmem() * 0.1), // Less than 10% free
        level: 'warning',
        message: `System memory low: ${(metrics.system.free_memory_bytes / 1024 / 1024 / 1024).toFixed(1)}GB free`
      },
      {
        name: 'cpu_usage_high',
        condition: metrics.system.cpu_usage_percent > this.config.cpuUsageThreshold,
        level: 'warning',
        message: `High CPU usage: ${metrics.system.cpu_usage_percent.toFixed(1)}%`
      },
      {
        name: 'too_many_connections',
        condition: metrics.queries.active_connections > (this.duckdb?.maxConnections || 10) * 0.8,
        level: 'warning',
        message: `High connection count: ${metrics.queries.active_connections}`
      }
    ];
    
    for (const check of checks) {
      if (check.condition) {
        await this.triggerAlert(check.name, check.level, check.message, metrics);
      }
    }
  }

  /**
   * Trigger alert with cooldown
   */
  async triggerAlert(alertName, level, message, metrics) {
    const now = Date.now();
    const lastAlert = this.monitoring.lastAlert.get(alertName) || 0;
    
    // Check cooldown period
    if (now - lastAlert < this.config.alertingCooldown) {
      return;
    }
    
    this.monitoring.lastAlert.set(alertName, now);
    
    const alert = {
      name: alertName,
      level,
      message,
      timestamp: new Date().toISOString(),
      metrics
    };
    
    // Log alert
    securityLogger.logDuckDBOperation({
      operation: 'resource_alert',
      alert_name: alertName,
      alert_level: level,
      message,
      metrics: {
        memory_percent: metrics.memory.duckdb_memory_percent,
        system_memory_percent: metrics.memory.system_memory_percent,
        active_queries: metrics.queries.active_queries,
        cpu_usage: metrics.system.cpu_usage_percent
      },
      timestamp: alert.timestamp
    });
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Call registered alert handlers
    const handler = this.alertHandlers.get(alertName) || this.alertHandlers.get('default');
    if (handler) {
      try {
        await handler(alert);
      } catch (error) {
        console.error(`Alert handler failed for ${alertName}:`, error);
      }
    }
    
    // Trigger automatic remediation for certain alerts
    if (level === 'critical' || level === 'emergency') {
      await this.triggerAutomaticRemediation(alertName, alert);
    }
  }

  /**
   * Setup default alert handlers
   */
  setupDefaultAlertHandlers() {
    // Default console alert handler
    this.alertHandlers.set('default', async (alert) => {
      const emoji = {
        warning: '⚠️',
        critical: '🚨',
        emergency: '🔥'
      };
      
      console.log(`${emoji[alert.level] || '❗'} DuckDB Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    });
    
    // Memory emergency handler
    this.alertHandlers.set('duckdb_memory_emergency', async (alert) => {
      console.log('🔥 EMERGENCY: Triggering immediate memory cleanup');
      await this.performEmergencyCleanup();
    });
    
    // Memory critical handler  
    this.alertHandlers.set('duckdb_memory_critical', async (alert) => {
      console.log('🚨 CRITICAL: Triggering aggressive memory cleanup');
      await this.performAggressiveCleanup();
    });
  }

  /**
   * Register custom alert handler
   */
  registerAlertHandler(alertName, handler) {
    this.alertHandlers.set(alertName, handler);
  }

  /**
   * Trigger automatic remediation
   */
  async triggerAutomaticRemediation(alertName, alert) {
    console.log(`Triggering automatic remediation for ${alertName}`);
    
    try {
      switch (alertName) {
        case 'duckdb_memory_emergency':
          await this.performEmergencyCleanup();
          break;
          
        case 'duckdb_memory_critical':
          await this.performAggressiveCleanup();
          break;
          
        case 'system_memory_high':
          await this.performMemoryOptimization();
          break;
          
        default:
          console.log(`No specific remediation for ${alertName}`);
      }
    } catch (error) {
      console.error(`Remediation failed for ${alertName}:`, error);
    }
  }

  /**
   * Perform automatic cleanup when threshold reached
   */
  async performAutomaticCleanup() {
    if (!this.duckdb || !this.duckdb.isInitialized) {
      return;
    }
    
    const metrics = await this.collectMetrics();
    
    if (metrics.memory.duckdb_memory_percent > this.config.automaticCleanupThreshold) {
      console.log('Performing automatic DuckDB cleanup...');
      
      try {
        // Force checkpoint
        await this.duckdb.executeInternal('PRAGMA force_checkpoint;');
        
        // Clear cache
        await this.duckdb.executeInternal('PRAGMA clear_cache;');
        
        // Run Node.js garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        securityLogger.logDuckDBOperation({
          operation: 'automatic_cleanup',
          memory_before: metrics.memory.duckdb_memory_percent,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Automatic cleanup failed:', error);
      }
    }
  }

  /**
   * Perform aggressive cleanup
   */
  async performAggressiveCleanup() {
    console.log('Performing aggressive DuckDB cleanup...');
    
    try {
      if (this.duckdb && this.duckdb.isInitialized) {
        // Force checkpoint
        await this.duckdb.executeInternal('PRAGMA force_checkpoint;');
        
        // Clear all caches
        await this.duckdb.executeInternal('PRAGMA clear_cache;');
        
        // Drop temporary tables
        const tables = await this.duckdb.listTables();
        for (const table of tables) {
          if (table.startsWith('temp_') || table.startsWith('tmp_')) {
            await this.duckdb.execute(`DROP TABLE IF EXISTS ${table}`);
          }
        }
      }
      
      // Force garbage collection multiple times
      if (global.gc) {
        global.gc();
        setTimeout(() => global.gc(), 100);
        setTimeout(() => global.gc(), 500);
      }
      
    } catch (error) {
      console.error('Aggressive cleanup failed:', error);
    }
  }

  /**
   * Perform emergency cleanup
   */
  async performEmergencyCleanup() {
    console.log('🔥 Performing EMERGENCY DuckDB cleanup...');
    
    try {
      // Aggressive cleanup first
      await this.performAggressiveCleanup();
      
      // Reduce memory limit temporarily
      if (this.duckdb && this.duckdb.isInitialized) {
        const currentLimit = this.parseMemoryLimit(this.duckdb.memoryLimit);
        const reducedLimit = Math.floor(currentLimit * 0.7); // Reduce by 30%
        const reducedLimitGB = Math.floor(reducedLimit / (1024 * 1024 * 1024));
        
        await this.duckdb.executeInternal(`PRAGMA memory_limit='${reducedLimitGB}GB';`);
        
        console.log(`Temporarily reduced memory limit to ${reducedLimitGB}GB`);
      }
      
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Perform memory optimization
   */
  async performMemoryOptimization() {
    console.log('Performing system memory optimization...');
    
    try {
      // Force multiple garbage collections
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Clear any large objects from memory
      this.monitoring.metrics.memory = this.monitoring.metrics.memory.slice(-10);
      this.monitoring.metrics.queries = this.monitoring.metrics.queries.slice(-10);
      this.monitoring.metrics.system = this.monitoring.metrics.system.slice(-10);
      
    } catch (error) {
      console.error('Memory optimization failed:', error);
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus() {
    return {
      isActive: this.monitoring.isActive,
      config: this.config,
      metricsHistory: {
        memory: this.monitoring.metrics.memory.length,
        queries: this.monitoring.metrics.queries.length,
        system: this.monitoring.metrics.system.length
      },
      lastAlerts: Object.fromEntries(this.monitoring.lastAlert)
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    securityLogger.logDuckDBOperation({
      operation: 'config_updated',
      new_config: newConfig,
      timestamp: new Date().toISOString()
    });
    
    this.emit('config:updated', this.config);
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary() {
    const recentMetrics = {
      memory: this.monitoring.metrics.memory.slice(-10),
      queries: this.monitoring.metrics.queries.slice(-10),
      system: this.monitoring.metrics.system.slice(-10)
    };
    
    return {
      current: recentMetrics.memory[recentMetrics.memory.length - 1] || null,
      averages: {
        memory_percent: this.calculateAverage(recentMetrics.memory, 'duckdb_memory_percent'),
        active_queries: this.calculateAverage(recentMetrics.queries, 'active_queries'),
        cpu_usage: this.calculateAverage(recentMetrics.system, 'cpu_usage_percent')
      },
      trends: {
        memory_increasing: this.calculateTrend(recentMetrics.memory, 'duckdb_memory_percent'),
        queries_increasing: this.calculateTrend(recentMetrics.queries, 'active_queries')
      }
    };
  }

  /**
   * Calculate average of a metric
   */
  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((total, metric) => total + (metric[field] || 0), 0);
    return sum / metrics.length;
  }

  /**
   * Calculate trend of a metric (positive = increasing)
   */
  calculateTrend(metrics, field) {
    if (metrics.length < 2) return 0;
    
    const recent = metrics.slice(-3);
    if (recent.length < 2) return 0;
    
    const first = recent[0][field] || 0;
    const last = recent[recent.length - 1][field] || 0;
    
    return last - first;
  }
}

module.exports = DuckDBResourceMonitor;