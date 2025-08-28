/**
 * Data Services Monitoring Logger
 * Comprehensive logging system for all data pipeline components
 * Integrates with existing BMad security logger and monitoring config
 */

const fs = require('fs-extra');
const path = require('path');
const { securityLogger } = require('../lib/security-logger');
const yaml = require('js-yaml');

// Load monitoring configuration
const configPath = path.join(__dirname, '../../config/quality-assurance/monitoring-config.yaml');
let monitoringConfig = {};

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  monitoringConfig = yaml.load(configContent);
} catch (error) {
  console.error('Failed to load monitoring config:', error.message);
  // Use default configuration
  monitoringConfig = {
    logging: {
      level: 'info',
      structured: true,
      correlation_id: true,
      categories: {
        quality_gates: 'info',
        test_execution: 'info',
        performance_metrics: 'info',
        security_events: 'warn',
        system_health: 'info',
        user_actions: 'info'
      },
      destinations: [
        { type: 'console', enabled: true, level: 'info' }
      ]
    }
  };
}

// Log levels with priorities
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
};

// Data pipeline event types
const DataPipelineEvents = {
  // Ingestion events
  DATA_SOURCE_CONNECTED: 'data_source_connected',
  DATA_SOURCE_DISCONNECTED: 'data_source_disconnected',
  DATA_EXTRACTION_STARTED: 'data_extraction_started',
  DATA_EXTRACTION_COMPLETED: 'data_extraction_completed',
  DATA_EXTRACTION_FAILED: 'data_extraction_failed',
  DATA_VALIDATION_STARTED: 'data_validation_started',
  DATA_VALIDATION_COMPLETED: 'data_validation_completed',
  DATA_VALIDATION_FAILED: 'data_validation_failed',
  
  // Analytics events
  QUERY_EXECUTED: 'query_executed',
  QUERY_FAILED: 'query_failed',
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  
  // Transformation events
  TRANSFORMATION_STARTED: 'transformation_started',
  TRANSFORMATION_COMPLETED: 'transformation_completed',
  TRANSFORMATION_FAILED: 'transformation_failed',
  MODEL_BUILD_STARTED: 'model_build_started',
  MODEL_BUILD_COMPLETED: 'model_build_completed',
  MODEL_BUILD_FAILED: 'model_build_failed',
  
  // Orchestration events
  PIPELINE_STARTED: 'pipeline_started',
  PIPELINE_COMPLETED: 'pipeline_completed',
  PIPELINE_FAILED: 'pipeline_failed',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  SCHEDULE_TRIGGERED: 'schedule_triggered',
  
  // Quality events
  QUALITY_CHECK_STARTED: 'quality_check_started',
  QUALITY_CHECK_PASSED: 'quality_check_passed',
  QUALITY_CHECK_FAILED: 'quality_check_failed',
  QUALITY_GATE_PASSED: 'quality_gate_passed',
  QUALITY_GATE_FAILED: 'quality_gate_failed',
  
  // Performance events
  PERFORMANCE_METRIC_COLLECTED: 'performance_metric_collected',
  PERFORMANCE_THRESHOLD_EXCEEDED: 'performance_threshold_exceeded',
  RESOURCE_USAGE_HIGH: 'resource_usage_high',
  
  // Publication events
  PUBLICATION_STARTED: 'publication_started',
  PUBLICATION_COMPLETED: 'publication_completed',
  PUBLICATION_FAILED: 'publication_failed',
  SITE_BUILD_STARTED: 'site_build_started',
  SITE_BUILD_COMPLETED: 'site_build_completed',
  SITE_BUILD_FAILED: 'site_build_failed',
  
  // System events
  SERVICE_HEALTH_CHECK: 'service_health_check',
  ALERT_TRIGGERED: 'alert_triggered',
  ALERT_RESOLVED: 'alert_resolved',
  MONITORING_STARTED: 'monitoring_started',
  MONITORING_STOPPED: 'monitoring_stopped'
};

