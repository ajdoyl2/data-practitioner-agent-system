# DuckDB Resource Monitoring Setup Guide

## Overview

This guide provides comprehensive setup instructions for DuckDB resource monitoring within the BMad-Method data practitioner expansion pack, including integration with existing BMad progress tracking, alerting configuration, and dashboard deployment.

## Quick Start

### 1. Basic Monitoring Setup

```bash
# Navigate to project directory
cd /path/to/bmad-method

# Install dependencies (if not already installed)
npm install

# Start basic monitoring
node scripts/monitor-duckdb.js status

# Start continuous monitoring
node scripts/monitor-duckdb.js monitor --interval 30 --web --port 3001
```

### 2. Web Dashboard Access

Once monitoring is started with the `--web` flag:
- **URL**: http://localhost:3001
- **API Endpoints**: 
  - `/api/status` - Current status
  - `/api/metrics` - Historical metrics
  - `/api/alerts` - Recent alerts
  - `/api/report` - Performance report

## Detailed Setup Instructions

### 1. Environment Configuration

#### Feature Flags Setup

Ensure DuckDB monitoring features are enabled in your configuration:

```yaml
# bmad-method/config/feature-flags.yaml
features:
  duckdb_analytics:
    enabled: true
    description: "Enable DuckDB analytics integration"
  
  duckdb_monitoring:
    enabled: true
    description: "Enable DuckDB resource monitoring"
    dependencies: ["duckdb_analytics"]
  
  duckdb_alerting:
    enabled: true
    description: "Enable DuckDB alerting system"
    dependencies: ["duckdb_monitoring"]
```

#### Environment Variables

```bash
# Optional environment configuration
export DUCKDB_MEMORY_LIMIT="4GB"
export DUCKDB_MAX_CONNECTIONS="10"
export DUCKDB_MONITORING_INTERVAL="30000"  # 30 seconds
export DUCKDB_WEB_DASHBOARD_PORT="3001"
export DUCKDB_ALERT_WEBHOOK_URL="https://your-webhook-url.com"
```

### 2. Programmatic Integration

#### Basic Monitoring Integration

```javascript
const DuckDBWrapper = require('./tools/data-services/duckdb-wrapper');
const DuckDBResourceMonitor = require('./tools/data-services/resource-monitor');

class DataProcessingService {
  constructor() {
    this.duckdb = new DuckDBWrapper({
      memoryLimit: '4GB',
      maxConnections: 10
    });
    
    this.monitor = new DuckDBResourceMonitor({
      duckdb: this.duckdb,
      memoryWarningThreshold: 75,
      memoryCriticalThreshold: 90,
      monitoringInterval: 30000
    });
    
    this.setupMonitoringHandlers();
  }

  setupMonitoringHandlers() {
    // Handle memory warnings
    this.monitor.on('alert', (alert) => {
      if (alert.name === 'duckdb_memory_warning') {
        console.warn(`Memory usage high: ${alert.message}`);
        // Trigger cleanup or scaling
        this.handleMemoryPressure(alert);
      }
    });
    
    // Handle critical alerts
    this.monitor.on('alert', (alert) => {
      if (alert.level === 'critical') {
        console.error(`Critical alert: ${alert.message}`);
        // Implement emergency procedures
        this.handleCriticalAlert(alert);
      }
    });
  }

  async initialize() {
    await this.duckdb.initialize();
    await this.monitor.startMonitoring();
    console.log('Data processing service initialized with monitoring');
  }

  async handleMemoryPressure(alert) {
    // Implement memory pressure handling
    await this.monitor.performAutomaticCleanup();
  }

  async handleCriticalAlert(alert) {
    // Implement critical alert handling
    await this.monitor.performEmergencyCleanup();
    // Maybe reduce workload or scale resources
  }
}
```

#### Advanced Dashboard Integration

