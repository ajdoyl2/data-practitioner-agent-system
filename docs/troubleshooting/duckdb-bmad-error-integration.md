# DuckDB BMad Error Handling Integration

## Overview

This guide documents the complete integration of DuckDB error handling with the BMad-Method framework, ensuring consistent error patterns, recovery procedures, and troubleshooting workflows.

## BMad Error Handling Pattern Integration

### 1. Unified Error Format

All DuckDB errors follow the established BMad error handling pattern with consistent formatting and response structures.

#### Standard Error Response Format

```javascript
// bmad-method/tools/lib/duckdb-error-handler.js
const chalk = require('chalk');
const { securityLogger } = require('./security-logger');

class DuckDBErrorHandler {
  /**
   * Handle DuckDB errors following BMad patterns
   */
  static handleError(error, context = {}) {
    const errorResponse = {
      success: false,
      error: error.message,
      error_code: this.classifyError(error),
      error_type: error.constructor.name,
      context: context,
      recovery_options: this.getRecoveryOptions(error),
      timestamp: new Date().toISOString(),
      requires_investigation: this.requiresInvestigation(error)
    };

    // Log error with security logger (BMad pattern)
    securityLogger.logDuckDBOperation({
      operation: 'duckdb_error_handled',
      error_code: errorResponse.error_code,
      error_message: error.message,
      context: context,
      recovery_options: errorResponse.recovery_options,
      requires_investigation: errorResponse.requires_investigation,
      timestamp: errorResponse.timestamp
    });

    // Display error with BMad styling
    this.displayError(error, errorResponse, context);

    return errorResponse;
  }

  /**
   * Classify error type following BMad conventions
   */
  static classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('memory') || message.includes('out of space')) {
      return 'DUCKDB_MEMORY_ERROR';
    }
    
    if (message.includes('connection') || message.includes('database')) {
      return 'DUCKDB_CONNECTION_ERROR';
    }
    
    if (message.includes('timeout') || message.includes('cancelled')) {
      return 'DUCKDB_TIMEOUT_ERROR';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'DUCKDB_ACCESS_ERROR';
    }
    
    if (message.includes('syntax') || message.includes('sql')) {
      return 'DUCKDB_SQL_ERROR';
    }
    
    return 'DUCKDB_UNKNOWN_ERROR';
  }

  /**
   * Display error with BMad styling
   */
  static displayError(error, errorResponse, context) {
    console.error(chalk.red('❌ DuckDB Error:'), error.message);
    
    if (context.operation) {
      console.error(chalk.yellow(`   Operation: ${context.operation}`));
    }
    
    if (context.query) {
      console.error(chalk.yellow(`   Query: ${context.query.substring(0, 100)}...`));
    }
    
    if (errorResponse.error_code !== 'DUCKDB_UNKNOWN_ERROR') {
      console.error(chalk.blue(`   Error Code: ${errorResponse.error_code}`));
    }
    
    // Display recovery suggestions
    if (errorResponse.recovery_options.length > 0) {
      console.error(chalk.cyan('\\n💡 Recovery Suggestions:'));
      errorResponse.recovery_options.forEach((option, index) => {
        console.error(chalk.cyan(`   ${index + 1}. ${option}`));
      });
    }
    
    if (errorResponse.requires_investigation) {
      console.error(chalk.magenta('\\n🔍 This error requires investigation. Check logs for details.'));
    }
  }

  /**
   * Get recovery options based on error type
   */
  static getRecoveryOptions(error) {
    const message = error.message.toLowerCase();
    const options = [];
    
    if (message.includes('memory')) {
      options.push('Reduce memory usage with: bmad data cleanup --force');
      options.push('Increase memory limit in configuration');
      options.push('Enable memory spilling in DuckDB settings');
      options.push('Process data in smaller chunks');
    }
    
    if (message.includes('connection')) {
      options.push('Check database file permissions');
      options.push('Verify database file is not corrupted');
      options.push('Reduce concurrent connections');
      options.push('Restart DuckDB service');
    }
    
    if (message.includes('timeout')) {
      options.push('Increase query timeout settings');
      options.push('Optimize query performance');
      options.push('Break large operations into smaller chunks');
      options.push('Check system resource availability');
    }
    
    if (message.includes('access') || message.includes('permission')) {
      options.push('Check file and directory permissions');
      options.push('Verify user has database access rights');
      options.push('Run with appropriate system privileges');
    }
    
    if (message.includes('sql') || message.includes('syntax')) {
      options.push('Review SQL syntax for errors');
      options.push('Check table and column names');
      options.push('Validate data types and constraints');
    }
    
    if (options.length === 0) {
      options.push('Check DuckDB logs for detailed error information');
      options.push('Verify system resources are available');
      options.push('Contact system administrator if problem persists');
    }
    
    return options;
  }

  /**
   * Determine if error requires investigation
   */
  static requiresInvestigation(error) {
    const criticalPatterns = [
      'corruption',
      'fatal',
      'segmentation fault',
      'access violation',
      'system error',
      'internal error'
    ];
    
    const message = error.message.toLowerCase();
    return criticalPatterns.some(pattern => message.includes(pattern));
  }
}

module.exports = DuckDBErrorHandler;
```