// Log file setup
const LOG_DIR = path.join(__dirname, '../../logs');
const DATA_PIPELINE_LOG = path.join(LOG_DIR, 'data-pipeline.log');
const PERFORMANCE_LOG = path.join(LOG_DIR, 'performance.log');
const QUALITY_LOG = path.join(LOG_DIR, 'quality-assurance.log');

// Ensure log directory exists
fs.ensureDirSync(LOG_DIR);

// Correlation ID generation
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Global correlation tracking
let currentCorrelationId = null;

/**
 * Set correlation ID for request tracking
 * @param {string} correlationId - Correlation ID
 */
function setCorrelationId(correlationId) {
  currentCorrelationId = correlationId;
}

/**
 * Get current correlation ID
 * @returns {string} Current correlation ID
 */
function getCorrelationId() {
  return currentCorrelationId || generateCorrelationId();
}

/**
 * Check if log level should be output
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @returns {boolean} Whether to log
 */
function shouldLog(level, category) {
  const configLevel = monitoringConfig.logging?.categories?.[category] || 
                      monitoringConfig.logging?.level || 'info';
  
  return LOG_LEVELS[level] >= LOG_LEVELS[configLevel];
}

/**
 * Format structured log entry
 * @param {string} level - Log level
 * @param {string} event - Event type
 * @param {string} category - Log category
 * @param {Object} data - Event data
 * @param {Object} metadata - Additional metadata
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, event, category, data, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    event,
    category,
    correlationId: getCorrelationId(),
    component: metadata.component || 'unknown',
    duration: metadata.duration || null,
    success: metadata.success !== undefined ? metadata.success : null,
    ...data
  };
  
  // Add performance metrics if available
  if (metadata.performance) {
    entry.performance = metadata.performance;
  }
  
  // Add error details if present
  if (metadata.error) {
    entry.error = {
      message: metadata.error.message,
      stack: metadata.error.stack,
      code: metadata.error.code
    };
  }
  
  return monitoringConfig.logging?.structured ? 
    JSON.stringify(entry) + '\n' : 
    `[${entry.timestamp}] ${entry.level} ${event}: ${JSON.stringify(data)}\n`;
}

/**
 * Write log entry to appropriate destinations
 * @param {string} logEntry - Formatted log entry
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @param {string} logFile - Specific log file (optional)
 */
async function writeLogEntry(logEntry, level, category, logFile = null) {
  const destinations = monitoringConfig.logging?.destinations || [
    { type: 'console', enabled: true, level: 'info' }
  ];
  
  for (const dest of destinations) {
    if (!dest.enabled || LOG_LEVELS[level] < LOG_LEVELS[dest.level]) {
      continue;
    }
    
    try {
      switch (dest.type) {
        case 'console':
          console.log(logEntry.trim());
          break;
          
        case 'file':
          const filePath = logFile || dest.path || DATA_PIPELINE_LOG;
          await fs.appendFile(filePath, logEntry, 'utf8');
          break;
          
        default:
          // Other destinations can be implemented as needed
          break;
      }
    } catch (error) {
      console.error(`Failed to write log to ${dest.type}:`, error.message);
    }
  }
}

/**
 * Generic logging function
 * @param {string} level - Log level
 * @param {string} event - Event type
 * @param {string} category - Log category
 * @param {Object} data - Event data
 * @param {Object} metadata - Additional metadata
 * @param {string} logFile - Specific log file (optional)
 */
async function log(level, event, category, data, metadata = {}, logFile = null) {
  if (!shouldLog(level, category)) {
    return;
  }
  
  const logEntry = formatLogEntry(level, event, category, data, metadata);
  await writeLogEntry(logEntry, level, category, logFile);
  
  // Also log to security logger for critical events
  if (level === 'error' || level === 'critical') {
    securityLogger.logSecurityEvent(level.toUpperCase(), event, {
      category,
      correlationId: getCorrelationId(),
      ...data
    });
  }
}

/**
 * Data ingestion logging functions
 */