```javascript
const DuckDBMonitoringDashboard = require('./tools/data-services/monitoring-dashboard');

class AdvancedMonitoringService {
  constructor() {
    this.duckdb = new DuckDBWrapper({ memoryLimit: '8GB' });
    this.dashboard = new DuckDBMonitoringDashboard(this.duckdb, {
      updateInterval: 15000, // 15 seconds
      enableWebDashboard: true,
      dashboardPort: 3001,
      alertThresholds: {
        memory: 80,
        cpu: 75,
        queryTime: 5000
      }
    });
    
    this.setupAdvancedHandlers();
  }

  setupAdvancedHandlers() {
    // Performance issue detection
    this.dashboard.on('dashboard:performance_issues', (issues) => {
      issues.forEach(issue => {
        console.log(`Performance issue detected: ${issue.message}`);
        this.handlePerformanceIssue(issue);
      });
    });
    
    // Export metrics periodically
    this.dashboard.on('dashboard:updated', async (data) => {
      if (this.shouldExportMetrics(data)) {
        await this.exportMetrics(data);
      }
    });
  }

  async startAdvancedMonitoring() {
    await this.duckdb.initialize();
    await this.dashboard.start();
    
    console.log('Advanced monitoring started');
    console.log('Web dashboard: http://localhost:3001');
  }

  shouldExportMetrics(data) {
    // Export metrics every hour or on critical alerts
    const lastExport = this.lastMetricsExport || 0;
    const hourAgo = Date.now() - (60 * 60 * 1000);
    
    return lastExport < hourAgo || data.summary.status === 'critical';
  }

  async exportMetrics(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `duckdb-metrics-${timestamp}.json`;
    
    await this.dashboard.exportMetrics(`./logs/${filename}`, 'json');
    this.lastMetricsExport = Date.now();
  }

  handlePerformanceIssue(issue) {
    switch (issue.type) {
      case 'memory_high':
        this.handleHighMemoryUsage(issue);
        break;
      case 'cpu_high':
        this.handleHighCpuUsage(issue);
        break;
      case 'query_backlog':
        this.handleQueryBacklog(issue);
        break;
    }
  }
}
```

### 3. BMad-Method Integration

#### Security Logger Integration

The monitoring system automatically integrates with BMad's security logger:

```javascript
// All monitoring events are logged through BMad security logger
const { securityLogger } = require('../lib/security-logger');

// Examples of logged events:
// - monitoring_started
// - resource_alert  
// - automatic_cleanup
// - monitoring_stopped
// - dashboard_critical_alert

// Custom security logging integration
class BMadMonitoringIntegration {
  constructor(monitor) {
    this.monitor = monitor;
    this.setupSecurityLogging();
  }

  setupSecurityLogging() {
    // Log all critical alerts to security log
    this.monitor.on('alert', (alert) => {
      if (alert.level === 'critical' || alert.level === 'emergency') {
        securityLogger.logDuckDBOperation({
          operation: 'critical_resource_alert',
          alert_type: alert.name,
          alert_level: alert.level,
          message: alert.message,
          metrics: {
            memory_percent: alert.metrics?.memory?.duckdb_memory_percent,
            cpu_percent: alert.metrics?.system?.cpu_usage_percent,
            active_queries: alert.metrics?.queries?.active_queries
          },
          timestamp: alert.timestamp,
          requires_investigation: true
        });
      }
    });
    
    // Log significant resource usage changes
    this.monitor.on('monitoring:check', (metrics) => {
      if (this.isSignificantChange(metrics)) {
        securityLogger.logDuckDBOperation({
          operation: 'resource_usage_change',
          memory_percent: metrics.memory.duckdb_memory_percent,
          cpu_percent: metrics.system.cpu_usage_percent,
          change_type: this.getChangeType(metrics),
          timestamp: metrics.timestamp
        });
      }
    });
  }

  isSignificantChange(currentMetrics) {
    // Implement logic to detect significant changes
    // E.g., memory usage change > 20% in 5 minutes
    return false; // Placeholder
  }
}
```

#### Feature Flag Integration