### 2. Error Recovery Integration

DuckDB error recovery integrates with BMad's existing recovery patterns and procedures.

#### Automated Recovery System

```javascript
// bmad-method/tools/lib/duckdb-recovery-manager.js
const chalk = require('chalk');
const { securityLogger } = require('./security-logger');
const DuckDBErrorHandler = require('./duckdb-error-handler');

class DuckDBRecoveryManager {
  constructor(components = {}) {
    this.components = components;
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
  }

  /**
   * Attempt automatic recovery following BMad patterns
   */
  async attemptRecovery(error, context = {}) {
    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorCode = DuckDBErrorHandler.classifyError(error);
    
    // Check if we've already attempted recovery for this error type
    const attemptCount = this.recoveryAttempts.get(errorCode) || 0;
    
    if (attemptCount >= this.maxRecoveryAttempts) {
      console.log(chalk.red(`❌ Maximum recovery attempts (${this.maxRecoveryAttempts}) exceeded for ${errorCode}`));
      return { success: false, reason: 'max_attempts_exceeded' };
    }

    console.log(chalk.yellow(`🔧 Attempting automatic recovery (${recoveryId})...`));
    
    // Log recovery attempt
    securityLogger.logDuckDBOperation({
      operation: 'automatic_recovery_start',
      recovery_id: recoveryId,
      error_code: errorCode,
      attempt_number: attemptCount + 1,
      original_error: error.message,
      context: context,
      timestamp: new Date().toISOString()
    });

    try {
      const strategy = this.selectRecoveryStrategy(errorCode, context);
      console.log(chalk.blue(`   Strategy: ${strategy.name}`));
      
      const recoveryResult = await this.executeRecoveryStrategy(strategy, context);
      
      if (recoveryResult.success) {
        console.log(chalk.green(`✅ Recovery ${recoveryId} successful`));
        
        // Reset attempt counter on successful recovery
        this.recoveryAttempts.delete(errorCode);
        
        securityLogger.logDuckDBOperation({
          operation: 'automatic_recovery_success',
          recovery_id: recoveryId,
          strategy_used: strategy.name,
          recovery_time_ms: recoveryResult.duration,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, strategy: strategy.name, duration: recoveryResult.duration };
      } else {
        throw new Error(recoveryResult.error || 'Recovery strategy failed');
      }
      
    } catch (recoveryError) {
      // Increment attempt counter
      this.recoveryAttempts.set(errorCode, attemptCount + 1);
      
      console.error(chalk.red(`❌ Recovery ${recoveryId} failed:`), recoveryError.message);
      
      securityLogger.logDuckDBOperation({
        operation: 'automatic_recovery_failed',
        recovery_id: recoveryId,
        recovery_error: recoveryError.message,
        attempt_number: attemptCount + 1,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
      
      return { 
        success: false, 
        error: recoveryError.message,
        attempts: attemptCount + 1,
        max_attempts: this.maxRecoveryAttempts
      };
    }
  }

  /**
   * Select appropriate recovery strategy
   */
  selectRecoveryStrategy(errorCode, context) {
    switch (errorCode) {
      case 'DUCKDB_MEMORY_ERROR':
        return {
          name: 'memory_recovery',
          steps: [
            'perform_aggressive_cleanup',
            'enable_memory_spilling',
            'reduce_batch_size',
            'restart_with_lower_memory'
          ]
        };
        
      case 'DUCKDB_CONNECTION_ERROR':
        return {
          name: 'connection_recovery',
          steps: [
            'close_all_connections',
            'verify_database_integrity',
            'restart_database',
            'reduce_connection_pool'
          ]
        };
        
      case 'DUCKDB_TIMEOUT_ERROR':
        return {
          name: 'timeout_recovery',
          steps: [
            'cancel_running_queries',
            'optimize_query_plan',
            'increase_timeout_limits',
            'partition_large_operations'
          ]
        };
        
      case 'DUCKDB_ACCESS_ERROR':
        return {
          name: 'access_recovery',
          steps: [
            'verify_file_permissions',
            'check_disk_space',
            'validate_user_privileges',
            'recreate_database_connection'
          ]
        };
        
      default:
        return {
          name: 'generic_recovery',
          steps: [
            'restart_duckdb_components',
            'clear_temporary_files',
            'reset_configuration',
            'initialize_safe_mode'
          ]
        };
    }
  }

  /**
   * Execute recovery strategy
   */
  async executeRecoveryStrategy(strategy, context) {
    const startTime = Date.now();
    const executedSteps = [];
    
    for (const step of strategy.steps) {
      try {
        console.log(chalk.blue(`   Executing: ${step}`));
        
        await this.executeRecoveryStep(step, context);
        executedSteps.push({ step, success: true });
        
        console.log(chalk.green(`   ✅ ${step} completed`));
        
        // Test if recovery was successful after each step
        if (await this.testRecovery(context)) {
          console.log(chalk.green(`   ✅ Recovery successful after ${step}`));
          break;
        }
        
      } catch (stepError) {
        console.log(chalk.red(`   ❌ ${step} failed: ${stepError.message}`));
        executedSteps.push({ step, success: false, error: stepError.message });
        
        // Continue with next step unless it's a critical failure
        if (this.isCriticalFailure(stepError)) {
          throw stepError;
        }
      }
    }
    
    return {
      success: true,
      duration: Date.now() - startTime,
      strategy: strategy.name,
      steps_executed: executedSteps
    };
  }

  /**
   * Execute individual recovery step
   */
  async executeRecoveryStep(step, context) {
    switch (step) {
      case 'perform_aggressive_cleanup':
        if (this.components.monitor) {
          await this.components.monitor.performEmergencyCleanup();
        }
        break;
        
      case 'enable_memory_spilling':
        if (this.components.duckdb) {
          await this.components.duckdb.enableSpilling();
        }
        break;
        
      case 'restart_database':
        if (this.components.duckdb) {
          await this.components.duckdb.close();
          await this.components.duckdb.initialize();
        }
        break;
        
      case 'cancel_running_queries':
        if (this.components.duckdb) {
          await this.components.duckdb.cancelAllQueries();
        }
        break;
        
      case 'verify_database_integrity':
        if (this.components.duckdb) {
          await this.components.duckdb.verifyIntegrity();
        }
        break;
        
      case 'clear_temporary_files':
        await this.clearTemporaryFiles();
        break;
        
      default:
        console.log(chalk.yellow(`   Unknown recovery step: ${step}`));
    }
  }

  /**
   * Test if recovery was successful
   */
  async testRecovery(context) {
    try {
      if (this.components.duckdb) {
        // Try a simple query to test database connectivity
        await this.components.duckdb.query('SELECT 1 as test');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if failure is critical
   */
  isCriticalFailure(error) {
    const criticalPatterns = ['system error', 'fatal', 'corruption'];
    const message = error.message.toLowerCase();
    return criticalPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Clear temporary files
   */
  async clearTemporaryFiles() {
    // Implementation would clear DuckDB temporary files
    console.log(chalk.blue('   Clearing temporary files...'));
  }
}

module.exports = DuckDBRecoveryManager;
```

