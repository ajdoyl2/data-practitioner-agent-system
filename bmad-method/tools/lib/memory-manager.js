/**
 * Memory Manager
 * Monitors and manages memory usage for analytical operations
 */

const { securityLogger } = require('./security-logger');

class MemoryManager {
  constructor(options = {}) {
    this.maxMemoryUsage = this.parseMemoryLimit(options.maxMemoryUsage || '4GB');
    this.warningThreshold = options.warningThreshold || 0.8; // 80%
    this.criticalThreshold = options.criticalThreshold || 0.95; // 95%
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
    
    // Memory usage tracking
    this.memoryHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this.alerts = new Set();
    
    // Start monitoring if enabled
    if (options.enableMonitoring !== false) {
      this.startMonitoring();
    }
  }

  /**
   * Parse memory limit string to bytes
   * @param {string} limit - Memory limit (e.g., '4GB', '512MB')
   * @returns {number} Bytes
   */
  parseMemoryLimit(limit) {
    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    const match = limit.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return Math.floor(value * units[unit]);
  }

  /**
   * Get current memory usage
   * @returns {Promise<Object>} Memory usage information
   */
  async getCurrentUsage() {
    const memUsage = process.memoryUsage();
    
    const usage = {
      rss: memUsage.rss, // Resident Set Size
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0,
      timestamp: new Date().toISOString()
    };

    // Calculate percentages
    usage.heapUtilization = usage.heapUsed / usage.heapTotal;
    usage.rssUtilization = usage.rss / this.maxMemoryUsage;

    // Add to history
    this.addToHistory(usage);

    // Check for alerts
    this.checkMemoryAlerts(usage);

    return usage;
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    const current = this.memoryHistory[this.memoryHistory.length - 1];
    
    if (!current) {
      return { status: 'no_data' };
    }

    const stats = {
      current: {
        rss_mb: Math.round(current.rss / 1024 / 1024),
        heap_used_mb: Math.round(current.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(current.heapTotal / 1024 / 1024),
        utilization: current.rssUtilization
      },
      limits: {
        max_memory_mb: Math.round(this.maxMemoryUsage / 1024 / 1024),
        warning_threshold: this.warningThreshold,
        critical_threshold: this.criticalThreshold
      },
      history: {
        samples: this.memoryHistory.length,
        time_span_minutes: this.getHistoryTimeSpan()
      },
      alerts: {
        active: Array.from(this.alerts),
        count: this.alerts.size
      }
    };

    // Calculate trends if we have enough history
    if (this.memoryHistory.length >= 2) {
      stats.trends = this.calculateTrends();
    }

    return stats;
  }

  /**
   * Add memory usage to history
   * @param {Object} usage - Memory usage data
   */
  addToHistory(usage) {
    this.memoryHistory.push(usage);
    
    // Maintain history length limit
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Check for memory alerts
   * @param {Object} usage - Current memory usage
   */
  checkMemoryAlerts(usage) {
    const rssUtilization = usage.rssUtilization;
    const heapUtilization = usage.heapUtilization;

    // Critical memory alert
    if (rssUtilization >= this.criticalThreshold) {
      const alertKey = 'critical_rss';
      if (!this.alerts.has(alertKey)) {
        this.alerts.add(alertKey);
        this.logMemoryAlert('critical', 'RSS', rssUtilization, usage);
      }
    } else {
      this.alerts.delete('critical_rss');
    }

    // Warning memory alert
    if (rssUtilization >= this.warningThreshold) {
      const alertKey = 'warning_rss';
      if (!this.alerts.has(alertKey)) {
        this.alerts.add(alertKey);
        this.logMemoryAlert('warning', 'RSS', rssUtilization, usage);
      }
    } else {
      this.alerts.delete('warning_rss');
    }

    // Heap critical alert
    if (heapUtilization >= this.criticalThreshold) {
      const alertKey = 'critical_heap';
      if (!this.alerts.has(alertKey)) {
        this.alerts.add(alertKey);
        this.logMemoryAlert('critical', 'Heap', heapUtilization, usage);
      }
    } else {
      this.alerts.delete('critical_heap');
    }
  }

  /**
   * Log memory alert
   * @param {string} level - Alert level
   * @param {string} type - Memory type
   * @param {number} utilization - Memory utilization percentage
   * @param {Object} usage - Full usage data
   */
  logMemoryAlert(level, type, utilization, usage) {
    const alert = {
      level,
      type,
      utilization: Math.round(utilization * 100),
      memory_mb: Math.round(usage.rss / 1024 / 1024),
      threshold: level === 'critical' ? this.criticalThreshold : this.warningThreshold,
      timestamp: new Date().toISOString()
    };

    securityLogger.logMemoryAlert(alert);

    // Console warning for immediate visibility
    const emoji = level === 'critical' ? '🚨' : '⚠️';
    console.warn(
      `${emoji} Memory ${level}: ${type} usage at ${alert.utilization}% ` +
      `(${alert.memory_mb}MB of ${Math.round(this.maxMemoryUsage / 1024 / 1024)}MB limit)`
    );
  }

  /**
   * Calculate memory usage trends
   * @returns {Object} Trend information
   */
  calculateTrends() {
    if (this.memoryHistory.length < 2) {
      return null;
    }

    const recent = this.memoryHistory.slice(-10); // Last 10 samples
    const rssValues = recent.map(h => h.rss);
    const heapValues = recent.map(h => h.heapUsed);

    return {
      rss_trend: this.calculateTrend(rssValues),
      heap_trend: this.calculateTrend(heapValues),
      sample_count: recent.length
    };
  }

  /**
   * Calculate trend for a series of values
   * @param {Array<number>} values - Values to analyze
   * @returns {string} Trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Get time span of memory history
   * @returns {number} Time span in minutes
   */
  getHistoryTimeSpan() {
    if (this.memoryHistory.length < 2) return 0;

    const first = new Date(this.memoryHistory[0].timestamp);
    const last = new Date(this.memoryHistory[this.memoryHistory.length - 1].timestamp);
    
    return Math.round((last - first) / 1000 / 60);
  }

  /**
   * Check if memory usage is safe for new operations
   * @param {number} estimatedUsage - Estimated additional memory usage in bytes
   * @returns {Object} Safety check result
   */
  async checkMemorySafety(estimatedUsage = 0) {
    const current = await this.getCurrentUsage();
    const projected = current.rss + estimatedUsage;
    const projectedUtilization = projected / this.maxMemoryUsage;

    const result = {
      safe: projectedUtilization < this.warningThreshold,
      current_utilization: current.rssUtilization,
      projected_utilization: projectedUtilization,
      estimated_usage_mb: Math.round(estimatedUsage / 1024 / 1024),
      recommendation: null
    };

    if (projectedUtilization >= this.criticalThreshold) {
      result.recommendation = 'abort';
      result.reason = 'Operation would exceed critical memory threshold';
    } else if (projectedUtilization >= this.warningThreshold) {
      result.recommendation = 'caution';
      result.reason = 'Operation would exceed warning threshold';
    } else {
      result.recommendation = 'proceed';
    }

    return result;
  }

  /**
   * Force garbage collection if available
   * @returns {Object} GC result
   */
  forceGarbageCollection() {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();
      
      const freed = before.heapUsed - after.heapUsed;
      
      securityLogger.logMemoryGC({
        freed_bytes: freed,
        freed_mb: Math.round(freed / 1024 / 1024),
        before_mb: Math.round(before.heapUsed / 1024 / 1024),
        after_mb: Math.round(after.heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        freed_mb: Math.round(freed / 1024 / 1024),
        before_heap_mb: Math.round(before.heapUsed / 1024 / 1024),
        after_heap_mb: Math.round(after.heapUsed / 1024 / 1024)
      };
    } else {
      return {
        success: false,
        reason: 'Garbage collection not exposed (run with --expose-gc)'
      };
    }
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringTimer = setInterval(async () => {
      try {
        await this.getCurrentUsage();
      } catch (error) {
        console.error('Memory monitoring error:', error);
      }
    }, this.monitoringInterval);

    console.log(`📊 Memory monitoring started (interval: ${this.monitoringInterval}ms)`);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('📊 Memory monitoring stopped');
    }
  }

  /**
   * Reset memory history and alerts
   */
  reset() {
    this.memoryHistory = [];
    this.alerts.clear();
  }
}

module.exports = MemoryManager;