```javascript
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class ConditionalMonitoring {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.monitoringComponents = {};
  }

  async initializeBasedOnFlags() {
    // Basic monitoring (always enabled if DuckDB is enabled)
    if (isFeatureEnabled('duckdb_analytics')) {
      this.monitoringComponents.basic = new DuckDBResourceMonitor({
        duckdb: this.duckdb
      });
    }
    
    // Advanced monitoring (optional)
    if (isFeatureEnabled('duckdb_monitoring')) {
      this.monitoringComponents.advanced = new DuckDBMonitoringDashboard(
        this.duckdb, {
          enableWebDashboard: isFeatureEnabled('duckdb_web_dashboard'),
          alertingEnabled: isFeatureEnabled('duckdb_alerting')
        }
      );
    }
    
    // Performance monitoring (resource intensive)
    if (isFeatureEnabled('duckdb_performance_monitoring')) {
      this.monitoringComponents.performance = new PerformanceProfiler(
        this.duckdb
      );
    }
  }

  async startEnabledMonitoring() {
    for (const [name, component] of Object.entries(this.monitoringComponents)) {
      if (component && typeof component.start === 'function') {
        await component.start();
        console.log(`Started ${name} monitoring`);
      }
    }
  }
}
```

### 4. Alert Configuration

#### Email Alerts Setup

```javascript
// Configure email alerts for critical issues
const nodemailer = require('nodemailer');

class EmailAlertHandler {
  constructor(options = {}) {
    this.transporter = nodemailer.createTransporter({
      host: options.smtpHost || process.env.SMTP_HOST,
      port: options.smtpPort || process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    this.recipients = options.recipients || [process.env.ALERT_EMAIL];
  }

  async sendAlert(alert) {
    const subject = `DuckDB Alert: ${alert.level.toUpperCase()} - ${alert.name}`;
    const body = this.formatAlertEmail(alert);
    
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'duckdb-monitor@your-domain.com',
        to: this.recipients.join(','),
        subject: subject,
        html: body
      });
      
      console.log(`Alert email sent for: ${alert.name}`);
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
  }

  formatAlertEmail(alert) {
    return `
      <h2>DuckDB Resource Alert</h2>
      <p><strong>Alert:</strong> ${alert.name}</p>
      <p><strong>Level:</strong> ${alert.level}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Time:</strong> ${alert.timestamp}</p>
      
      ${alert.metrics ? `
        <h3>Current Metrics</h3>
        <ul>
          <li>Memory Usage: ${alert.metrics.memory?.duckdb_memory_percent?.toFixed(1)}%</li>
          <li>CPU Usage: ${alert.metrics.system?.cpu_usage_percent?.toFixed(1)}%</li>
          <li>Active Queries: ${alert.metrics.queries?.active_queries}</li>
        </ul>
      ` : ''}
      
      <p><em>This alert was generated by the BMad-Method DuckDB monitoring system.</em></p>
    `;
  }
}

// Register email alert handler
const monitor = new DuckDBResourceMonitor({ duckdb });
const emailHandler = new EmailAlertHandler({
  recipients: ['admin@your-domain.com', 'ops@your-domain.com']
});

monitor.registerAlertHandler('duckdb_memory_critical', async (alert) => {
  await emailHandler.sendAlert(alert);
});
```

#### Webhook Alerts Setup

```javascript
const axios = require('axios');

class WebhookAlertHandler {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendAlert(alert) {
    try {
      const payload = {
        text: `DuckDB Alert: ${alert.level.toUpperCase()}`,
        attachments: [{
          color: this.getAlertColor(alert.level),
          fields: [
            { title: 'Alert', value: alert.name, short: true },
            { title: 'Level', value: alert.level, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Time', value: alert.timestamp, short: true }
          ]
        }]
      };
      
      await axios.post(this.webhookUrl, payload);
      console.log(`Webhook alert sent for: ${alert.name}`);
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  getAlertColor(level) {
    switch (level) {
      case 'emergency': return 'danger';
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      default: return 'good';
    }
  }
}
```

### 5. Performance Optimization

#### Monitoring Performance Impact

