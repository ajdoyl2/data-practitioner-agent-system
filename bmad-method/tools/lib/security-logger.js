/**
 * Security Logger
 * Audit logging for security events and monitoring
 */

const fs = require('fs-extra');
const path = require('path');

// Log file locations
const LOG_DIR = path.join(__dirname, '../../logs');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');
const AUDIT_LOG = path.join(LOG_DIR, 'audit.log');

// Ensure log directory exists
fs.ensureDirSync(LOG_DIR);

// Security event types
const SecurityEvents = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  PERMISSION_DENIED: 'permission_denied',
  FEATURE_FLAG_CHANGED: 'feature_flag_changed',
  ROLLBACK_INITIATED: 'rollback_initiated',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SECURITY_VIOLATION: 'security_violation',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_REVOKED: 'api_key_revoked',
  DATA_INGESTION: 'data_ingestion',
  PYTHON_EXECUTION: 'python_execution',
  API_REQUEST: 'api_request',
  API_ERROR: 'api_error',
  SERVICE_START: 'service_start',
  CONNECTION_REGISTRATION: 'connection_registration',
  CONNECTION_REMOVAL: 'connection_removal',
  CONNECTION_TEST: 'connection_test',
  CONNECTION_CLOSE: 'connection_close',
  CONNECTION_CLEANUP: 'connection_cleanup',
  CONNECTION_MANAGER_DESTROY: 'connection_manager_destroy',
  PYTHON_PACKAGE_INSTALL: 'python_package_install',
  PYTHON_VENV_CREATION: 'python_venv_creation'
};

/**
 * Format log entry
 * @param {string} level - Log level
 * @param {string} event - Event type
 * @param {Object} data - Event data
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, event, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data
  };
  
  return JSON.stringify(entry) + '\n';
}

/**
 * Write to log file
 * @param {string} logFile - Path to log file
 * @param {string} entry - Log entry
 */
async function writeLog(logFile, entry) {
  try {
    await fs.appendFile(logFile, entry, 'utf8');
  } catch (error) {
    console.error(`Failed to write to ${logFile}:`, error.message);
  }
}

/**
 * Log authentication success
 * @param {Object} data - Auth success data
 */