const ingestion = {
  sourceConnected: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_SOURCE_CONNECTED, 'data_ingestion', data, metadata),
  
  sourceDisconnected: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_SOURCE_DISCONNECTED, 'data_ingestion', data, metadata),
  
  extractionStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_EXTRACTION_STARTED, 'data_ingestion', data, metadata),
  
  extractionCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_EXTRACTION_COMPLETED, 'data_ingestion', data, { ...metadata, success: true }),
  
  extractionFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.DATA_EXTRACTION_FAILED, 'data_ingestion', data, { ...metadata, success: false }),
  
  validationStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_VALIDATION_STARTED, 'data_ingestion', data, metadata),
  
  validationCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.DATA_VALIDATION_COMPLETED, 'data_ingestion', data, { ...metadata, success: true }),
  
  validationFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.DATA_VALIDATION_FAILED, 'data_ingestion', data, { ...metadata, success: false })
};

/**
 * Analytics logging functions
 */
const analytics = {
  queryExecuted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.QUERY_EXECUTED, 'analytics', data, metadata),
  
  queryFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.QUERY_FAILED, 'analytics', data, { ...metadata, success: false }),
  
  analysisStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.ANALYSIS_STARTED, 'analytics', data, metadata),
  
  analysisCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.ANALYSIS_COMPLETED, 'analytics', data, { ...metadata, success: true }),
  
  analysisFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.ANALYSIS_FAILED, 'analytics', data, { ...metadata, success: false })
};

/**
 * Transformation logging functions
 */
const transformation = {
  started: (data, metadata = {}) => 
    log('info', DataPipelineEvents.TRANSFORMATION_STARTED, 'transformations', data, metadata),
  
  completed: (data, metadata = {}) => 
    log('info', DataPipelineEvents.TRANSFORMATION_COMPLETED, 'transformations', data, { ...metadata, success: true }),
  
  failed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.TRANSFORMATION_FAILED, 'transformations', data, { ...metadata, success: false }),
  
  modelBuildStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.MODEL_BUILD_STARTED, 'transformations', data, metadata),
  
  modelBuildCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.MODEL_BUILD_COMPLETED, 'transformations', data, { ...metadata, success: true }),
  
  modelBuildFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.MODEL_BUILD_FAILED, 'transformations', data, { ...metadata, success: false })
};

/**
 * Orchestration logging functions
 */
const orchestration = {
  pipelineStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.PIPELINE_STARTED, 'orchestration', data, metadata),
  
  pipelineCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.PIPELINE_COMPLETED, 'orchestration', data, { ...metadata, success: true }),
  
  pipelineFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.PIPELINE_FAILED, 'orchestration', data, { ...metadata, success: false }),
  
  taskStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.TASK_STARTED, 'orchestration', data, metadata),
  
  taskCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.TASK_COMPLETED, 'orchestration', data, { ...metadata, success: true }),
  
  taskFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.TASK_FAILED, 'orchestration', data, { ...metadata, success: false }),
  
  scheduleTriggered: (data, metadata = {}) => 
    log('info', DataPipelineEvents.SCHEDULE_TRIGGERED, 'orchestration', data, metadata)
};

/**
 * Quality assurance logging functions
 */
const quality = {
  checkStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.QUALITY_CHECK_STARTED, 'quality_gates', data, metadata, QUALITY_LOG),
  
  checkPassed: (data, metadata = {}) => 
    log('info', DataPipelineEvents.QUALITY_CHECK_PASSED, 'quality_gates', data, { ...metadata, success: true }, QUALITY_LOG),
  
  checkFailed: (data, metadata = {}) => 
    log('warn', DataPipelineEvents.QUALITY_CHECK_FAILED, 'quality_gates', data, { ...metadata, success: false }, QUALITY_LOG),
  
  gatePassed: (data, metadata = {}) => 
    log('info', DataPipelineEvents.QUALITY_GATE_PASSED, 'quality_gates', data, { ...metadata, success: true }, QUALITY_LOG),
  
  gateFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.QUALITY_GATE_FAILED, 'quality_gates', data, { ...metadata, success: false }, QUALITY_LOG)
};