```javascript
class LightweightMonitoring {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.config = {
      // Reduce monitoring frequency for production
      monitoringInterval: 60000, // 1 minute instead of 30 seconds
      
      // Limit metric history to reduce memory usage
      historyRetention: 100, // Keep only 100 data points
      
      // Disable detailed metrics collection
      enableDetailedMetrics: false,
      
      // Batch alert processing
      alertBatchSize: 5,
      alertBatchInterval: 30000 // 30 seconds
    };
  }

  async startOptimizedMonitoring() {
    const monitor = new DuckDBResourceMonitor({
      duckdb: this.duckdb,
      monitoringInterval: this.config.monitoringInterval,
      alertingCooldown: this.config.alertBatchInterval
    });
    
    // Batch alert processing to reduce overhead
    this.setupBatchedAlertProcessing(monitor);
    
    await monitor.startMonitoring();
  }

  setupBatchedAlertProcessing(monitor) {
    const alertQueue = [];
    
    monitor.on('alert', (alert) => {
      alertQueue.push(alert);
      
      if (alertQueue.length >= this.config.alertBatchSize) {
        this.processBatchedAlerts(alertQueue.splice(0));
      }
    });
    
    // Process remaining alerts periodically
    setInterval(() => {
      if (alertQueue.length > 0) {
        this.processBatchedAlerts(alertQueue.splice(0));
      }
    }, this.config.alertBatchInterval);
  }

  processBatchedAlerts(alerts) {
    // Group alerts by type and process efficiently
    const groupedAlerts = alerts.reduce((acc, alert) => {
      acc[alert.name] = acc[alert.name] || [];
      acc[alert.name].push(alert);
      return acc;
    }, {});
    
    Object.entries(groupedAlerts).forEach(([alertName, alertList]) => {
      this.processAlertGroup(alertName, alertList);
    });
  }
}
```

## Monitoring Dashboard Setup

### 1. Basic HTML Dashboard

Create a simple monitoring dashboard:

```html
<!-- docs/monitoring/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>DuckDB Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .status-healthy { color: green; }
        .status-warning { color: orange; }
        .status-critical { color: red; }
        .chart-container { height: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>DuckDB Monitoring Dashboard</h1>
    
    <div id="status" class="status-healthy">Status: Loading...</div>
    
    <div class="metrics">
        <div class="metric-card">
            <h3>Memory Usage</h3>
            <div id="memory-value" class="metric-value">--</div>
            <div>of configured limit</div>
        </div>
        
        <div class="metric-card">
            <h3>CPU Usage</h3>
            <div id="cpu-value" class="metric-value">--</div>
            <div>system utilization</div>
        </div>
        
        <div class="metric-card">
            <h3>Active Queries</h3>
            <div id="queries-value" class="metric-value">--</div>
            <div>currently executing</div>
        </div>
    </div>
    
    <div class="chart-container">
        <canvas id="memory-chart"></canvas>
    </div>
    
    <div class="chart-container">
        <canvas id="cpu-chart"></canvas>
    </div>
    
    <script>
        let memoryChart, cpuChart;
        
        async function initializeDashboard() {
            // Initialize charts
            const memoryCtx = document.getElementById('memory-chart').getContext('2d');
            memoryChart = new Chart(memoryCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Memory Usage %',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 0, max: 100 } }
                }
            });
            
            const cpuCtx = document.getElementById('cpu-chart').getContext('2d');
            cpuChart = new Chart(cpuCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'CPU Usage %',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 0, max: 100 } }
                }
            });
            
            // Start updating
            updateDashboard();
            setInterval(updateDashboard, 10000); // Update every 10 seconds
        }
        
        async function updateDashboard() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                updateMetrics(data);
                updateCharts(data);
                updateStatus(data);
            } catch (error) {
                console.error('Failed to update dashboard:', error);
                document.getElementById('status').textContent = 'Status: Error';
                document.getElementById('status').className = 'status-critical';
            }
        }
        
        function updateMetrics(data) {
            const metrics = data.metrics;
            
            document.getElementById('memory-value').textContent = 
                `${metrics.memory.duckdb_memory_percent.toFixed(1)}%`;
            document.getElementById('cpu-value').textContent = 
                `${metrics.system.cpu_usage_percent.toFixed(1)}%`;
            document.getElementById('queries-value').textContent = 
                metrics.queries.active_queries;
        }
        
        function updateCharts(data) {
            const time = new Date(data.metrics.timestamp).toLocaleTimeString();
            
            // Update memory chart
            memoryChart.data.labels.push(time);
            memoryChart.data.datasets[0].data.push(data.metrics.memory.duckdb_memory_percent);
            
            // Keep only last 20 data points
            if (memoryChart.data.labels.length > 20) {
                memoryChart.data.labels.shift();
                memoryChart.data.datasets[0].data.shift();
            }
            
            memoryChart.update('none');
            
            // Update CPU chart
            cpuChart.data.labels.push(time);
            cpuChart.data.datasets[0].data.push(data.metrics.system.cpu_usage_percent);
            
            if (cpuChart.data.labels.length > 20) {
                cpuChart.data.labels.shift();
                cpuChart.data.datasets[0].data.shift();
            }
            
            cpuChart.update('none');
        }
        
        function updateStatus(data) {
            const status = data.summary.status;
            const statusElement = document.getElementById('status');
            
            statusElement.textContent = `Status: ${status.toUpperCase()}`;
            statusElement.className = `status-${status}`;
        }
        
        // Initialize when page loads
        initializeDashboard();
    </script>
</body>
</html>
```

