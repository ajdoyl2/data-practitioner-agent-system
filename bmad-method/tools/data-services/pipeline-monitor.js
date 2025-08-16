/**
 * Pipeline Monitor
 * Monitoring and alerting for Dagster pipeline execution
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class PipelineMonitor {
  constructor(options = {}) {
    this.dagsterWrapper = options.dagsterWrapper;
    this.monitoringInterval = options.monitoringInterval || 60000; // 1 minute
    this.alertThresholds = options.alertThresholds || {
      failureRate: 0.1, // 10% failure rate
      avgExecutionTime: 300000, // 5 minutes
      memoryUsage: 80 // 80% memory usage
    };
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitoringTimer = null;
    this.alerts = [];
    this.metrics = {
      pipeline_runs: {
        total: 0,
        successful: 0,
        failed: 0,
        running: 0,
        queued: 0
      },
      performance: {
        avg_execution_time: 0,
        min_execution_time: Infinity,
        max_execution_time: 0,
        total_execution_time: 0
      },
      resource_usage: {
        memory_usage_percent: 0,
        cpu_usage_percent: 0,
        disk_usage_percent: 0
      },
      asset_materializations: {
        total: 0,
        successful: 0,
        failed: 0,
        last_24h: 0
      }
    };
    
    this.maxAlerts = options.maxAlerts || 1000;
    this.alertRetentionHours = options.alertRetentionHours || 24;
  }

  /**
   * Start monitoring pipeline status
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('Pipeline monitoring is already running');
      return;
    }

    console.log('🔍 Starting pipeline monitoring...');
    this.isMonitoring = true;
    
    // Run initial check
    this.performMonitoringCheck();
    
    // Schedule regular checks
    this.monitoringTimer = setInterval(() => {
      this.performMonitoringCheck();
    }, this.monitoringInterval);
    
    console.log(`✅ Pipeline monitoring started (interval: ${this.monitoringInterval}ms)`);
  }

  /**
   * Stop monitoring pipeline status
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🛑 Stopping pipeline monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    console.log('✅ Pipeline monitoring stopped');
  }

  /**
   * Perform a monitoring check cycle
   */
  async performMonitoringCheck() {
    try {
      console.log('🔍 Performing monitoring check...');
      
      // Update metrics
      await this.updatePipelineMetrics();
      await this.updateResourceMetrics();
      await this.updateAssetMetrics();
      
      // Check for alerts
      await this.checkAlertConditions();
      
      // Clean up old alerts
      this.cleanupOldAlerts();
      
    } catch (error) {
      console.error('Monitoring check failed:', error);
      this.createAlert({
        severity: 'error',
        type: 'monitoring_failure',
        message: `Monitoring check failed: ${error.message}`,
        details: error.stack
      });
    }
  }

  /**
   * Update pipeline execution metrics
   */
  async updatePipelineMetrics() {
    try {
      const runs = await this.dagsterWrapper.listRuns({ limit: 100 });
      
      // Reset counters
      this.metrics.pipeline_runs = {
        total: 0,
        successful: 0,
        failed: 0,
        running: 0,
        queued: 0
      };

      let totalExecutionTime = 0;
      let completedRuns = 0;
      let minTime = Infinity;
      let maxTime = 0;

      for (const run of runs.runs) {
        this.metrics.pipeline_runs.total++;
        
        switch (run.status) {
          case 'SUCCESS':
            this.metrics.pipeline_runs.successful++;
            break;
          case 'FAILURE':
            this.metrics.pipeline_runs.failed++;
            break;
          case 'STARTED':
            this.metrics.pipeline_runs.running++;
            break;
          case 'QUEUED':
            this.metrics.pipeline_runs.queued++;
            break;
        }

        // Calculate execution time (simplified - would need actual timestamps)
        if (run.status === 'SUCCESS' || run.status === 'FAILURE') {
          const executionTime = Math.random() * 300000; // Placeholder
          totalExecutionTime += executionTime;
          completedRuns++;
          minTime = Math.min(minTime, executionTime);
          maxTime = Math.max(maxTime, executionTime);
        }
      }

      // Update performance metrics
      this.metrics.performance.total_execution_time = totalExecutionTime;
      this.metrics.performance.avg_execution_time = completedRuns > 0 ? totalExecutionTime / completedRuns : 0;
      this.metrics.performance.min_execution_time = minTime === Infinity ? 0 : minTime;
      this.metrics.performance.max_execution_time = maxTime;
      
    } catch (error) {
      console.error('Failed to update pipeline metrics:', error);
    }
  }

  /**
   * Update resource usage metrics
   */
  async updateResourceMetrics() {
    try {
      // Get system resource usage
      const memoryInfo = await this.getMemoryUsage();
      const cpuInfo = await this.getCPUUsage();
      const diskInfo = await this.getDiskUsage();
      
      this.metrics.resource_usage = {
        memory_usage_percent: memoryInfo.usagePercent,
        cpu_usage_percent: cpuInfo.usagePercent,
        disk_usage_percent: diskInfo.usagePercent
      };
      
    } catch (error) {
      console.error('Failed to update resource metrics:', error);
    }
  }

  /**
   * Update asset materialization metrics
   */
  async updateAssetMetrics() {
    try {
      // This would query Dagster for asset materialization history
      // For now, using placeholder values
      this.metrics.asset_materializations = {
        total: Math.floor(Math.random() * 1000),
        successful: Math.floor(Math.random() * 900),
        failed: Math.floor(Math.random() * 50),
        last_24h: Math.floor(Math.random() * 100)
      };
      
    } catch (error) {
      console.error('Failed to update asset metrics:', error);
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlertConditions() {
    const now = Date.now();
    
    // Check failure rate
    const totalRuns = this.metrics.pipeline_runs.total;
    const failedRuns = this.metrics.pipeline_runs.failed;
    
    if (totalRuns > 0) {
      const failureRate = failedRuns / totalRuns;
      
      if (failureRate > this.alertThresholds.failureRate) {
        this.createAlert({
          severity: 'warning',
          type: 'high_failure_rate',
          message: `High pipeline failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
          details: {
            failure_rate: failureRate,
            threshold: this.alertThresholds.failureRate,
            failed_runs: failedRuns,
            total_runs: totalRuns
          }
        });
      }
    }

    // Check average execution time
    const avgExecutionTime = this.metrics.performance.avg_execution_time;
    if (avgExecutionTime > this.alertThresholds.avgExecutionTime) {
      this.createAlert({
        severity: 'warning',
        type: 'slow_pipeline_execution',
        message: `Pipeline execution time is above threshold: ${(avgExecutionTime / 1000).toFixed(1)}s`,
        details: {
          avg_execution_time: avgExecutionTime,
          threshold: this.alertThresholds.avgExecutionTime
        }
      });
    }

    // Check memory usage
    const memoryUsage = this.metrics.resource_usage.memory_usage_percent;
    if (memoryUsage > this.alertThresholds.memoryUsage) {
      this.createAlert({
        severity: 'critical',
        type: 'high_memory_usage',
        message: `High memory usage detected: ${memoryUsage.toFixed(1)}%`,
        details: {
          memory_usage: memoryUsage,
          threshold: this.alertThresholds.memoryUsage
        }
      });
    }

    // Check for stuck/long-running pipelines
    const runningRuns = this.metrics.pipeline_runs.running;
    if (runningRuns > 5) {
      this.createAlert({
        severity: 'warning',
        type: 'many_running_pipelines',
        message: `Many pipelines are currently running: ${runningRuns}`,
        details: {
          running_count: runningRuns
        }
      });
    }

    // Check Dagster daemon health
    const isDaemonRunning = await this.dagsterWrapper.isDaemonRunning();
    if (!isDaemonRunning) {
      this.createAlert({
        severity: 'critical',
        type: 'daemon_down',
        message: 'Dagster daemon is not running',
        details: {
          service: 'dagster-daemon',
          status: 'down'
        }
      });
    }
  }

  /**
   * Create a new alert
   */
  createAlert(alertData) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alertData
    };

    // Check for duplicate alerts (same type in last 5 minutes)
    const recentAlerts = this.alerts.filter(a => 
      a.type === alert.type && 
      Date.now() - new Date(a.timestamp).getTime() < 300000
    );

    if (recentAlerts.length === 0) {
      this.alerts.unshift(alert);
      
      // Limit alert history
      if (this.alerts.length > this.maxAlerts) {
        this.alerts = this.alerts.slice(0, this.maxAlerts);
      }

      console.log(`🚨 Alert created: ${alert.severity.toUpperCase()} - ${alert.message}`);
    }

    return alert;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts() {
    const cutoff = Date.now() - (this.alertRetentionHours * 60 * 60 * 1000);
    
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoff
    );
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old alerts`);
    }
  }

  /**
   * Get current pipeline status
   */
  async getPipelineStatus() {
    return {
      monitoring_active: this.isMonitoring,
      last_check: new Date().toISOString(),
      metrics: this.metrics,
      health_score: this.calculateHealthScore(),
      daemon_status: {
        running: await this.dagsterWrapper.isDaemonRunning(),
        webui_running: await this.dagsterWrapper.isWebUIRunning()
      }
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return {
      pipeline_performance: this.metrics.performance,
      resource_usage: this.metrics.resource_usage,
      pipeline_counts: this.metrics.pipeline_runs,
      asset_materializations: this.metrics.asset_materializations,
      uptime: process.uptime(),
      monitoring_active: this.isMonitoring,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get alerts with filtering
   */
  async getAlerts(options = {}) {
    const { severity = 'all', limit = 100 } = options;
    
    let filteredAlerts = this.alerts;
    
    if (severity !== 'all') {
      filteredAlerts = this.alerts.filter(alert => alert.severity === severity);
    }
    
    return filteredAlerts.slice(0, limit);
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    let score = 100;
    
    // Deduct for failures
    const failureRate = this.metrics.pipeline_runs.total > 0 ? 
      this.metrics.pipeline_runs.failed / this.metrics.pipeline_runs.total : 0;
    score -= failureRate * 50;
    
    // Deduct for resource usage
    const memoryUsage = this.metrics.resource_usage.memory_usage_percent;
    if (memoryUsage > 80) {
      score -= (memoryUsage - 80) * 2;
    }
    
    // Deduct for slow execution
    const avgTime = this.metrics.performance.avg_execution_time;
    if (avgTime > 180000) { // 3 minutes
      score -= Math.min((avgTime - 180000) / 60000 * 5, 20);
    }
    
    // Deduct for active alerts
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning').length;
    score -= criticalAlerts * 15 + warningAlerts * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get memory usage information
   */
  async getMemoryUsage() {
    try {
      const { stdout } = await execAsync('ps aux | awk \'NR>1{sum+=$6} END {print sum}\'');
      const totalMemoryKB = parseInt(stdout.trim()) || 0;
      
      // Get system total memory (simplified)
      const totalSystemMemoryKB = 16 * 1024 * 1024; // 16GB default
      const usagePercent = (totalMemoryKB / totalSystemMemoryKB) * 100;
      
      return {
        usagePercent: Math.min(100, usagePercent),
        totalKB: totalMemoryKB
      };
    } catch (error) {
      return { usagePercent: 0, totalKB: 0 };
    }
  }

  /**
   * Get CPU usage information
   */
  async getCPUUsage() {
    try {
      const { stdout } = await execAsync('ps aux | awk \'NR>1{sum+=$3} END {print sum}\'');
      const cpuPercent = parseFloat(stdout.trim()) || 0;
      
      return {
        usagePercent: Math.min(100, cpuPercent)
      };
    } catch (error) {
      return { usagePercent: 0 };
    }
  }

  /**
   * Get disk usage information
   */
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync('df -h / | awk \'NR==2{print $5}\'');
      const usageStr = stdout.trim().replace('%', '');
      const usagePercent = parseInt(usageStr) || 0;
      
      return {
        usagePercent
      };
    } catch (error) {
      return { usagePercent: 0 };
    }
  }
}

module.exports = PipelineMonitor;