/**
 * Performance logging functions
 */
const performance = {
  metricCollected: (data, metadata = {}) => 
    log('debug', DataPipelineEvents.PERFORMANCE_METRIC_COLLECTED, 'performance_metrics', data, metadata, PERFORMANCE_LOG),
  
  thresholdExceeded: (data, metadata = {}) => 
    log('warn', DataPipelineEvents.PERFORMANCE_THRESHOLD_EXCEEDED, 'performance_metrics', data, metadata, PERFORMANCE_LOG),
  
  resourceUsageHigh: (data, metadata = {}) => 
    log('warn', DataPipelineEvents.RESOURCE_USAGE_HIGH, 'system_health', data, metadata, PERFORMANCE_LOG)
};

/**
 * Publication logging functions
 */
const publication = {
  started: (data, metadata = {}) => 
    log('info', DataPipelineEvents.PUBLICATION_STARTED, 'publication', data, metadata),
  
  completed: (data, metadata = {}) => 
    log('info', DataPipelineEvents.PUBLICATION_COMPLETED, 'publication', data, { ...metadata, success: true }),
  
  failed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.PUBLICATION_FAILED, 'publication', data, { ...metadata, success: false }),
  
  siteBuildStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.SITE_BUILD_STARTED, 'publication', data, metadata),
  
  siteBuildCompleted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.SITE_BUILD_COMPLETED, 'publication', data, { ...metadata, success: true }),
  
  siteBuildFailed: (data, metadata = {}) => 
    log('error', DataPipelineEvents.SITE_BUILD_FAILED, 'publication', data, { ...metadata, success: false })
};

/**
 * System monitoring logging functions
 */
const system = {
  healthCheck: (data, metadata = {}) => 
    log('info', DataPipelineEvents.SERVICE_HEALTH_CHECK, 'system_health', data, metadata),
  
  alertTriggered: (data, metadata = {}) => 
    log('warn', DataPipelineEvents.ALERT_TRIGGERED, 'system_health', data, metadata),
  
  alertResolved: (data, metadata = {}) => 
    log('info', DataPipelineEvents.ALERT_RESOLVED, 'system_health', data, metadata),
  
  monitoringStarted: (data, metadata = {}) => 
    log('info', DataPipelineEvents.MONITORING_STARTED, 'system_health', data, metadata),
  
  monitoringStopped: (data, metadata = {}) => 
    log('info', DataPipelineEvents.MONITORING_STOPPED, 'system_health', data, metadata)
};

/**
 * Create a timed operation logger
 * @param {string} operation - Operation name
 * @param {string} category - Log category
 * @returns {Object} Timer object with start/end methods
 */
function createTimer(operation, category) {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  setCorrelationId(correlationId);
  
  return {
    correlationId,
    end: async (data = {}, success = true, error = null) => {
      const duration = Date.now() - startTime;
      const metadata = {
        component: operation,
        duration,
        success,
        error
      };
      
      await log(success ? 'info' : 'error', `${operation}_completed`, category, data, metadata);
      return duration;
    }
  };
}

/**
 * Get recent logs from a specific category
 * @param {string} category - Log category
 * @param {number} count - Number of entries to return
 * @returns {Promise<Array>} Recent log entries
 */
async function getRecentLogs(category, count = 100) {
  try {
    const logFile = category === 'quality_gates' ? QUALITY_LOG :
                    category === 'performance_metrics' ? PERFORMANCE_LOG :
                    DATA_PIPELINE_LOG;
    
    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.trim().split('\n');
    
    const logs = lines
      .filter(line => line.length > 0)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null && log.category === category);
    
    return logs.slice(-count);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Export the monitoring logger
 */
module.exports = {
  // Core functions
  log,
  setCorrelationId,
  getCorrelationId,
  createTimer,
  getRecentLogs,
  
  // Domain-specific loggers
  ingestion,
  analytics,
  transformation,
  orchestration,
  quality,
  performance,
  publication,
  system,
  
  // Constants
  DataPipelineEvents,
  LOG_LEVELS
};