/**
 * DuckDB Monitoring Dashboard
 * Real-time monitoring interface for DuckDB resource usage and performance
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const DuckDBResourceMonitor = require('./resource-monitor');
const { securityLogger } = require('../lib/security-logger');

class DuckDBMonitoringDashboard extends EventEmitter {
  constructor(duckdb, options = {}) {
    super();
    
    this.duckdb = duckdb;
    this.monitor = new DuckDBResourceMonitor({ duckdb });
    this.config = {
      updateInterval: options.updateInterval || 5000, // 5 seconds
      historyRetention: options.historyRetention || 1000, // Keep 1000 data points
      alertThresholds: options.alertThresholds || {
        memory: 85,
        cpu: 80,
        queryTime: 10000
      },
      dashboardPort: options.dashboardPort || 3001,
      enableWebDashboard: options.enableWebDashboard || false
    };
    
    this.state = {
      isRunning: false,
      updateTimer: null,
      metrics: {
        current: null,
        history: []
      },
      alerts: [],
      performance: {
        queries: [],
        operations: []
      }
    };
    
    this.setupMonitoringHandlers();
  }

  /**
   * Setup event handlers for monitoring
   */
  setupMonitoringHandlers() {
    this.monitor.on('alert', (alert) => {
      this.handleAlert(alert);
    });
    
    this.monitor.on('monitoring:check', (metrics) => {
      this.updateMetrics(metrics);
    });
    
    this.monitor.on('monitoring:error', (error) => {
      console.error('Monitoring error:', error);
      this.emit('dashboard:error', error);
    });
  }

  /**
   * Start the monitoring dashboard
   */
  async start() {
    if (this.state.isRunning) {
      console.log('Monitoring dashboard already running');
      return;
    }

    console.log('Starting DuckDB monitoring dashboard...');
    
    // Start the resource monitor
    await this.monitor.startMonitoring();
    
    // Start dashboard updates
    this.state.updateTimer = setInterval(
      () => this.updateDashboard(),
      this.config.updateInterval
    );
    
    this.state.isRunning = true;
    
    // Start web dashboard if enabled
    if (this.config.enableWebDashboard) {
      await this.startWebDashboard();
    }
    
    console.log(`✅ Monitoring dashboard started (update interval: ${this.config.updateInterval}ms)`);
    this.emit('dashboard:started');
  }

  /**
   * Stop the monitoring dashboard
   */
  async stop() {
    if (!this.state.isRunning) {
      return;
    }

    console.log('Stopping DuckDB monitoring dashboard...');
    
    this.state.isRunning = false;
    
    if (this.state.updateTimer) {
      clearInterval(this.state.updateTimer);
      this.state.updateTimer = null;
    }
    
    await this.monitor.stopMonitoring();
    
    if (this.webServer) {
      this.webServer.close();
    }
    
    console.log('✅ Monitoring dashboard stopped');
    this.emit('dashboard:stopped');
  }

  /**
   * Update dashboard with latest metrics
   */
  async updateDashboard() {
    try {
      const currentMetrics = await this.monitor.collectMetrics();
      this.updateMetrics(currentMetrics);
      
      // Check for performance issues
      await this.checkPerformanceIssues(currentMetrics);
      
      this.emit('dashboard:updated', {
        metrics: currentMetrics,
        alerts: this.state.alerts.slice(-10), // Last 10 alerts
        summary: this.generateSummary()
      });
      
    } catch (error) {
      console.error('Dashboard update failed:', error);
      this.emit('dashboard:error', error);
    }
  }

  /**
   * Update metrics and maintain history
   */
  updateMetrics(metrics) {
    this.state.metrics.current = metrics;
    this.state.metrics.history.push(metrics);
    
    // Trim history to maintain retention limit
    if (this.state.metrics.history.length > this.config.historyRetention) {
      this.state.metrics.history.shift();
    }
  }

  /**
   * Handle alerts from the monitor
   */
  handleAlert(alert) {
    console.log(`🚨 Alert: ${alert.level.toUpperCase()} - ${alert.message}`);
    
    // Add to alerts history
    this.state.alerts.push({
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Trim alerts history
    if (this.state.alerts.length > 100) {
      this.state.alerts.shift();
    }
    
    // Emit alert event
    this.emit('dashboard:alert', alert);
    
    // Log critical alerts
    if (alert.level === 'critical' || alert.level === 'emergency') {
      securityLogger.logDuckDBOperation({
        operation: 'dashboard_critical_alert',
        alert_name: alert.name,
        alert_level: alert.level,
        message: alert.message,
        timestamp: alert.timestamp
      });
    }
  }

  /**
   * Check for performance issues
   */
  async checkPerformanceIssues(metrics) {
    const issues = [];
    
    // Check memory usage
    if (metrics.memory.duckdb_memory_percent > this.config.alertThresholds.memory) {
      issues.push({
        type: 'memory_high',
        severity: 'warning',
        message: `High memory usage: ${metrics.memory.duckdb_memory_percent.toFixed(1)}%`,
        value: metrics.memory.duckdb_memory_percent,
        threshold: this.config.alertThresholds.memory
      });
    }
    
    // Check CPU usage
    if (metrics.system.cpu_usage_percent > this.config.alertThresholds.cpu) {
      issues.push({
        type: 'cpu_high',
        severity: 'warning',
        message: `High CPU usage: ${metrics.system.cpu_usage_percent.toFixed(1)}%`,
        value: metrics.system.cpu_usage_percent,
        threshold: this.config.alertThresholds.cpu
      });
    }
    
    // Check active queries
    if (metrics.queries.active_queries > 10) {
      issues.push({
        type: 'query_backlog',
        severity: 'info',
        message: `High query load: ${metrics.queries.active_queries} active queries`,
        value: metrics.queries.active_queries,
        threshold: 10
      });
    }
    
    // Store performance issues
    this.state.performance.issues = issues;
    
    if (issues.length > 0) {
      this.emit('dashboard:performance_issues', issues);
    }
  }

  /**
   * Generate dashboard summary
   */
  generateSummary() {
    const current = this.state.metrics.current;
    const history = this.state.metrics.history;
    
    if (!current || history.length < 2) {
      return { status: 'insufficient_data' };
    }
    
    // Calculate trends
    const recent = history.slice(-10);
    const memoryTrend = this.calculateTrend(recent, 'memory.duckdb_memory_percent');
    const cpuTrend = this.calculateTrend(recent, 'system.cpu_usage_percent');
    
    // Determine overall status
    let status = 'healthy';
    const criticalAlerts = this.state.alerts.filter(a => 
      a.level === 'critical' || a.level === 'emergency'
    ).filter(a => Date.now() - new Date(a.timestamp).getTime() < 300000); // Last 5 minutes
    
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (current.memory.duckdb_memory_percent > 85 || current.system.cpu_usage_percent > 80) {
      status = 'warning';
    }
    
    return {
      status,
      uptime: this.getUptimeSeconds(),
      memory: {
        current_percent: current.memory.duckdb_memory_percent,
        trend: memoryTrend > 0 ? 'increasing' : memoryTrend < 0 ? 'decreasing' : 'stable'
      },
      cpu: {
        current_percent: current.system.cpu_usage_percent,
        trend: cpuTrend > 0 ? 'increasing' : cpuTrend < 0 ? 'decreasing' : 'stable'
      },
      queries: {
        active: current.queries.active_queries,
        connections: current.queries.active_connections
      },
      alerts: {
        total: this.state.alerts.length,
        recent_critical: criticalAlerts.length
      }
    };
  }

  /**
   * Calculate trend for a metric
   */
  calculateTrend(dataPoints, metricPath) {
    if (dataPoints.length < 2) return 0;
    
    const getValue = (obj, path) => {
      return path.split('.').reduce((curr, prop) => curr && curr[prop], obj);
    };
    
    const values = dataPoints.map(point => getValue(point, metricPath)).filter(v => v != null);
    
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return last - first;
  }

  /**
   * Get dashboard uptime in seconds
   */
  getUptimeSeconds() {
    if (!this.state.isRunning || !this.startTime) {
      return 0;
    }
    
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get current dashboard state
   */
  getState() {
    return {
      isRunning: this.state.isRunning,
      metrics: this.state.metrics.current,
      recentAlerts: this.state.alerts.slice(-10),
      summary: this.generateSummary(),
      configuration: this.config
    };
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(minutes = 60) {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    
    return this.state.metrics.history.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get performance report
   */
  generatePerformanceReport() {
    const history = this.state.metrics.history;
    const alerts = this.state.alerts;
    
    if (history.length === 0) {
      return { error: 'No historical data available' };
    }
    
    const memoryMetrics = history.map(h => h.memory.duckdb_memory_percent).filter(v => v != null);
    const cpuMetrics = history.map(h => h.system.cpu_usage_percent).filter(v => v != null);
    
    return {
      timeRange: {
        start: history[0].timestamp,
        end: history[history.length - 1].timestamp,
        dataPoints: history.length
      },
      memory: {
        average: this.calculateAverage(memoryMetrics),
        min: Math.min(...memoryMetrics),
        max: Math.max(...memoryMetrics),
        current: memoryMetrics[memoryMetrics.length - 1]
      },
      cpu: {
        average: this.calculateAverage(cpuMetrics),
        min: Math.min(...cpuMetrics),
        max: Math.max(...cpuMetrics),
        current: cpuMetrics[cpuMetrics.length - 1]
      },
      alerts: {
        total: alerts.length,
        by_level: this.groupAlertsByLevel(alerts),
        recent: alerts.filter(a => 
          Date.now() - new Date(a.timestamp).getTime() < 3600000 // Last hour
        ).length
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculate average of array values
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Group alerts by severity level
   */
  groupAlertsByLevel(alerts) {
    return alerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const current = this.state.metrics.current;
    const recentAlerts = this.state.alerts.slice(-20);
    
    if (!current) return recommendations;
    
    // Memory recommendations
    if (current.memory.duckdb_memory_percent > 75) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        issue: 'High memory usage detected',
        suggestion: 'Consider reducing batch sizes or enabling memory spilling',
        action: 'Review memory configuration and optimize queries'
      });
    }
    
    // CPU recommendations
    if (current.system.cpu_usage_percent > 70) {
      recommendations.push({
        type: 'cpu',
        priority: 'medium',
        issue: 'High CPU usage detected',
        suggestion: 'Consider reducing concurrent operations or optimizing queries',
        action: 'Review query performance and reduce parallelism'
      });
    }
    
    // Alert frequency recommendations
    const recentMemoryAlerts = recentAlerts.filter(a => 
      a.name.includes('memory') && 
      Date.now() - new Date(a.timestamp).getTime() < 1800000 // Last 30 minutes
    );
    
    if (recentMemoryAlerts.length > 5) {
      recommendations.push({
        type: 'stability',
        priority: 'high',
        issue: 'Frequent memory alerts detected',
        suggestion: 'System may be under-provisioned for current workload',
        action: 'Consider increasing memory limits or reducing workload'
      });
    }
    
    return recommendations;
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filePath, format = 'json') {
    const data = {
      exportTime: new Date().toISOString(),
      configuration: this.config,
      summary: this.generateSummary(),
      metrics: this.state.metrics.history,
      alerts: this.state.alerts,
      performanceReport: this.generatePerformanceReport()
    };
    
    let content;
    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.convertToCsv(data.metrics);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Metrics exported to: ${filePath}`);
    
    return { filePath, format, recordCount: data.metrics.length };
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCsv(metrics) {
    if (metrics.length === 0) return '';
    
    const headers = [
      'timestamp',
      'duckdb_memory_percent',
      'system_memory_percent', 
      'cpu_usage_percent',
      'active_queries',
      'active_connections'
    ];
    
    const rows = metrics.map(metric => [
      metric.timestamp,
      metric.memory.duckdb_memory_percent,
      metric.memory.system_memory_percent,
      metric.system.cpu_usage_percent,
      metric.queries.active_queries,
      metric.queries.active_connections
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Start web dashboard (basic implementation)
   */
  async startWebDashboard() {
    if (!this.config.enableWebDashboard) return;
    
    try {
      const express = require('express');
      const app = express();
      
      // Serve static files
      app.use(express.static(path.join(__dirname, '../../../docs/monitoring')));
      
      // API endpoints
      app.get('/api/status', (req, res) => {
        res.json(this.getState());
      });
      
      app.get('/api/metrics', (req, res) => {
        const minutes = parseInt(req.query.minutes) || 60;
        res.json(this.getHistoricalMetrics(minutes));
      });
      
      app.get('/api/alerts', (req, res) => {
        res.json(this.state.alerts.slice(-50)); // Last 50 alerts
      });
      
      app.get('/api/report', (req, res) => {
        res.json(this.generatePerformanceReport());
      });
      
      this.webServer = app.listen(this.config.dashboardPort, () => {
        console.log(`📊 Web dashboard available at: http://localhost:${this.config.dashboardPort}`);
      });
      
    } catch (error) {
      console.warn('Failed to start web dashboard:', error.message);
    }
  }
}

module.exports = DuckDBMonitoringDashboard;