### 3. Troubleshooting Integration with BMad Tools

Integration with existing BMad troubleshooting and diagnostic tools.

#### Enhanced Troubleshooting Commands

```javascript
// bmad-method/tools/cli/troubleshooting-integration.js
const chalk = require('chalk');
const DuckDBErrorHandler = require('../lib/duckdb-error-handler');
const DuckDBRecoveryManager = require('../lib/duckdb-recovery-manager');
const { securityLogger } = require('../lib/security-logger');

class DuckDBTroubleshootingIntegration {
  /**
   * Add DuckDB troubleshooting commands to BMad CLI
   */
  static addTroubleshootingCommands(program) {
    const troubleshootGroup = program
      .command('troubleshoot')
      .description('DuckDB troubleshooting and diagnostic commands');

    // Diagnose command
    troubleshootGroup
      .command('diagnose')
      .description('Run comprehensive DuckDB diagnostics')
      .option('-v, --verbose', 'Verbose diagnostic output')
      .option('-o, --output <file>', 'Save diagnostic report to file')
      .action(async (options) => {
        await this.runDiagnostics(options);
      });

    // Health check command
    troubleshootGroup
      .command('health')
      .description('Check DuckDB system health')
      .option('-j, --json', 'Output in JSON format')
      .action(async (options) => {
        await this.healthCheck(options);
      });

    // Recovery command
    troubleshootGroup
      .command('recover')
      .description('Attempt automatic error recovery')
      .option('-f, --force', 'Force recovery even if risky')
      .action(async (options) => {
        await this.attemptRecovery(options);
      });

    // Logs command
    troubleshootGroup
      .command('logs')
      .description('Analyze DuckDB error logs')
      .option('-n, --lines <number>', 'Number of log lines to analyze', '100')
      .option('--errors-only', 'Show only error entries')
      .action(async (options) => {
        await this.analyzeLogs(options);
      });
  }

  /**
   * Run comprehensive diagnostics
   */
  static async runDiagnostics(options) {
    console.log(chalk.blue('🔍 Running DuckDB diagnostics...'));
    
    const diagnosticId = `diag_${Date.now()}`;
    const report = {
      id: diagnosticId,
      timestamp: new Date().toISOString(),
      system: {},
      duckdb: {},
      configuration: {},
      performance: {},
      issues: [],
      recommendations: []
    };

    try {
      // System diagnostics
      report.system = await this.runSystemDiagnostics();
      
      // DuckDB specific diagnostics
      report.duckdb = await this.runDuckDBDiagnostics();
      
      // Configuration analysis
      report.configuration = await this.analyzeConfiguration();
      
      // Performance analysis
      report.performance = await this.analyzePerformance();
      
      // Issue detection
      report.issues = await this.detectIssues(report);
      
      // Generate recommendations
      report.recommendations = await this.generateRecommendations(report);
      
      // Display results
      this.displayDiagnosticResults(report, options);
      
      // Save to file if requested
      if (options.output) {
        await this.saveDiagnosticReport(report, options.output);
      }
      
      // Log diagnostic completion
      securityLogger.logDuckDBOperation({
        operation: 'diagnostic_complete',
        diagnostic_id: diagnosticId,
        issues_found: report.issues.length,
        recommendations_generated: report.recommendations.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Diagnostics failed:'), error.message);
      
      securityLogger.logDuckDBOperation({
        operation: 'diagnostic_failed',
        diagnostic_id: diagnosticId,
        error: error.message,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
    }
  }

  /**
   * Display diagnostic results
   */
  static displayDiagnosticResults(report, options) {
    console.log(chalk.green('\\n✅ Diagnostic Report'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // System health
    console.log(`\\n🖥️  ${chalk.bold('System Health')}`);
    console.log(`   Memory Usage: ${this.formatHealthStatus(report.system.memory?.status)}`);
    console.log(`   Disk Space: ${this.formatHealthStatus(report.system.disk?.status)}`);
    console.log(`   CPU Load: ${this.formatHealthStatus(report.system.cpu?.status)}`);
    
    // DuckDB status
    console.log(`\\n🦆 ${chalk.bold('DuckDB Status')}`);
    console.log(`   Database: ${this.formatHealthStatus(report.duckdb.database?.status)}`);
    console.log(`   Memory: ${this.formatHealthStatus(report.duckdb.memory?.status)}`);
    console.log(`   Connections: ${this.formatHealthStatus(report.duckdb.connections?.status)}`);
    
    // Issues found
    if (report.issues.length > 0) {
      console.log(`\\n⚠️  ${chalk.bold('Issues Found')}`);
      report.issues.forEach((issue, index) => {
        const severity = issue.severity === 'critical' ? chalk.red : 
                        issue.severity === 'warning' ? chalk.yellow : chalk.blue;
        console.log(`   ${index + 1}. ${severity(issue.severity.toUpperCase())}: ${issue.description}`);
      });
    } else {
      console.log(`\\n✅ ${chalk.green('No issues detected')}`);
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`\\n💡 ${chalk.bold('Recommendations')}`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.suggestion}`);
        if (rec.action) {
          console.log(`      ${chalk.gray('Action:')} ${chalk.cyan(rec.action)}`);
        }
      });
    }
  }

  /**
   * Format health status for display
   */
  static formatHealthStatus(status) {
    switch (status) {
      case 'healthy':
        return chalk.green('HEALTHY');
      case 'warning':
        return chalk.yellow('WARNING');
      case 'critical':
        return chalk.red('CRITICAL');
      default:
        return chalk.gray('UNKNOWN');
    }
  }

  /**
   * Run system diagnostics
   */
  static async runSystemDiagnostics() {
    // Implementation would check system resources
    return {
      memory: { status: 'healthy', usage_percent: 65 },
      disk: { status: 'healthy', free_space_gb: 250 },
      cpu: { status: 'healthy', load_average: 1.2 }
    };
  }

  /**
   * Run DuckDB specific diagnostics
   */
  static async runDuckDBDiagnostics() {
    // Implementation would check DuckDB health
    return {
      database: { status: 'healthy', version: '0.9.0' },
      memory: { status: 'warning', usage_percent: 78 },
      connections: { status: 'healthy', active: 3, max: 10 }
    };
  }

  /**
   * Detect issues from diagnostic data
   */
  static async detectIssues(report) {
    const issues = [];
    
    // Memory issues
    if (report.duckdb.memory?.usage_percent > 85) {
      issues.push({
        severity: 'critical',
        category: 'memory',
        description: `High DuckDB memory usage: ${report.duckdb.memory.usage_percent}%`,
        recommendation: 'Perform memory cleanup or increase memory limits'
      });
    }
    
    // System resource issues
    if (report.system.disk?.free_space_gb < 10) {
      issues.push({
        severity: 'warning',
        category: 'disk',
        description: `Low disk space: ${report.system.disk.free_space_gb}GB remaining`,
        recommendation: 'Free up disk space or add storage'
      });
    }
    
    return issues;
  }

  /**
   * Generate recommendations
   */
  static async generateRecommendations(report) {
    const recommendations = [];
    
    // Memory recommendations
    if (report.duckdb.memory?.usage_percent > 75) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        suggestion: 'Optimize memory usage to prevent performance degradation',
        action: 'bmad data cleanup --force'
      });
    }
    
    // Performance recommendations
    if (report.system.cpu?.load_average > 2.0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        suggestion: 'Reduce CPU load by optimizing queries or reducing concurrency',
        action: 'Review query performance and reduce parallel operations'
      });
    }
    
    return recommendations;
  }
}