### 2. Advanced Monitoring Scripts

#### Automated Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

# DuckDB Health Check Script
echo "🏥 DuckDB Health Check - $(date)"
echo "================================"

# Check if monitoring is running
if pgrep -f "monitor-duckdb.js" > /dev/null; then
    echo "✅ Monitoring process is running"
else
    echo "❌ Monitoring process is not running"
    echo "   Starting monitoring..."
    nohup node scripts/monitor-duckdb.js monitor --interval 60 > /tmp/duckdb-monitor.log 2>&1 &
fi

# Check memory usage
MEMORY_USAGE=$(node scripts/monitor-duckdb.js status --json | jq -r '.metrics.memory.duckdb_memory_percent')
if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "⚠️  High memory usage: ${MEMORY_USAGE}%"
    # Trigger cleanup
    node scripts/monitor-duckdb.js cleanup
else
    echo "✅ Memory usage normal: ${MEMORY_USAGE}%"
fi

# Check for recent critical alerts
CRITICAL_ALERTS=$(grep -c "CRITICAL\|EMERGENCY" /tmp/duckdb-monitor.log 2>/dev/null || echo "0")
if [ "$CRITICAL_ALERTS" -gt 0 ]; then
    echo "🚨 Found $CRITICAL_ALERTS critical alerts in recent logs"
    echo "   Last few critical alerts:"
    grep "CRITICAL\|EMERGENCY" /tmp/duckdb-monitor.log | tail -3
else
    echo "✅ No critical alerts detected"
fi

echo "================================"
echo "Health check completed"
```

#### Performance Report Generator

```bash
#!/bin/bash
# scripts/generate-report.sh

REPORT_DIR="./reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/duckdb_report_$TIMESTAMP.json"

mkdir -p "$REPORT_DIR"

echo "📊 Generating DuckDB performance report..."

# Generate comprehensive report
node scripts/monitor-duckdb.js report \
    --format json \
    --period 24 \
    --output "$REPORT_FILE"

# Generate HTML version
HTML_REPORT="${REPORT_FILE%.json}.html"
node scripts/monitor-duckdb.js report \
    --format html \
    --period 24 \
    --output "$HTML_REPORT"

echo "✅ Reports generated:"
echo "   JSON: $REPORT_FILE"
echo "   HTML: $HTML_REPORT"

# Optional: Send to monitoring system
if [ -n "$MONITORING_WEBHOOK" ]; then
    curl -X POST "$MONITORING_WEBHOOK" \
         -H "Content-Type: application/json" \
         -d @"$REPORT_FILE"
fi
```

## Production Deployment Considerations

### 1. Resource Requirements

```yaml
# Monitoring resource overhead
basic_monitoring:
  cpu_overhead: "< 5%"
  memory_overhead: "< 50MB"
  disk_space: "< 100MB for logs"
  
