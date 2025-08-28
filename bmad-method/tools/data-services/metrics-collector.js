/**
 * Data Pipeline Metrics Collector
 * Collects and aggregates performance, quality, and business metrics
 * Integrates with monitoring logger and quality assurance systems
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { performance } = require('./monitoring-logger');

// Load monitoring configuration
const configPath = path.join(__dirname, '../../config/quality-assurance/monitoring-config.yaml');
let monitoringConfig = {};

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  monitoringConfig = yaml.load(configContent);
} catch (error) {
  console.error('Failed to load monitoring config:', error.message);
  monitoringConfig = { monitoring: { collection_interval_seconds: 60 } };
}

// Metrics storage
const METRICS_DIR = path.join(__dirname, '../../logs/metrics');
fs.ensureDirSync(METRICS_DIR);

// In-memory metrics store for real-time access
const metricsStore = {
  dataQuality: new Map(),
  performance: new Map(),
  systemResources: new Map(),
  business: new Map(),
  alerts: new Map()
};

// Metrics aggregation windows
const aggregationWindows = {
  '1m': 60 * 1000,      // 1 minute
  '5m': 5 * 60 * 1000,  // 5 minutes
  '15m': 15 * 60 * 1000, // 15 minutes
  '1h': 60 * 60 * 1000,  // 1 hour
  '1d': 24 * 60 * 60 * 1000 // 1 day
};

/**
 * Metric definition
 */
class Metric {
  constructor(name, type, value, timestamp = null, metadata = {}) {
    this.name = name;
    this.type = type; // counter, gauge, histogram, summary
    this.value = value;
    this.timestamp = timestamp || Date.now();
    this.metadata = metadata;
  }
  
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      value: this.value,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}

/**
 * Store metric in memory and persist to file
 * @param {string} category - Metric category
 * @param {Metric} metric - Metric instance
 */
async function storeMetric(category, metric) {
  // Store in memory
  if (!metricsStore[category]) {
    metricsStore[category] = new Map();
  }
  
  const key = `${metric.name}-${metric.timestamp}`;
  metricsStore[category].set(key, metric);
  
  // Clean up old metrics (keep last 1000 entries per metric name)
  const metricKeys = Array.from(metricsStore[category].keys())
    .filter(k => k.startsWith(metric.name + '-'))
    .sort()
    .slice(0, -1000);
  
  metricKeys.forEach(key => metricsStore[category].delete(key));
  
  // Persist to file
  const metricsFile = path.join(METRICS_DIR, `${category}-metrics.json`);
  const logEntry = JSON.stringify(metric.toJSON()) + '\n';
  
  try {
    await fs.appendFile(metricsFile, logEntry, 'utf8');
  } catch (error) {
    console.error(`Failed to persist metric to ${metricsFile}:`, error.message);
  }
  
  // Log to monitoring system
  await performance.metricCollected({
    metric: metric.name,
    value: metric.value,
    category
  }, {
    component: 'metrics-collector',
    metadata: metric.metadata
  });
}

/**
 * Data Quality Metrics Collection
 */