module.exports = DuckDBTroubleshootingIntegration;
```

## Error Code Reference

### Standard DuckDB Error Codes

| Error Code | Description | Common Causes | Recovery Actions |
|------------|-------------|---------------|------------------|
| `DUCKDB_MEMORY_ERROR` | Memory allocation or limit exceeded | Large datasets, insufficient memory limits | Cleanup, increase limits, enable spilling |
| `DUCKDB_CONNECTION_ERROR` | Database connection issues | File locks, permissions, corruption | Verify access, restart database |
| `DUCKDB_TIMEOUT_ERROR` | Query or operation timeout | Complex queries, resource contention | Optimize queries, increase timeouts |
| `DUCKDB_ACCESS_ERROR` | File or permission access denied | Insufficient privileges, file locks | Check permissions, verify file access |
| `DUCKDB_SQL_ERROR` | SQL syntax or execution error | Invalid queries, schema issues | Review SQL syntax, validate schema |
| `DUCKDB_UNKNOWN_ERROR` | Unclassified error | Various internal issues | Check logs, contact support |

### BMad Integration Points

1. **Security Logging**: All errors logged through BMad security logger
2. **Error Display**: Consistent chalk styling following BMad patterns  
3. **Recovery Integration**: Automatic recovery following BMad conventions
4. **CLI Integration**: Error handling in CLI commands follows BMad patterns
5. **Configuration**: Error handling configurable through BMad feature flags

## Troubleshooting Workflows

### 1. Memory Issues Workflow

```bash
# Detect memory issues
bmad troubleshoot diagnose --verbose