function logAuthSuccess(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.AUTH_SUCCESS, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log authentication failure
 * @param {Object} data - Auth failure data
 */
function logAuthFailure(data) {
  const entry = formatLogEntry('WARN', SecurityEvents.AUTH_FAILURE, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log permission denied
 * @param {Object} data - Permission denied data
 */
function logPermissionDenied(data) {
  const entry = formatLogEntry('WARN', SecurityEvents.PERMISSION_DENIED, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log feature flag change
 * @param {Object} data - Feature flag change data
 */
function logFeatureFlagChange(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.FEATURE_FLAG_CHANGED, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log rollback initiation
 * @param {Object} data - Rollback data
 */
function logRollbackInitiated(data) {
  const entry = formatLogEntry('WARN', SecurityEvents.ROLLBACK_INITIATED, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log external service error
 * @param {Object} data - Service error data
 */
function logExternalServiceError(data) {
  const entry = formatLogEntry('ERROR', SecurityEvents.EXTERNAL_SERVICE_ERROR, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log rate limit exceeded
 * @param {Object} data - Rate limit data
 */
function logRateLimitExceeded(data) {
  const entry = formatLogEntry('WARN', SecurityEvents.RATE_LIMIT_EXCEEDED, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log security violation
 * @param {Object} data - Violation data
 */
function logSecurityViolation(data) {
  const entry = formatLogEntry('ERROR', SecurityEvents.SECURITY_VIOLATION, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
  
  // Also log to console for immediate visibility
  console.error('SECURITY VIOLATION:', data);
}

/**
 * Log generic security event
 * @param {string} level - Log level
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
function logSecurityEvent(level, event, data) {
  const entry = formatLogEntry(level, event, data);
  writeLog(SECURITY_LOG, entry);
  
  // Critical events also go to audit log
  if (level === 'ERROR' || level === 'WARN') {
    writeLog(AUDIT_LOG, entry);
  }
}

/**
 * Log data ingestion operation
 * @param {Object} data - Data ingestion data
 */
function logDataIngestion(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.DATA_INGESTION, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log Python execution
 * @param {Object} data - Python execution data
 */
function logPythonExecution(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.PYTHON_EXECUTION, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log API request
 * @param {Object} data - API request data
 */
function logApiRequest(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.API_REQUEST, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log API error
 * @param {Object} data - API error data
 */
function logApiError(data) {
  const entry = formatLogEntry('ERROR', SecurityEvents.API_ERROR, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log service start
 * @param {Object} data - Service start data
 */
function logServiceStart(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.SERVICE_START, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log connection registration
 * @param {Object} data - Connection registration data
 */
function logConnectionRegistration(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.CONNECTION_REGISTRATION, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log connection removal
 * @param {Object} data - Connection removal data
 */
function logConnectionRemoval(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.CONNECTION_REMOVAL, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log connection test
 * @param {Object} data - Connection test data
 */
function logConnectionTest(data) {
  const level = data.success ? 'INFO' : 'WARN';
  const entry = formatLogEntry(level, SecurityEvents.CONNECTION_TEST, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log connection close
 * @param {Object} data - Connection close data
 */
function logConnectionClose(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.CONNECTION_CLOSE, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log connection cleanup
 * @param {Object} data - Connection cleanup data
 */
function logConnectionCleanup(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.CONNECTION_CLEANUP, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log connection manager destroy
 * @param {Object} data - Connection manager destroy data
 */
function logConnectionManagerDestroy(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.CONNECTION_MANAGER_DESTROY, data);
  writeLog(SECURITY_LOG, entry);
}

/**
 * Log Python package install
 * @param {Object} data - Python package install data
 */
function logPythonPackageInstall(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.PYTHON_PACKAGE_INSTALL, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Log Python virtual environment creation
 * @param {Object} data - Python venv creation data
 */
function logPythonVenvCreation(data) {
  const entry = formatLogEntry('INFO', SecurityEvents.PYTHON_VENV_CREATION, data);
  writeLog(SECURITY_LOG, entry);
  writeLog(AUDIT_LOG, entry);
}

/**
 * Get recent security events
 * @param {number} count - Number of events to retrieve
 * @param {string} eventType - Optional event type filter
 * @returns {Promise<Array>} Recent events
 */
async function getRecentEvents(count = 100, eventType = null) {
  try {
    const content = await fs.readFile(SECURITY_LOG, 'utf8');
    const lines = content.trim().split('\n');
    
    let events = lines
      .filter(line => line.length > 0)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(event => event !== null);
    
    // Filter by event type if specified
    if (eventType) {
      events = events.filter(event => event.event === eventType);
    }
    
    // Return most recent events
    return events.slice(-count);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // No log file yet
    }
    throw error;
  }
}

/**
 * Analyze security events for patterns
 * @param {number} timeWindowMinutes - Time window to analyze
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeSecurityEvents(timeWindowMinutes = 60) {
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const events = await getRecentEvents(10000); // Get many events
  
  // Filter to time window
  const recentEvents = events.filter(event => 
    new Date(event.timestamp) > cutoffTime
  );
  
  // Analyze patterns
  const analysis = {
    timeWindow: timeWindowMinutes,
    totalEvents: recentEvents.length,
    byType: {},
    byLevel: {},
    failurePatterns: {},
    suspiciousActivity: []
  };
  
  // Count by type and level
  recentEvents.forEach(event => {
    analysis.byType[event.event] = (analysis.byType[event.event] || 0) + 1;
    analysis.byLevel[event.level] = (analysis.byLevel[event.level] || 0) + 1;
    
    // Track failure patterns
    if (event.event === SecurityEvents.AUTH_FAILURE) {
      const key = event.ip || 'unknown';
      analysis.failurePatterns[key] = (analysis.failurePatterns[key] || 0) + 1;
    }
  });
  
  // Detect suspicious patterns
  Object.entries(analysis.failurePatterns).forEach(([ip, count]) => {
    if (count > 5) {
      analysis.suspiciousActivity.push({
        type: 'excessive_auth_failures',
        ip,
        count,
        severity: count > 10 ? 'high' : 'medium'
      });
    }
  });
  
  return analysis;
}

/**
 * Rotate log files
 * @param {number} maxSizeMB - Maximum size before rotation
 * @param {number} maxFiles - Maximum number of archived files
 */
async function rotateLogs(maxSizeMB = 10, maxFiles = 5) {
  const logs = [SECURITY_LOG, AUDIT_LOG];
  
  for (const logFile of logs) {
    try {
      const stats = await fs.stat(logFile);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB > maxSizeMB) {
        // Rotate the log
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `${logFile}.${timestamp}`;
        
        await fs.move(logFile, archiveName);
        
        // Clean up old archives
        const dir = path.dirname(logFile);
        const base = path.basename(logFile);
        const archives = (await fs.readdir(dir))
          .filter(f => f.startsWith(base + '.'))
          .sort()
          .reverse();
        
        // Remove old archives
        for (let i = maxFiles; i < archives.length; i++) {
          await fs.remove(path.join(dir, archives[i]));
        }
        
        console.log(`Rotated log file: ${logFile}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to rotate ${logFile}:`, error.message);
      }
    }
  }
}

// Export the logger
const securityLogger = {
  logAuthSuccess,
  logAuthFailure,
  logPermissionDenied,
  logFeatureFlagChange,
  logRollbackInitiated,
  logExternalServiceError,
  logRateLimitExceeded,
  logSecurityViolation,
  logSecurityEvent,
  logDataIngestion,
  logPythonExecution,
  logApiRequest,
  logApiError,
  logServiceStart,
  logConnectionRegistration,
  logConnectionRemoval,
  logConnectionTest,
  logConnectionClose,
  logConnectionCleanup,
  logConnectionManagerDestroy,
  logPythonPackageInstall,
  logPythonVenvCreation,
  getRecentEvents,
  analyzeSecurityEvents,
  rotateLogs
};

// Export all functions and constants
module.exports = {
  securityLogger,
  SecurityEvents,
  logAuthSuccess,
  logAuthFailure,
  logPermissionDenied,
  logFeatureFlagChange,
  logRollbackInitiated,
  logExternalServiceError,
  logRateLimitExceeded,
  logSecurityViolation,
  logSecurityEvent,
  logDataIngestion,
  logPythonExecution,
  logApiRequest,
  logApiError,
  logServiceStart,
  logConnectionRegistration,
  logConnectionRemoval,
  logConnectionTest,
  logConnectionClose,
  logConnectionCleanup,
  logConnectionManagerDestroy,
  logPythonPackageInstall,
  logPythonVenvCreation,
  getRecentEvents,
  analyzeSecurityEvents,
  rotateLogs
};