const dataQualityMetrics = {
  /**
   * Record data completeness score
   * @param {number} score - Completeness score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordCompleteness(score, metadata = {}) {
    const metric = new Metric('data_completeness', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  },
  
  /**
   * Record data accuracy score
   * @param {number} score - Accuracy score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordAccuracy(score, metadata = {}) {
    const metric = new Metric('data_accuracy', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  },
  
  /**
   * Record data consistency score
   * @param {number} score - Consistency score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordConsistency(score, metadata = {}) {
    const metric = new Metric('data_consistency', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  },
  
  /**
   * Record data validity score
   * @param {number} score - Validity score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordValidity(score, metadata = {}) {
    const metric = new Metric('data_validity', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  },
  
  /**
   * Record data uniqueness score
   * @param {number} score - Uniqueness score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordUniqueness(score, metadata = {}) {
    const metric = new Metric('data_uniqueness', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  },
  
  /**
   * Record data timeliness score
   * @param {number} score - Timeliness score (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordTimeliness(score, metadata = {}) {
    const metric = new Metric('data_timeliness', 'gauge', score, null, metadata);
    await storeMetric('dataQuality', metric);
  }
};

/**
 * Performance Metrics Collection
 */
const performanceMetrics = {
  /**
   * Record response time
   * @param {number} responseTime - Response time in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  async recordResponseTime(responseTime, metadata = {}) {
    const metric = new Metric('response_time', 'histogram', responseTime, null, metadata);
    await storeMetric('performance', metric);
    
    // Check threshold
    if (responseTime > 1000) {
      await performance.thresholdExceeded({
        metric: 'response_time',
        value: responseTime,
        threshold: 1000
      }, metadata);
    }
  },
  
  /**
   * Record throughput
   * @param {number} throughput - Throughput (requests per second)
   * @param {Object} metadata - Additional metadata
   */
  async recordThroughput(throughput, metadata = {}) {
    const metric = new Metric('throughput', 'gauge', throughput, null, metadata);
    await storeMetric('performance', metric);
  },
  
  /**
   * Record latency percentiles
   * @param {Object} percentiles - Latency percentiles {p50, p95, p99}
   * @param {Object} metadata - Additional metadata
   */
  async recordLatencyPercentiles(percentiles, metadata = {}) {
    for (const [percentile, value] of Object.entries(percentiles)) {
      const metric = new Metric(`latency_${percentile}`, 'gauge', value, null, metadata);
      await storeMetric('performance', metric);
    }
  },
  
  /**
   * Record error rate
   * @param {number} errorRate - Error rate (0-1)
   * @param {Object} metadata - Additional metadata
   */
  async recordErrorRate(errorRate, metadata = {}) {
    const metric = new Metric('error_rate', 'gauge', errorRate, null, metadata);
    await storeMetric('performance', metric);
    
    // Check threshold
    if (errorRate > 0.05) { // 5% error rate
      await performance.thresholdExceeded({
        metric: 'error_rate',
        value: errorRate,
        threshold: 0.05
      }, metadata);
    }
  },
  
  /**
   * Record success rate
   * @param {number} successRate - Success rate (0-1)
   * @param {Object} metadata - Additional metadata
   */
  async recordSuccessRate(successRate, metadata = {}) {
    const metric = new Metric('success_rate', 'gauge', successRate, null, metadata);
    await storeMetric('performance', metric);
    
    // Check threshold
    if (successRate < 0.95) { // 95% success rate
      await performance.thresholdExceeded({
        metric: 'success_rate',
        value: successRate,
        threshold: 0.95
      }, metadata);
    }
  }
};

/**
 * System Resource Metrics Collection
 */
const systemResourceMetrics = {
  /**
   * Record CPU utilization
   * @param {number} cpuUsage - CPU usage percentage (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordCpuUtilization(cpuUsage, metadata = {}) {
    const metric = new Metric('cpu_utilization', 'gauge', cpuUsage, null, metadata);
    await storeMetric('systemResources', metric);
    
    // Check threshold
    if (cpuUsage > 80) {
      await performance.resourceUsageHigh({
        resource: 'cpu',
        usage: cpuUsage,
        threshold: 80
      }, metadata);
    }
  },
  
  /**
   * Record memory usage
   * @param {number} memoryUsage - Memory usage percentage (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordMemoryUsage(memoryUsage, metadata = {}) {
    const metric = new Metric('memory_usage', 'gauge', memoryUsage, null, metadata);
    await storeMetric('systemResources', metric);
    
    // Check threshold
    if (memoryUsage > 90) {
      await performance.resourceUsageHigh({
        resource: 'memory',
        usage: memoryUsage,
        threshold: 90
      }, metadata);
    }
  },
  
  /**
   * Record disk usage
   * @param {number} diskUsage - Disk usage percentage (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordDiskUsage(diskUsage, metadata = {}) {
    const metric = new Metric('disk_usage', 'gauge', diskUsage, null, metadata);
    await storeMetric('systemResources', metric);
    
    // Check threshold
    if (diskUsage > 85) {
      await performance.resourceUsageHigh({
        resource: 'disk',
        usage: diskUsage,
        threshold: 85
      }, metadata);
    }
  },
  
  /**
   * Record network I/O
   * @param {Object} networkIO - Network I/O metrics {bytesIn, bytesOut}
   * @param {Object} metadata - Additional metadata
   */
  async recordNetworkIO(networkIO, metadata = {}) {
    const metric = new Metric('network_io', 'counter', networkIO, null, metadata);
    await storeMetric('systemResources', metric);
  },
  
  /**
   * Record database connections
   * @param {number} activeConnections - Number of active connections
   * @param {Object} metadata - Additional metadata
   */
  async recordDatabaseConnections(activeConnections, metadata = {}) {
    const metric = new Metric('database_connections', 'gauge', activeConnections, null, metadata);
    await storeMetric('systemResources', metric);
  }
};

/**
 * Business Metrics Collection
 */
const businessMetrics = {
  /**
   * Record pipeline success rate
   * @param {number} successRate - Pipeline success rate (0-1)
   * @param {Object} metadata - Additional metadata
   */
  async recordPipelineSuccessRate(successRate, metadata = {}) {
    const metric = new Metric('pipeline_success_rate', 'gauge', successRate, null, metadata);
    await storeMetric('business', metric);
  },
  
  /**
   * Record data freshness
   * @param {number} freshnessMinutes - Data freshness in minutes
   * @param {Object} metadata - Additional metadata
   */
  async recordDataFreshness(freshnessMinutes, metadata = {}) {
    const metric = new Metric('data_freshness', 'gauge', freshnessMinutes, null, metadata);
    await storeMetric('business', metric);
  },
  
  /**
   * Record SLA compliance
   * @param {number} slaCompliance - SLA compliance percentage (0-100)
   * @param {Object} metadata - Additional metadata
   */
  async recordSlaCompliance(slaCompliance, metadata = {}) {
    const metric = new Metric('sla_compliance', 'gauge', slaCompliance, null, metadata);
    await storeMetric('business', metric);
    
    // Check threshold
    if (slaCompliance < 99.5) {
      await performance.thresholdExceeded({
        metric: 'sla_compliance',
        value: slaCompliance,
        threshold: 99.5
      }, metadata);
    }
  },
  
  /**
   * Record cost per transaction
   * @param {number} cost - Cost per transaction
   * @param {Object} metadata - Additional metadata
   */
  async recordCostPerTransaction(cost, metadata = {}) {
    const metric = new Metric('cost_per_transaction', 'gauge', cost, null, metadata);
    await storeMetric('business', metric);
  }
};

/**
 * Get metrics for a specific time range
 * @param {string} category - Metric category
 * @param {string} metricName - Metric name
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp
 * @returns {Array} Metrics in time range
 */
function getMetricsInRange(category, metricName, startTime, endTime) {
  if (!metricsStore[category]) {
    return [];
  }
  
  const metrics = Array.from(metricsStore[category].values())
    .filter(metric => 
      metric.name === metricName &&
      metric.timestamp >= startTime &&
      metric.timestamp <= endTime
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  
  return metrics;
}

/**
 * Calculate aggregated metrics over a time window
 * @param {string} category - Metric category
 * @param {string} metricName - Metric name
 * @param {string} window - Time window (1m, 5m, 15m, 1h, 1d)
 * @returns {Object} Aggregated metrics
 */
function getAggregatedMetrics(category, metricName, window) {
  const windowMs = aggregationWindows[window];
  if (!windowMs) {
    throw new Error(`Invalid time window: ${window}`);
  }
  
  const endTime = Date.now();
  const startTime = endTime - windowMs;
  const metrics = getMetricsInRange(category, metricName, startTime, endTime);
  
  if (metrics.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      avg: null,
      sum: null,
      latest: null
    };
  }
  
  const values = metrics.map(m => m.value);
  const sum = values.reduce((a, b) => a + b, 0);
  
  return {
    count: metrics.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum: sum,
    latest: metrics[metrics.length - 1].value,
    timestamp: endTime
  };
}

/**
 * Generate dashboard data
 * @returns {Object} Dashboard data for all configured dashboards
 */
async function generateDashboardData() {
  const dashboards = monitoringConfig.monitoring?.dashboards || {};
  const dashboardData = {};
  
  for (const [dashboardName, config] of Object.entries(dashboards)) {
    if (!config.enabled) continue;
    
    dashboardData[dashboardName] = {
      name: dashboardName,
      refreshInterval: config.refresh_interval_seconds,
      timeRange: config.time_range_hours || config.time_range_days || 1,
      panels: {},
      lastUpdated: new Date().toISOString()
    };
    
    // Generate data for each panel
    for (const panelName of config.panels) {
      dashboardData[dashboardName].panels[panelName] = await generatePanelData(panelName);
    }
  }
  
  return dashboardData;
}

/**
 * Generate data for a specific dashboard panel
 * @param {string} panelName - Panel name
 * @returns {Object} Panel data
 */
async function generatePanelData(panelName) {
  const now = Date.now();
  
  switch (panelName) {
    case 'pipeline_status':
      return {
        name: 'Pipeline Status',
        type: 'status',
        data: {
          running: getAggregatedMetrics('business', 'pipeline_success_rate', '5m'),
          success_rate: getAggregatedMetrics('business', 'pipeline_success_rate', '1h')
        }
      };
    
    case 'quality_gates_status':
      return {
        name: 'Quality Gates',
        type: 'status',
        data: {
          completeness: getAggregatedMetrics('dataQuality', 'data_completeness', '5m'),
          accuracy: getAggregatedMetrics('dataQuality', 'data_accuracy', '5m'),
          validity: getAggregatedMetrics('dataQuality', 'data_validity', '5m')
        }
      };
    
    case 'performance_metrics':
      return {
        name: 'Performance Metrics',
        type: 'timeseries',
        data: {
          response_time: getAggregatedMetrics('performance', 'response_time', '15m'),
          throughput: getAggregatedMetrics('performance', 'throughput', '15m'),
          error_rate: getAggregatedMetrics('performance', 'error_rate', '15m')
        }
      };
    
    case 'system_health':
      return {
        name: 'System Health',
        type: 'gauge',
        data: {
          cpu: getAggregatedMetrics('systemResources', 'cpu_utilization', '1m'),
          memory: getAggregatedMetrics('systemResources', 'memory_usage', '1m'),
          disk: getAggregatedMetrics('systemResources', 'disk_usage', '1m')
        }
      };
    
    case 'data_quality_trends':
      return {
        name: 'Data Quality Trends',
        type: 'timeseries',
        data: {
          completeness: getMetricsInRange('dataQuality', 'data_completeness', now - 24*60*60*1000, now),
          accuracy: getMetricsInRange('dataQuality', 'data_accuracy', now - 24*60*60*1000, now),
          consistency: getMetricsInRange('dataQuality', 'data_consistency', now - 24*60*60*1000, now)
        }
      };
    
    case 'sla_compliance':
      return {
        name: 'SLA Compliance',
        type: 'gauge',
        data: {
          current: getAggregatedMetrics('business', 'sla_compliance', '1h'),
          trend: getMetricsInRange('business', 'sla_compliance', now - 7*24*60*60*1000, now)
        }
      };
    
    default:
      return {
        name: panelName,
        type: 'unknown',
        data: {},
        error: `Unknown panel type: ${panelName}`
      };
  }
}

/**
 * Start metrics collection
 * @param {number} intervalSeconds - Collection interval in seconds
 */
function startMetricsCollection(intervalSeconds = null) {
  const interval = intervalSeconds || monitoringConfig.monitoring?.collection_interval_seconds || 60;
  
  console.log(`Starting metrics collection with ${interval}s interval`);
  
  return setInterval(async () => {
    try {
      // Collect system metrics
      const usage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      await systemResourceMetrics.recordMemoryUsage(
        (usage.heapUsed / usage.heapTotal) * 100,
        { component: 'nodejs-process' }
      );
      
      // Add more system metrics collection as needed
      
    } catch (error) {
      console.error('Error during metrics collection:', error.message);
    }
  }, interval * 1000);
}

module.exports = {
  // Core functions
  storeMetric,
  getMetricsInRange,
  getAggregatedMetrics,
  generateDashboardData,
  generatePanelData,
  startMetricsCollection,
  
  // Metric collection functions
  dataQualityMetrics,
  performanceMetrics,
  systemResourceMetrics,
  businessMetrics,
  
  // Classes and constants
  Metric,
  metricsStore,
  aggregationWindows
};