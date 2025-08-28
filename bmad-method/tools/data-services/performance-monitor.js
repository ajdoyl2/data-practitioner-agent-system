/**
 * Performance Monitor with SLA Tracking
 * Monitors system performance metrics and tracks SLA compliance
 * Integrates with metrics collector and monitoring dashboard
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { performance, system } = require('./monitoring-logger');
const { performanceMetrics, businessMetrics } = require('./metrics-collector');

// Load monitoring configuration
const configPath = path.join(__dirname, '../../config/quality-assurance/monitoring-config.yaml');
let monitoringConfig = {};

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  monitoringConfig = yaml.load(configContent);
} catch (error) {
  console.error('Failed to load monitoring config:', error.message);
  monitoringConfig = {};
}

/**
 * SLA Configuration
 */
const DEFAULT_SLAS = {
  // System Performance SLAs
  response_time: {
    target: 200,      // milliseconds
    threshold: 500,   // warning threshold
    critical: 1000,   // critical threshold
    measurement_window: '5m',
    description: 'API response time should be under 200ms'
  },
  
  throughput: {
    target: 100,      // requests per second
    threshold: 50,    // warning threshold
    critical: 25,     // critical threshold
    measurement_window: '5m',
    description: 'System should handle 100+ requests per second'
  },
  
  error_rate: {
    target: 0.01,     // 1%
    threshold: 0.05,  // 5% warning
    critical: 0.10,   // 10% critical
    measurement_window: '15m',
    description: 'Error rate should be below 1%'
  },
  
  availability: {
    target: 99.9,     // 99.9%
    threshold: 99.5,  // 99.5% warning
    critical: 99.0,   // 99% critical
    measurement_window: '1d',
    description: 'System availability should be 99.9%'
  },
  
  // Data Quality SLAs
  data_completeness: {
    target: 95,       // 95%
    threshold: 90,    // 90% warning
    critical: 80,     // 80% critical
    measurement_window: '1h',
    description: 'Data completeness should be above 95%'
  },
  
  data_freshness: {
    target: 15,       // 15 minutes
    threshold: 30,    // 30 minutes warning
    critical: 60,     // 60 minutes critical
    measurement_window: '1h',
    description: 'Data should be refreshed within 15 minutes'
  },
  
  // Pipeline Performance SLAs
  pipeline_success_rate: {
    target: 99.5,     // 99.5%
    threshold: 99.0,  // 99% warning
    critical: 95.0,   // 95% critical
    measurement_window: '1d',
    description: 'Pipeline success rate should be above 99.5%'
  },
  
  pipeline_execution_time: {
    target: 300,      // 5 minutes
    threshold: 600,   // 10 minutes warning
    critical: 1800,   // 30 minutes critical
    measurement_window: '1h',
    description: 'Pipeline execution should complete within 5 minutes'
  }
};

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.config = {
      slas: { ...DEFAULT_SLAS, ...options.slas },
      checkInterval: options.checkInterval || 60000, // 1 minute
      retentionDays: options.retentionDays || 30,
      alerting: options.alerting !== false, // Default true
      enabled: options.enabled !== false // Default true
    };
    
    this.state = {
      isRunning: false,
      checkTimer: null,
      metrics: new Map(),
      slaStatus: new Map(),
      violations: [],
      alerts: []
    };
    
    this.startTime = Date.now();
  }
  
  /**
   * Start performance monitoring
   */
  async start() {
    if (this.state.isRunning) {
      console.log('Performance monitor already running');
      return;
    }
    
    if (!this.config.enabled) {
      console.log('Performance monitoring is disabled');
      return;
    }
    
    console.log('🚀 Starting performance monitoring with SLA tracking...');
    
    await system.monitoringStarted({
      component: 'performance-monitor',
      sla_count: Object.keys(this.config.slas).length,
      check_interval: this.config.checkInterval
    });
    
    // Initialize SLA status
    this.initializeSLAStatus();
    
    // Start monitoring loop
    this.state.checkTimer = setInterval(
      () => this.performSLACheck(),
      this.config.checkInterval
    );
    
    this.state.isRunning = true;
    
    console.log(`✅ Performance monitoring started (${Object.keys(this.config.slas).length} SLAs tracked)`);
  }
  
  /**
   * Stop performance monitoring
   */
  async stop() {
    if (!this.state.isRunning) {
      return;
    }
    
    console.log('⏹️ Stopping performance monitoring...');
    
    if (this.state.checkTimer) {
      clearInterval(this.state.checkTimer);
      this.state.checkTimer = null;
    }
    
    await system.monitoringStopped({
      component: 'performance-monitor',
      total_checks: this.state.violations.length,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000)
    });
    
    this.state.isRunning = false;
    console.log('✅ Performance monitoring stopped');
  }
  
  /**
   * Initialize SLA status tracking
   */
  initializeSLAStatus() {
    for (const [slaName, slaConfig] of Object.entries(this.config.slas)) {
      this.state.slaStatus.set(slaName, {
        name: slaName,
        config: slaConfig,
        status: 'healthy',
        compliance: 100,
        lastCheck: null,
        violations: 0,
        consecutiveViolations: 0,
        totalMeasurements: 0,
        successfulMeasurements: 0
      });
    }
  }
  
  /**
   * Perform SLA compliance check
   */
  async performSLACheck() {
    try {
      console.log('🔍 Performing SLA compliance check...');
      
      for (const [slaName, slaConfig] of Object.entries(this.config.slas)) {
        await this.checkSLA(slaName, slaConfig);
      }
      
      // Generate compliance report
      const complianceReport = this.generateComplianceReport();
      await this.publishComplianceReport(complianceReport);
      
    } catch (error) {
      console.error('SLA check failed:', error.message);
      await performance.thresholdExceeded({
        metric: 'sla_check_error',
        error: error.message
      }, { component: 'performance-monitor' });
    }
  }
  
  /**
   * Check individual SLA compliance
   * @param {string} slaName - SLA name
   * @param {Object} slaConfig - SLA configuration
   */
  async checkSLA(slaName, slaConfig) {
    const status = this.state.slaStatus.get(slaName);
    const currentValue = await this.getMeasurement(slaName, slaConfig);
    
    if (currentValue === null) {
      // No data available for this SLA
      return;
    }
    
    status.totalMeasurements++;
    status.lastCheck = new Date().toISOString();
    
    // Determine compliance
    const isCompliant = this.evaluateCompliance(slaName, currentValue, slaConfig);
    
    if (isCompliant) {
      status.successfulMeasurements++;
      status.consecutiveViolations = 0;
      
      // Update status if recovering
      if (status.status !== 'healthy') {
        status.status = 'healthy';
        await this.handleSLARecovery(slaName, currentValue, slaConfig);
      }
    } else {
      status.consecutiveViolations++;
      
      // Determine violation severity
      const severity = this.getSeverityLevel(slaName, currentValue, slaConfig);
      const wasHealthy = status.status === 'healthy';
      
      status.status = severity;
      
      // Record violation
      const violation = {
        sla: slaName,
        timestamp: new Date().toISOString(),
        value: currentValue,
        target: slaConfig.target,
        threshold: slaConfig.threshold,
        critical: slaConfig.critical,
        severity: severity,
        consecutiveCount: status.consecutiveViolations
      };
      
      this.state.violations.push(violation);
      
      // Trim violations history
      if (this.state.violations.length > 1000) {
        this.state.violations.shift();
      }
      
      // Handle new violation
      if (wasHealthy) {
        await this.handleSLAViolation(violation);
      }
    }
    
    // Update compliance percentage
    status.compliance = status.totalMeasurements > 0 ? 
      (status.successfulMeasurements / status.totalMeasurements) * 100 : 100;
    
    // Record metrics
    await businessMetrics.recordSlaCompliance(status.compliance, {
      sla_name: slaName,
      current_value: currentValue,
      target: slaConfig.target
    });
  }
  
  /**
   * Get measurement value for SLA
   * @param {string} slaName - SLA name
   * @param {Object} slaConfig - SLA configuration
   * @returns {number|null} Measurement value
   */
  async getMeasurement(slaName, slaConfig) {
    // This is a simplified implementation
    // In a real system, you'd query your metrics store
    
    switch (slaName) {
      case 'response_time':
        // Simulate getting average response time from last 5 minutes
        return Math.random() * 1000; // 0-1000ms
        
      case 'throughput':
        // Simulate getting current throughput
        return Math.random() * 150; // 0-150 rps
        
      case 'error_rate':
        // Simulate getting error rate
        return Math.random() * 0.1; // 0-10%
        
      case 'availability':
        // Simulate getting availability percentage
        return 99.9 - (Math.random() * 2); // 97.9-99.9%
        
      case 'data_completeness':
        // Simulate data completeness
        return 85 + (Math.random() * 15); // 85-100%
        
      case 'data_freshness':
        // Simulate data age in minutes
        return Math.random() * 90; // 0-90 minutes
        
      case 'pipeline_success_rate':
        // Simulate pipeline success rate
        return 95 + (Math.random() * 5); // 95-100%
        
      case 'pipeline_execution_time':
        // Simulate pipeline execution time in seconds
        return Math.random() * 2400; // 0-40 minutes
        
      default:
        return null;
    }
  }
  
  /**
   * Evaluate if current value meets SLA
   * @param {string} slaName - SLA name
   * @param {number} currentValue - Current measurement
   * @param {Object} slaConfig - SLA configuration
   * @returns {boolean} True if compliant
   */
  evaluateCompliance(slaName, currentValue, slaConfig) {
    // For metrics where lower is better (response time, error rate, data freshness)
    const lowerIsBetter = ['response_time', 'error_rate', 'data_freshness', 'pipeline_execution_time'];
    
    if (lowerIsBetter.includes(slaName)) {
      return currentValue <= slaConfig.target;
    } else {
      // For metrics where higher is better (throughput, availability, completeness)
      return currentValue >= slaConfig.target;
    }
  }
  
  /**
   * Get severity level for violation
   * @param {string} slaName - SLA name
   * @param {number} currentValue - Current measurement
   * @param {Object} slaConfig - SLA configuration
   * @returns {string} Severity level
   */
  getSeverityLevel(slaName, currentValue, slaConfig) {
    const lowerIsBetter = ['response_time', 'error_rate', 'data_freshness', 'pipeline_execution_time'];
    
    if (lowerIsBetter.includes(slaName)) {
      if (currentValue >= slaConfig.critical) {
        return 'critical';
      } else if (currentValue >= slaConfig.threshold) {
        return 'warning';
      }
    } else {
      if (currentValue <= slaConfig.critical) {
        return 'critical';
      } else if (currentValue <= slaConfig.threshold) {
        return 'warning';
      }
    }
    
    return 'info';
  }
  
  /**
   * Handle SLA violation
   * @param {Object} violation - Violation details
   */
  async handleSLAViolation(violation) {
    console.log(`🚨 SLA Violation: ${violation.sla} - ${violation.severity.toUpperCase()}`);
    console.log(`   Value: ${violation.value}, Target: ${violation.target}`);
    
    if (this.config.alerting) {
      await performance.thresholdExceeded({
        metric: `sla_${violation.sla}`,
        value: violation.value,
        target: violation.target,
        severity: violation.severity,
        consecutive_violations: violation.consecutiveCount
      }, {
        component: 'performance-monitor',
        sla_name: violation.sla
      });
    }
  }
  
  /**
   * Handle SLA recovery
   * @param {string} slaName - SLA name
   * @param {number} currentValue - Current measurement
   * @param {Object} slaConfig - SLA configuration
   */
  async handleSLARecovery(slaName, currentValue, slaConfig) {
    console.log(`✅ SLA Recovered: ${slaName}`);
    console.log(`   Value: ${currentValue}, Target: ${slaConfig.target}`);
    
    await system.alertResolved({
      alert_type: 'sla_violation',
      sla_name: slaName,
      current_value: currentValue,
      target: slaConfig.target
    });
  }
  
  /**
   * Generate compliance report
   * @returns {Object} Compliance report
   */
  generateComplianceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overall_compliance: 0,
      slas: {},
      summary: {
        total_slas: this.state.slaStatus.size,
        healthy: 0,
        warning: 0,
        critical: 0,
        total_violations: this.state.violations.length
      }
    };
    
    let totalCompliance = 0;
    let slaCount = 0;
    
    for (const [slaName, status] of this.state.slaStatus.entries()) {
      report.slas[slaName] = {
        status: status.status,
        compliance: status.compliance,
        violations: status.violations,
        consecutive_violations: status.consecutiveViolations,
        last_check: status.lastCheck,
        description: status.config.description
      };
      
      totalCompliance += status.compliance;
      slaCount++;
      
      // Count by status
      switch (status.status) {
        case 'healthy':
          report.summary.healthy++;
          break;
        case 'warning':
          report.summary.warning++;
          break;
        case 'critical':
          report.summary.critical++;
          break;
      }
    }
    
    report.overall_compliance = slaCount > 0 ? totalCompliance / slaCount : 100;
    
    return report;
  }
  
  /**
   * Publish compliance report
   * @param {Object} report - Compliance report
   */
  async publishComplianceReport(report) {
    // Save report to file
    const reportFile = path.join(__dirname, '../../logs', 'sla-compliance-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    // Record overall compliance metric
    await businessMetrics.recordSlaCompliance(report.overall_compliance, {
      total_slas: report.summary.total_slas,
      healthy: report.summary.healthy,
      warning: report.summary.warning,
      critical: report.summary.critical
    });
    
    console.log(`📊 SLA Compliance: ${report.overall_compliance.toFixed(2)}% (${report.summary.healthy}/${report.summary.total_slas} healthy)`);
  }
  
  /**
   * Get current SLA status
   * @returns {Object} Current status
   */
  getCurrentStatus() {
    const status = {};
    for (const [slaName, slaStatus] of this.state.slaStatus.entries()) {
      status[slaName] = { ...slaStatus };
    }
    return status;
  }
  
  /**
   * Get recent violations
   * @param {number} count - Number of violations to return
   * @returns {Array} Recent violations
   */
  getRecentViolations(count = 50) {
    return this.state.violations.slice(-count);
  }
  
  /**
   * Add custom SLA
   * @param {string} name - SLA name
   * @param {Object} config - SLA configuration
   */
  addSLA(name, config) {
    this.config.slas[name] = config;
    
    this.state.slaStatus.set(name, {
      name: name,
      config: config,
      status: 'healthy',
      compliance: 100,
      lastCheck: null,
      violations: 0,
      consecutiveViolations: 0,
      totalMeasurements: 0,
      successfulMeasurements: 0
    });
    
    console.log(`➕ Added SLA: ${name}`);
  }
  
  /**
   * Remove SLA
   * @param {string} name - SLA name
   */
  removeSLA(name) {
    delete this.config.slas[name];
    this.state.slaStatus.delete(name);
    
    console.log(`➖ Removed SLA: ${name}`);
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Console interface for performance monitoring
 */
const performanceMonitorCLI = {
  /**
   * Start performance monitoring
   */
  async start() {
    await performanceMonitor.start();
  },
  
  /**
   * Stop performance monitoring
   */
  async stop() {
    await performanceMonitor.stop();
  },
  
  /**
   * Show current SLA status
   */
  status() {
    const status = performanceMonitor.getCurrentStatus();
    console.log('\n📊 SLA Status Summary:');
    console.log('═'.repeat(60));
    
    for (const [name, sla] of Object.entries(status)) {
      const statusIcon = sla.status === 'healthy' ? '🟢' :
                         sla.status === 'warning' ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${name}: ${sla.compliance.toFixed(2)}% (${sla.status})`);
      console.log(`   Target: ${sla.config.target}, Violations: ${sla.violations}`);
      
      if (sla.consecutiveViolations > 0) {
        console.log(`   ⚠️  Consecutive violations: ${sla.consecutiveViolations}`);
      }
    }
  },
  
  /**
   * Show recent violations
   */
  violations(count = 10) {
    const violations = performanceMonitor.getRecentViolations(count);
    
    console.log(`\n🚨 Recent SLA Violations (${violations.length}):`);
    console.log('═'.repeat(60));
    
    violations.reverse().forEach(v => {
      console.log(`${v.timestamp} - ${v.sla} (${v.severity})`);
      console.log(`   Value: ${v.value}, Target: ${v.target}`);
    });
  },
  
  /**
   * Generate compliance report
   */
  report() {
    const report = performanceMonitor.generateComplianceReport();
    console.log('\n📋 SLA Compliance Report:');
    console.log('═'.repeat(60));
    console.log(`Overall Compliance: ${report.overall_compliance.toFixed(2)}%`);
    console.log(`Healthy SLAs: ${report.summary.healthy}/${report.summary.total_slas}`);
    console.log(`Warning SLAs: ${report.summary.warning}`);
    console.log(`Critical SLAs: ${report.summary.critical}`);
    console.log(`Total Violations: ${report.summary.total_violations}`);
  }
};

module.exports = {
  PerformanceMonitor,
  performanceMonitor,
  performanceMonitorCLI,
  DEFAULT_SLAS
};