advanced_monitoring:
  cpu_overhead: "< 10%"
  memory_overhead: "< 200MB"
  disk_space: "< 1GB for metrics"
  
web_dashboard:
  cpu_overhead: "< 2%"
  memory_overhead: "< 50MB"
  network: "minimal"
```

### 2. Security Considerations

```javascript
// Secure monitoring setup
class SecureMonitoring {
  constructor() {
    this.config = {
      // Restrict API access
      enableApiAuth: true,
      apiKeyHeader: 'X-Monitoring-Key',
      
      // Secure web dashboard
      enableHttps: process.env.NODE_ENV === 'production',
      corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['localhost'],
      
      // Encrypt sensitive data in logs
      encryptLogs: true,
      
      // Rate limiting
      rateLimitRequests: 100, // per minute
      
      // Audit trail
      enableAuditLog: true
    };
  }

  setupSecureEndpoints(app) {
    // API key authentication
    app.use('/api/*', (req, res, next) => {
      const apiKey = req.header(this.config.apiKeyHeader);
      if (!apiKey || !this.validateApiKey(apiKey)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    });
    
    // CORS configuration
    app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));
    
    // Rate limiting
    const rateLimit = require('express-rate-limit');
    app.use('/api/', rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: this.config.rateLimitRequests
    }));
  }
}
```

### 3. High Availability Setup

```javascript
// Multi-instance monitoring coordination
class HAMonitoring {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.peers = new Set();
    this.isLeader = false;
  }

  async setupHAMonitoring() {
    // Leader election for centralized monitoring
    await this.electLeader();
    
    if (this.isLeader) {
      // Primary monitoring instance
      await this.startPrimaryMonitoring();
    } else {
      // Backup monitoring instance
      await this.startBackupMonitoring();
    }
  }

  async electLeader() {
    // Simple leader election based on instance ID
    // In production, use proper consensus algorithm
    this.isLeader = this.instanceId === 'instance-1';
  }

  async startPrimaryMonitoring() {
    // Full monitoring with alerting
    const dashboard = new DuckDBMonitoringDashboard(this.duckdb, {
      enableWebDashboard: true,
      alertingEnabled: true
    });
    
    await dashboard.start();
    console.log('Primary monitoring started');
  }

  async startBackupMonitoring() {
    // Lightweight monitoring without alerting
    const monitor = new DuckDBResourceMonitor({
      duckdb: this.duckdb,
      alertingEnabled: false // Avoid duplicate alerts
    });
    
    await monitor.startMonitoring();
    console.log('Backup monitoring started');
  }
}
```

## Troubleshooting

### Common Issues

1. **Monitoring Not Starting**
   - Check feature flags are enabled
   - Verify DuckDB initialization
   - Check port availability for web dashboard

2. **High Resource Usage**
   - Reduce monitoring frequency
   - Disable detailed metrics
   - Use lightweight monitoring mode

3. **Missing Alerts**
   - Verify alert handlers are registered
   - Check threshold configuration
   - Test webhook/email connectivity

4. **Dashboard Not Loading**
   - Check web server port
   - Verify API endpoints are accessible
   - Check browser console for errors

### Debug Commands

```bash
# Check monitoring status
node scripts/monitor-duckdb.js status --json

# Test benchmark performance
node scripts/monitor-duckdb.js benchmark --test-type memory

# Force cleanup
node scripts/monitor-duckdb.js cleanup --force

# Generate debug report
node scripts/monitor-duckdb.js report --period 1 --format json
```

## Next Steps

1. **Establish Fallback Procedures** - Document procedures for memory exhaustion scenarios
2. **Document BMad-Method Integration** - Complete integration with existing BMad resource management
3. **Production Testing** - Test monitoring under production workloads

## References

- [Resource Thresholds Configuration](../../bmad-method/expansion-packs/bmad-data-practitioner/data/resource-thresholds-config.yaml)
- [DuckDB Memory Management](./duckdb-memory-management.md)
- [Performance Benchmarks](../performance/duckdb-performance-benchmarks.md)
- [BMad-Method Documentation](../prd.md)