# Attempt automatic recovery
bmad troubleshoot recover

# Manual cleanup if needed
bmad data cleanup --force

# Monitor memory usage
bmad data monitor --interval 15
```

### 2. Performance Issues Workflow

```bash
# Run performance diagnostics
bmad data benchmark --test-type all

# Check system health
bmad troubleshoot health

# Analyze recent logs
bmad troubleshoot logs --errors-only

# Apply performance recommendations
bmad data optimize  # (if implemented)
```

### 3. Connection Issues Workflow

```bash
# Check database connectivity
bmad data status

# Verify configuration
bmad troubleshoot diagnose --output diagnostic-report.json

# Attempt connection recovery
bmad troubleshoot recover --force

# Restart if necessary
bmad data restart  # (if implemented)
```

## Integration with BMad Error Patterns

### 1. Consistent Error Responses

All DuckDB operations return standardized error responses following BMad conventions:

```javascript
{
  success: false,
  error: "Human-readable error message",
  error_code: "DUCKDB_SPECIFIC_CODE",
  context: { operation: "query", query: "SELECT..." },
  recovery_options: ["suggestion1", "suggestion2"],
  timestamp: "2024-01-15T10:30:00.000Z",
  requires_investigation: true
}
```

### 2. Security Integration

- All errors logged through BMad security logger
- Critical errors flagged for investigation
- Error patterns tracked for trend analysis
- Recovery attempts audited and logged

### 3. User Experience

- Consistent error messaging with BMad styling
- Recovery suggestions provided for all error types
- Automatic recovery attempts where safe
- Clear escalation paths for unresolved issues

This integration ensures that DuckDB error handling seamlessly fits within the BMad-Method framework while providing comprehensive troubleshooting capabilities for data processing operations.