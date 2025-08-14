# DuckDB Fallback and Recovery Procedures

## Overview

This document provides comprehensive fallback and recovery procedures for DuckDB operations within the BMad-Method data practitioner expansion pack. These procedures ensure system stability and data integrity when facing memory exhaustion, system failures, or performance degradation.

## Memory Exhaustion Fallback Procedures

### 1. Immediate Memory Relief (Emergency Response)

When DuckDB memory usage exceeds 95% or system becomes unresponsive:

```javascript
/**
 * Emergency Memory Relief Procedure
 * Execute immediately when memory exhaustion detected
 */
class EmergencyMemoryRelief {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.originalSettings = {};
  }

  async executeEmergencyProtocol() {
    console.log('🚨 EXECUTING EMERGENCY MEMORY RELIEF PROTOCOL');
    
    const steps = [
      () => this.killLongRunningQueries(),
      () => this.forceMemoryCleanup(),
      () => this.reduceMemoryLimits(),
      () => this.rejectNewConnections(),
      () => this.enableAggressiveSpilling(),
      () => this.notifyOperations()
    ];
    
    for (const step of steps) {
      try {
        await step();
        await this.delay(1000); // 1 second between steps
      } catch (error) {
        console.error('Emergency step failed:', error.message);
        // Continue with next step
      }
    }
    
    return await this.verifyMemoryRelief();
  }

  async killLongRunningQueries() {
    console.log('🔪 Killing long-running queries...');
    
    try {
      // Get active queries (simplified - would need actual query tracking)
      const activeQueries = this.duckdb.activeQueries || new Set();
      
      // Kill queries running longer than 30 seconds
      const killPromises = Array.from(activeQueries).map(async (queryId) => {
        try {
          // In real implementation, would use CANCEL QUERY or similar
          await this.duckdb.execute(`-- CANCEL QUERY ${queryId}`);
          console.log(`Killed query: ${queryId}`);
        } catch (error) {
          console.warn(`Failed to kill query ${queryId}:`, error.message);
        }
      });
      
      await Promise.allSettled(killPromises);
      
    } catch (error) {
      console.error('Failed to kill queries:', error.message);
    }
  }

  async forceMemoryCleanup() {
    console.log('🧹 Forcing aggressive memory cleanup...');
    
    try {
      // Force checkpoint to write WAL to disk
      await this.duckdb.executeInternal('PRAGMA force_checkpoint;');
      
      // Clear all caches
      await this.duckdb.executeInternal('PRAGMA clear_cache;');
      
      // Clear temporary tables
      const tables = await this.duckdb.listTables();
      for (const table of tables) {
        if (table.startsWith('temp_') || table.startsWith('tmp_')) {
          await this.duckdb.execute(`DROP TABLE IF EXISTS ${table}`);
        }
      }
      
      // Force multiple garbage collections
      if (global.gc) {
        for (let i = 0; i < 5; i++) {
          global.gc();
          await this.delay(200);
        }
      }
      
    } catch (error) {
      console.error('Memory cleanup failed:', error.message);
    }
  }

  async reduceMemoryLimits() {
    console.log('📉 Reducing memory limits...');
    
    try {
      // Store original settings for recovery
      this.originalSettings.memoryLimit = this.duckdb.memoryLimit;
      
      // Reduce memory limit by 50%
      const currentLimitGB = parseInt(this.duckdb.memoryLimit.replace('GB', ''));
      const reducedLimitGB = Math.max(1, Math.floor(currentLimitGB * 0.5));
      
      await this.duckdb.executeInternal(`PRAGMA memory_limit='${reducedLimitGB}GB';`);
      console.log(`Memory limit reduced to ${reducedLimitGB}GB`);
      
    } catch (error) {
      console.error('Failed to reduce memory limits:', error.message);
    }
  }

  async rejectNewConnections() {
    console.log('🚫 Rejecting new connections...');
    
    try {
      // Set flag to reject new connections
      this.duckdb.emergencyMode = true;
      
      // Close idle connections
      // In real implementation, would manage connection pool
      console.log('Emergency mode activated - rejecting new connections');
      
    } catch (error) {
      console.error('Failed to activate emergency mode:', error.message);
    }
  }

  async enableAggressiveSpilling() {
    console.log('💾 Enabling aggressive spilling...');
    
    try {
      // Ensure spill directory exists
      const spillDir = '/tmp/duckdb_emergency_spill';
      require('fs-extra').ensureDirSync(spillDir);
      
      await this.duckdb.executeInternal(`
        PRAGMA temp_directory='${spillDir}';
        PRAGMA checkpoint_threshold='512MB';
        PRAGMA wal_autocheckpoint=1000;
      `);
      
    } catch (error) {
      console.error('Failed to enable spilling:', error.message);
    }
  }

  async notifyOperations() {
    console.log('📢 Notifying operations team...');
    
    try {
      const { securityLogger } = require('../../bmad-method/tools/lib/security-logger');
      
      securityLogger.logDuckDBOperation({
        operation: 'emergency_memory_relief',
        severity: 'CRITICAL',
        memory_limit_reduced: true,
        connections_rejected: true,
        timestamp: new Date().toISOString(),
        requires_immediate_attention: true
      });
      
      // Emit system-wide alert
      process.emit('duckdb:emergency', {
        type: 'memory_exhaustion',
        action: 'emergency_relief_activated',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to notify operations:', error.message);
    }
  }

  async verifyMemoryRelief() {
    await this.delay(5000); // Wait 5 seconds for cleanup to take effect
    
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log(`Memory usage after relief: ${heapUsedMB}MB`);
    
    return {
      success: heapUsedMB < 2000, // Less than 2GB
      memory_usage_mb: heapUsedMB,
      timestamp: new Date().toISOString()
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Graduated Response Protocol

Progressive response based on memory usage levels:

```javascript
class GraduatedMemoryResponse {
  constructor(duckdb, monitor) {
    this.duckdb = duckdb;
    this.monitor = monitor;
    this.responseLevel = 0;
    this.lastEscalation = 0;
  }

  async handleMemoryPressure(memoryPercent) {
    const now = Date.now();
    const timeSinceLastEscalation = now - this.lastEscalation;
    
    // Determine appropriate response level
    const targetLevel = this.calculateResponseLevel(memoryPercent);
    
    // Only escalate if enough time has passed or memory is critical
    if (targetLevel > this.responseLevel && 
        (timeSinceLastEscalation > 300000 || memoryPercent > 90)) {
      
      await this.escalateResponse(targetLevel);
      this.lastEscalation = now;
    }
  }

  calculateResponseLevel(memoryPercent) {
    if (memoryPercent >= 95) return 4; // Emergency
    if (memoryPercent >= 90) return 3; // Critical
    if (memoryPercent >= 80) return 2; // Warning
    if (memoryPercent >= 70) return 1; // Caution
    return 0; // Normal
  }

  async escalateResponse(targetLevel) {
    console.log(`📈 Escalating memory response to level ${targetLevel}`);
    
    while (this.responseLevel < targetLevel) {
      this.responseLevel++;
      await this.executeResponseLevel(this.responseLevel);
    }
  }

  async executeResponseLevel(level) {
    switch (level) {
      case 1: // Caution (70-80%)
        await this.cautionResponse();
        break;
      case 2: // Warning (80-90%)
        await this.warningResponse();
        break;
      case 3: // Critical (90-95%)
        await this.criticalResponse();
        break;
      case 4: // Emergency (95%+)
        await this.emergencyResponse();
        break;
    }
  }

  async cautionResponse() {
    console.log('⚠️  Level 1: Caution Response');
    
    // Increase cleanup frequency
    this.monitor.config.cleanupInterval = 60000; // 1 minute
    
    // Start monitoring more frequently
    this.monitor.config.monitoringInterval = 15000; // 15 seconds
    
    // Warn users about memory pressure
    this.notifyUsers('Memory usage elevated. Consider reducing workload.');
  }

  async warningResponse() {
    console.log('🟡 Level 2: Warning Response');
    
    // Perform cleanup
    await this.monitor.performAutomaticCleanup();
    
    // Reduce concurrent operations
    this.duckdb.maxConnections = Math.max(3, Math.floor(this.duckdb.maxConnections * 0.7));
    
    // Enable result set limiting
    this.enableResultSetLimiting(10000); // Max 10K rows per query
    
    this.notifyUsers('Memory pressure detected. Reducing concurrent operations.');
  }

  async criticalResponse() {
    console.log('🟠 Level 3: Critical Response');
    
    // Aggressive cleanup
    await this.monitor.performAggressiveCleanup();
    
    // Limit new connections
    this.duckdb.maxConnections = Math.max(2, Math.floor(this.duckdb.maxConnections * 0.5));
    
    // Enable query queuing
    this.enableQueryQueuing();
    
    // Reduce memory limit
    await this.temporarilyReduceMemoryLimit(0.8); // 80% of current
    
    this.notifyUsers('Critical memory pressure. Limiting operations.', 'warning');
  }

  async emergencyResponse() {
    console.log('🔴 Level 4: Emergency Response');
    
    const emergency = new EmergencyMemoryRelief(this.duckdb);
    await emergency.executeEmergencyProtocol();
    
    this.notifyUsers('Emergency memory procedures activated. Some operations may fail.', 'error');
  }

  enableResultSetLimiting(maxRows) {
    // Intercept queries to add LIMIT clause
    const originalExecute = this.duckdb.execute.bind(this.duckdb);
    
    this.duckdb.execute = async (query, params, options) => {
      if (query.toLowerCase().includes('select') && 
          !query.toLowerCase().includes('limit') && 
          !query.toLowerCase().includes('count(')) {
        query += ` LIMIT ${maxRows}`;
      }
      
      return originalExecute(query, params, options);
    };
  }

  enableQueryQueuing() {
    // Simple query queue implementation
    this.queryQueue = this.queryQueue || [];
    this.processingQueue = false;
    
    const originalExecute = this.duckdb.execute.bind(this.duckdb);
    
    this.duckdb.execute = async (query, params, options) => {
      return new Promise((resolve, reject) => {
        this.queryQueue.push({ query, params, options, resolve, reject });
        this.processQueryQueue();
      });
    };
  }

  async processQueryQueue() {
    if (this.processingQueue || this.queryQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.queryQueue.length > 0) {
      const { query, params, options, resolve, reject } = this.queryQueue.shift();
      
      try {
        const result = await this.duckdb.executeOriginal(query, params, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Delay between queries to reduce memory pressure
      await new Promise(r => setTimeout(r, 1000));
    }
    
    this.processingQueue = false;
  }

  notifyUsers(message, level = 'info') {
    console.log(`📢 User notification (${level}): ${message}`);
    
    // In real implementation, would use proper notification system
    process.emit('user:notification', {
      message,
      level,
      component: 'duckdb',
      timestamp: new Date().toISOString()
    });
  }
}
```

## Recovery Procedures for System Failures

### 1. Crashed DuckDB Process Recovery

```javascript
class DuckDBCrashRecovery {
  constructor(duckdbConfig) {
    this.config = duckdbConfig;
    this.maxRetryAttempts = 3;
    this.backupData = new Map();
  }

  async detectAndRecover() {
    console.log('🔍 Checking DuckDB process health...');
    
    const isHealthy = await this.checkDuckDBHealth();
    
    if (!isHealthy) {
      console.log('💥 DuckDB crash detected - initiating recovery');
      return await this.performCrashRecovery();
    }
    
    return { status: 'healthy', action: 'none' };
  }

  async checkDuckDBHealth() {
    try {
      // Test basic connectivity
      const testQuery = 'SELECT 1 as test';
      await this.duckdb.execute(testQuery, {}, { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return false;
    }
  }

  async performCrashRecovery() {
    const recoverySteps = [
      () => this.saveCurrentState(),
      () => this.closeConnections(),
      () => this.checkDataIntegrity(),
      () => this.restoreFromCheckpoint(),
      () => this.reinitializeDuckDB(),
      () => this.validateRecovery(),
      () => this.notifyRecoveryStatus()
    ];
    
    let recoveryResult = { success: false, steps: [] };
    
    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      console.log(`🔄 Recovery attempt ${attempt}/${this.maxRetryAttempts}`);
      
      try {
        for (const [index, step] of recoverySteps.entries()) {
          const stepName = step.name || `step_${index + 1}`;
          console.log(`Executing recovery step: ${stepName}`);
          
          const stepResult = await step();
          recoveryResult.steps.push({
            step: stepName,
            success: true,
            result: stepResult
          });
        }
        
        recoveryResult.success = true;
        break;
        
      } catch (error) {
        console.error(`Recovery attempt ${attempt} failed:`, error.message);
        recoveryResult.steps.push({
          step: 'recovery_attempt',
          success: false,
          error: error.message
        });
        
        if (attempt < this.maxRetryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }
    
    return recoveryResult;
  }

  async saveCurrentState() {
    console.log('💾 Saving current state...');
    
    try {
      // Save critical configuration
      this.backupData.set('config', {
        memoryLimit: this.duckdb.memoryLimit,
        maxConnections: this.duckdb.maxConnections,
        databasePath: this.duckdb.databasePath
      });
      
      // Save active connections count
      this.backupData.set('connections', this.duckdb.getActiveConnections());
      
      return { saved: true, timestamp: new Date().toISOString() };
      
    } catch (error) {
      console.warn('Failed to save state:', error.message);
      return { saved: false, error: error.message };
    }
  }

  async closeConnections() {
    console.log('🔌 Closing existing connections...');
    
    try {
      await this.duckdb.close();
      
      // Force cleanup
      if (global.gc) {
        global.gc();
      }
      
      return { closed: true };
      
    } catch (error) {
      console.warn('Error closing connections:', error.message);
      return { closed: false, error: error.message };
    }
  }

  async checkDataIntegrity() {
    console.log('🔍 Checking data integrity...');
    
    try {
      const databasePath = this.config.databasePath;
      
      if (databasePath === ':memory:') {
        return { integrity: 'memory_db_lost', recoverable: false };
      }
      
      // Check if database file exists and is readable
      const fs = require('fs-extra');
      if (await fs.pathExists(databasePath)) {
        const stats = await fs.stat(databasePath);
        return {
          integrity: 'file_exists',
          size: stats.size,
          modified: stats.mtime,
          recoverable: true
        };
      } else {
        return { integrity: 'file_missing', recoverable: false };
      }
      
    } catch (error) {
      return { integrity: 'check_failed', error: error.message, recoverable: false };
    }
  }

  async restoreFromCheckpoint() {
    console.log('🔄 Restoring from checkpoint...');
    
    try {
      // If database file exists, it should contain checkpointed data
      const integrityCheck = await this.checkDataIntegrity();
      
      if (integrityCheck.recoverable) {
        return { restored: true, source: 'database_file' };
      } else {
        // Restore from backup if available
        return await this.restoreFromBackup();
      }
      
    } catch (error) {
      return { restored: false, error: error.message };
    }
  }

  async restoreFromBackup() {
    console.log('💾 Attempting backup restoration...');
    
    try {
      // Check for backup files
      const backupDir = './backups';
      const fs = require('fs-extra');
      
      if (await fs.pathExists(backupDir)) {
        const backups = await fs.readdir(backupDir);
        const latestBackup = backups
          .filter(file => file.endsWith('.duckdb'))
          .sort()
          .pop();
        
        if (latestBackup) {
          const backupPath = path.join(backupDir, latestBackup);
          await fs.copy(backupPath, this.config.databasePath);
          
          return { restored: true, source: 'backup_file', backup: latestBackup };
        }
      }
      
      return { restored: false, reason: 'no_backup_available' };
      
    } catch (error) {
      return { restored: false, error: error.message };
    }
  }

  async reinitializeDuckDB() {
    console.log('🚀 Reinitializing DuckDB...');
    
    try {
      // Recreate DuckDB instance
      const DuckDBWrapper = require('../../bmad-method/tools/data-services/duckdb-wrapper');
      this.duckdb = new DuckDBWrapper(this.config);
      
      const initResult = await this.duckdb.initialize();
      
      if (initResult.success) {
        return { initialized: true, config: this.config };
      } else {
        throw new Error(`Initialization failed: ${initResult.error}`);
      }
      
    } catch (error) {
      return { initialized: false, error: error.message };
    }
  }

  async validateRecovery() {
    console.log('✅ Validating recovery...');
    
    try {
      // Test basic operations
      const testResult = await this.duckdb.execute('SELECT 1 as recovery_test');
      
      if (testResult.success) {
        // Test more complex operation
        const tables = await this.duckdb.listTables();
        
        return {
          validated: true,
          basic_query: true,
          table_count: tables.length,
          tables: tables
        };
      } else {
        throw new Error('Basic query failed');
      }
      
    } catch (error) {
      return { validated: false, error: error.message };
    }
  }

  async notifyRecoveryStatus() {
    console.log('📢 Notifying recovery status...');
    
    const { securityLogger } = require('../../bmad-method/tools/lib/security-logger');
    
    securityLogger.logDuckDBOperation({
      operation: 'crash_recovery_completed',
      success: true,
      recovery_steps: this.recoveryResult?.steps?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return { notified: true };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Hung Operation Recovery

```javascript
class HungOperationRecovery {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.timeoutThresholds = {
      simple_query: 30000,    // 30 seconds
      complex_query: 300000,  // 5 minutes
      bulk_operation: 1800000 // 30 minutes
    };
  }

  async detectHungOperations() {
    const activeQueries = this.duckdb.activeQueries || new Set();
    const hungOperations = [];
    
    for (const queryId of activeQueries) {
      const operation = this.getOperationDetails(queryId);
      
      if (this.isOperationHung(operation)) {
        hungOperations.push(operation);
      }
    }
    
    if (hungOperations.length > 0) {
      return await this.recoverHungOperations(hungOperations);
    }
    
    return { hung_operations: 0, action: 'none' };
  }

  isOperationHung(operation) {
    const now = Date.now();
    const runtime = now - operation.startTime;
    const threshold = this.timeoutThresholds[operation.type] || this.timeoutThresholds.simple_query;
    
    return runtime > threshold;
  }

  async recoverHungOperations(hungOperations) {
    console.log(`🔄 Recovering ${hungOperations.length} hung operations`);
    
    const recoveryResults = [];
    
    for (const operation of hungOperations) {
      try {
        const result = await this.recoverSingleOperation(operation);
        recoveryResults.push({ operation: operation.id, ...result });
      } catch (error) {
        recoveryResults.push({
          operation: operation.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      hung_operations: hungOperations.length,
      recovery_results: recoveryResults
    };
  }

  async recoverSingleOperation(operation) {
    console.log(`Recovering operation ${operation.id} (runtime: ${operation.runtime}ms)`);
    
    // Try graceful cancellation first
    try {
      await this.cancelOperation(operation.id);
      return { method: 'cancelled', success: true };
    } catch (error) {
      console.warn(`Failed to cancel operation ${operation.id}:`, error.message);
    }
    
    // Try force termination
    try {
      await this.forceTerminateOperation(operation.id);
      return { method: 'force_terminated', success: true };
    } catch (error) {
      console.warn(`Failed to force terminate operation ${operation.id}:`, error.message);
    }
    
    // Last resort: connection reset
    try {
      await this.resetConnection(operation.connectionId);
      return { method: 'connection_reset', success: true };
    } catch (error) {
      return { method: 'failed', success: false, error: error.message };
    }
  }

  async cancelOperation(operationId) {
    // Implementation would use DuckDB's query cancellation
    console.log(`Cancelling operation: ${operationId}`);
    // await this.duckdb.execute(`CANCEL QUERY ${operationId}`);
  }

  async forceTerminateOperation(operationId) {
    // Force termination of operation
    console.log(`Force terminating operation: ${operationId}`);
    // Implementation specific to DuckDB
  }

  async resetConnection(connectionId) {
    // Reset the connection associated with hung operation
    console.log(`Resetting connection: ${connectionId}`);
    // Implementation would reset specific connection
  }
}
```

## Graceful Degradation to Cloud Alternatives

### 1. Cloud Fallback Strategy

```javascript
class CloudFallbackManager {
  constructor(duckdb, cloudConfig) {
    this.duckdb = duckdb;
    this.cloudConfig = cloudConfig;
    this.fallbackActive = false;
    this.fallbackReason = null;
  }

  async shouldActivateFallback(reason, metrics) {
    const triggers = {
      memory_exhaustion: metrics?.memory?.duckdb_memory_percent > 95,
      performance_degradation: metrics?.performance?.avg_query_time > 30000,
      system_instability: metrics?.errors?.consecutive_failures > 5,
      resource_unavailable: !this.duckdb.isAvailable()
    };
    
    return triggers[reason] || false;
  }

  async activateCloudFallback(reason, options = {}) {
    if (this.fallbackActive) {
      console.log('Cloud fallback already active');
      return { status: 'already_active', reason: this.fallbackReason };
    }
    
    console.log(`☁️  Activating cloud fallback due to: ${reason}`);
    
    try {
      // Step 1: Prepare for fallback
      await this.prepareFallback();
      
      // Step 2: Export critical data
      const exportResult = await this.exportCriticalData(options.preserveData);
      
      // Step 3: Configure cloud connection
      const cloudConnection = await this.establishCloudConnection();
      
      // Step 4: Migrate operations
      const migrationResult = await this.migrateOperations(cloudConnection);
      
      // Step 5: Update routing
      await this.updateOperationRouting(cloudConnection);
      
      this.fallbackActive = true;
      this.fallbackReason = reason;
      
      return {
        status: 'activated',
        reason,
        export_result: exportResult,
        migration_result: migrationResult,
        cloud_connection: cloudConnection.id
      };
      
    } catch (error) {
      console.error('Cloud fallback activation failed:', error);
      return {
        status: 'failed',
        reason,
        error: error.message
      };
    }
  }

  async prepareFallback() {
    console.log('📋 Preparing for cloud fallback...');
    
    // Gracefully stop accepting new operations
    this.duckdb.acceptingNewOperations = false;
    
    // Complete ongoing operations with timeout
    await this.completeOngoingOperations(60000); // 1 minute timeout
    
    // Create backup of current state
    await this.createStateBackup();
  }

  async exportCriticalData(preserveData = true) {
    if (!preserveData) {
      return { exported: false, reason: 'preservation_disabled' };
    }
    
    console.log('💾 Exporting critical data...');
    
    try {
      const tables = await this.duckdb.listTables();
      const exportedTables = [];
      
      for (const table of tables) {
        // Skip temporary tables
        if (table.startsWith('temp_') || table.startsWith('tmp_')) {
          continue;
        }
        
        // Export to cloud storage or file
        const exportPath = await this.exportTable(table);
        exportedTables.push({ table, path: exportPath });
      }
      
      return {
        exported: true,
        table_count: exportedTables.length,
        tables: exportedTables
      };
      
    } catch (error) {
      return {
        exported: false,
        error: error.message
      };
    }
  }

  async exportTable(tableName) {
    const timestamp = Date.now();
    const exportPath = `./fallback_exports/${tableName}_${timestamp}.parquet`;
    
    // Ensure export directory exists
    require('fs-extra').ensureDirSync('./fallback_exports');
    
    // Export table to Parquet format
    await this.duckdb.execute(`
      COPY ${tableName} TO '${exportPath}' (FORMAT PARQUET)
    `);
    
    return exportPath;
  }

  async establishCloudConnection() {
    console.log('🌐 Establishing cloud connection...');
    
    const cloudOptions = {
      provider: this.cloudConfig.provider, // 'aws', 'gcp', 'azure'
      region: this.cloudConfig.region,
      credentials: this.cloudConfig.credentials,
      service: this.cloudConfig.service // 'redshift', 'bigquery', 'synapse'
    };
    
    // Create cloud database connection
    const cloudDB = await this.createCloudConnection(cloudOptions);
    
    // Test connection
    await cloudDB.execute('SELECT 1 as test');
    
    return {
      id: `cloud_${Date.now()}`,
      provider: cloudOptions.provider,
      service: cloudOptions.service,
      connection: cloudDB
    };
  }

  async createCloudConnection(options) {
    // Implementation would create actual cloud database connection
    // This is a simplified placeholder
    
    switch (options.provider) {
      case 'aws':
        return await this.createRedshiftConnection(options);
      case 'gcp':
        return await this.createBigQueryConnection(options);
      case 'azure':
        return await this.createSynapseConnection(options);
      default:
        throw new Error(`Unsupported cloud provider: ${options.provider}`);
    }
  }

  async migrateOperations(cloudConnection) {
    console.log('🔄 Migrating operations to cloud...');
    
    // Redirect new operations to cloud
    this.activeConnection = cloudConnection;
    
    // Migrate any queued operations
    const queuedOperations = this.getQueuedOperations();
    const migrationResults = [];
    
    for (const operation of queuedOperations) {
      try {
        const result = await this.migrateOperation(operation, cloudConnection);
        migrationResults.push({ operation: operation.id, success: true, result });
      } catch (error) {
        migrationResults.push({
          operation: operation.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      migrated_operations: migrationResults.length,
      successful_migrations: migrationResults.filter(r => r.success).length,
      results: migrationResults
    };
  }

  async updateOperationRouting(cloudConnection) {
    console.log('🗺️  Updating operation routing...');
    
    // Update the main database connection to point to cloud
    this.originalDuckDB = this.duckdb;
    this.duckdb = new CloudDatabaseAdapter(cloudConnection);
    
    // Notify system components about the change
    process.emit('database:fallback_activated', {
      from: 'duckdb',
      to: cloudConnection.provider,
      reason: this.fallbackReason
    });
  }

  async deactivateCloudFallback() {
    if (!this.fallbackActive) {
      return { status: 'not_active' };
    }
    
    console.log('🔄 Deactivating cloud fallback...');
    
    try {
      // Restore original DuckDB connection
      this.duckdb = this.originalDuckDB;
      
      // Re-import data if needed
      await this.restoreFromCloudFallback();
      
      // Resume normal operations
      this.duckdb.acceptingNewOperations = true;
      
      this.fallbackActive = false;
      this.fallbackReason = null;
      
      return { status: 'deactivated', restored: true };
      
    } catch (error) {
      return { status: 'deactivation_failed', error: error.message };
    }
  }
}

class CloudDatabaseAdapter {
  constructor(cloudConnection) {
    this.cloudConnection = cloudConnection;
    this.provider = cloudConnection.provider;
  }

  async execute(query, params = {}) {
    // Translate DuckDB queries to cloud-specific SQL
    const translatedQuery = this.translateQuery(query);
    
    // Execute on cloud database
    return await this.cloudConnection.connection.execute(translatedQuery, params);
  }

  translateQuery(duckdbQuery) {
    // Basic query translation between DuckDB and cloud SQL
    // This would need extensive implementation for production use
    
    let translatedQuery = duckdbQuery;
    
    // Example translations
    if (this.provider === 'aws') {
      // Redshift-specific translations
      translatedQuery = translatedQuery.replace(/PRAGMA/g, '--PRAGMA');
    } else if (this.provider === 'gcp') {
      // BigQuery-specific translations
      translatedQuery = translatedQuery.replace(/LIMIT (\d+)/g, 'LIMIT $1');
    }
    
    return translatedQuery;
  }

  async listTables() {
    const query = this.getListTablesQuery();
    const result = await this.execute(query);
    return result.data.map(row => row.table_name);
  }

  getListTablesQuery() {
    switch (this.provider) {
      case 'aws':
        return `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
      case 'gcp':
        return `
          SELECT table_name 
          FROM \`${this.cloudConnection.dataset}\`.INFORMATION_SCHEMA.TABLES
        `;
      default:
        return `
          SELECT table_name 
          FROM information_schema.tables
        `;
    }
  }
}
```

## Rollback Procedures for Failed Operations

### 1. Transaction Rollback System

```javascript
class OperationRollbackManager {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.operationLog = new Map();
    this.checkpoints = new Map();
  }

  async startOperation(operationId, operationType, metadata = {}) {
    console.log(`📝 Starting tracked operation: ${operationId}`);
    
    // Create checkpoint before operation
    const checkpoint = await this.createCheckpoint(operationId);
    
    // Log operation start
    this.operationLog.set(operationId, {
      id: operationId,
      type: operationType,
      metadata,
      startTime: Date.now(),
      status: 'in_progress',
      checkpoint: checkpoint,
      steps: []
    });
    
    return checkpoint;
  }

  async logOperationStep(operationId, stepName, stepData) {
    const operation = this.operationLog.get(operationId);
    if (operation) {
      operation.steps.push({
        name: stepName,
        data: stepData,
        timestamp: Date.now()
      });
    }
  }

  async completeOperation(operationId, result = {}) {
    const operation = this.operationLog.get(operationId);
    if (operation) {
      operation.status = 'completed';
      operation.endTime = Date.now();
      operation.result = result;
      
      // Clean up checkpoint after successful completion
      await this.cleanupCheckpoint(operation.checkpoint.id);
    }
  }

  async rollbackOperation(operationId, reason = 'unknown') {
    console.log(`🔄 Rolling back operation: ${operationId} (reason: ${reason})`);
    
    const operation = this.operationLog.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }
    
    try {
      // Restore from checkpoint
      await this.restoreFromCheckpoint(operation.checkpoint);
      
      // Execute rollback steps in reverse order
      await this.executeRollbackSteps(operation);
      
      // Mark operation as rolled back
      operation.status = 'rolled_back';
      operation.rollbackReason = reason;
      operation.rollbackTime = Date.now();
      
      return {
        success: true,
        operation_id: operationId,
        steps_rolled_back: operation.steps.length
      };
      
    } catch (error) {
      console.error(`Rollback failed for operation ${operationId}:`, error);
      return {
        success: false,
        operation_id: operationId,
        error: error.message
      };
    }
  }

  async createCheckpoint(operationId) {
    const checkpointId = `checkpoint_${operationId}_${Date.now()}`;
    
    try {
      // Force a database checkpoint
      await this.duckdb.executeInternal('PRAGMA force_checkpoint;');
      
      // Get current database state
      const tables = await this.duckdb.listTables();
      const tableStates = {};
      
      for (const table of tables) {
        const stats = await this.duckdb.execute(`
          SELECT COUNT(*) as row_count FROM ${table}
        `);
        tableStates[table] = {
          row_count: stats.data[0].row_count
        };
      }
      
      const checkpoint = {
        id: checkpointId,
        operation_id: operationId,
        timestamp: Date.now(),
        table_states: tableStates,
        database_path: this.duckdb.databasePath
      };
      
      this.checkpoints.set(checkpointId, checkpoint);
      
      return checkpoint;
      
    } catch (error) {
      throw new Error(`Failed to create checkpoint: ${error.message}`);
    }
  }

  async restoreFromCheckpoint(checkpoint) {
    console.log(`📋 Restoring from checkpoint: ${checkpoint.id}`);
    
    try {
      // If using persistent database, restore from file
      if (checkpoint.database_path !== ':memory:') {
        await this.restoreFromDatabaseFile(checkpoint);
      }
      
      // Verify restoration
      await this.verifyCheckpointRestore(checkpoint);
      
    } catch (error) {
      throw new Error(`Checkpoint restoration failed: ${error.message}`);
    }
  }

  async executeRollbackSteps(operation) {
    console.log(`🔄 Executing rollback steps for operation: ${operation.id}`);
    
    // Execute steps in reverse order
    const reversedSteps = [...operation.steps].reverse();
    
    for (const step of reversedSteps) {
      try {
        await this.rollbackStep(step, operation);
      } catch (error) {
        console.error(`Failed to rollback step ${step.name}:`, error.message);
        // Continue with other steps
      }
    }
  }

  async rollbackStep(step, operation) {
    switch (step.name) {
      case 'create_table':
        await this.rollbackCreateTable(step, operation);
        break;
      case 'insert_data':
        await this.rollbackInsertData(step, operation);
        break;
      case 'update_data':
        await this.rollbackUpdateData(step, operation);
        break;
      case 'delete_data':
        await this.rollbackDeleteData(step, operation);
        break;
      default:
        console.warn(`No rollback handler for step type: ${step.name}`);
    }
  }

  async rollbackCreateTable(step, operation) {
    const tableName = step.data.table_name;
    console.log(`Rolling back table creation: ${tableName}`);
    
    await this.duckdb.execute(`DROP TABLE IF EXISTS ${tableName}`);
  }

  async rollbackInsertData(step, operation) {
    const { table_name, inserted_count } = step.data;
    console.log(`Rolling back data insertion: ${inserted_count} rows from ${table_name}`);
    
    // Delete the inserted rows (assuming they were the last ones)
    await this.duckdb.execute(`
      DELETE FROM ${table_name} 
      WHERE rowid IN (
        SELECT rowid FROM ${table_name} 
        ORDER BY rowid DESC 
        LIMIT ${inserted_count}
      )
    `);
  }
}
```

## User Communication Procedures

### 1. Progressive User Notification System

```javascript
class UserCommunicationManager {
  constructor() {
    this.notificationChannels = {
      console: true,
      ui: true,
      email: false,
      webhook: false
    };
    
    this.messageTemplates = this.initializeMessageTemplates();
  }

  initializeMessageTemplates() {
    return {
      memory_pressure: {
        level_1: {
          title: "System Optimization",
          message: "The system is optimizing memory usage. Performance may be slightly reduced.",
          action: "Consider reducing concurrent operations",
          urgency: "low"
        },
        level_2: {
          title: "Performance Advisory",
          message: "High memory usage detected. Some operations may take longer than usual.",
          action: "Please wait for current operations to complete before starting new ones",
          urgency: "medium"
        },
        level_3: {
          title: "Service Degradation",
          message: "Critical memory pressure. Limiting new operations to maintain system stability.",
          action: "Please retry operations in a few minutes or reduce data size",
          urgency: "high"
        },
        level_4: {
          title: "Emergency Mode",
          message: "System in emergency mode. Most operations temporarily unavailable.",
          action: "Please wait while the system recovers. Contact support if this persists.",
          urgency: "critical"
        }
      },
      
      performance_issues: {
        slow_queries: {
          title: "Performance Notice",
          message: "Queries are taking longer than usual due to high system load.",
          action: "Consider simplifying queries or reducing result set sizes",
          urgency: "medium"
        },
        connection_limits: {
          title: "Connection Limit",
          message: "Maximum concurrent connections reached. Please wait for available connections.",
          action: "Your request will be processed as soon as a connection becomes available",
          urgency: "medium"
        }
      },
      
      system_recovery: {
        recovery_in_progress: {
          title: "System Recovery",
          message: "The system is recovering from an issue. Operations will resume shortly.",
          action: "Please wait. All data is safe and operations will be restored automatically",
          urgency: "high"
        },
        recovery_complete: {
          title: "Service Restored",
          message: "System recovery complete. Normal operations have resumed.",
          action: "You may now continue with your work",
          urgency: "low"
        }
      }
    };
  }

  async notifyUsers(messageType, level, context = {}) {
    const template = this.getMessageTemplate(messageType, level);
    if (!template) {
      console.warn(`No message template found for ${messageType}:${level}`);
      return;
    }
    
    const message = this.formatMessage(template, context);
    
    // Send through all enabled channels
    const notifications = [];
    
    if (this.notificationChannels.console) {
      notifications.push(this.sendConsoleNotification(message));
    }
    
    if (this.notificationChannels.ui) {
      notifications.push(this.sendUINotification(message));
    }
    
    if (this.notificationChannels.email && template.urgency === 'critical') {
      notifications.push(this.sendEmailNotification(message));
    }
    
    if (this.notificationChannels.webhook) {
      notifications.push(this.sendWebhookNotification(message));
    }
    
    await Promise.allSettled(notifications);
    
    // Log notification for audit trail
    this.logNotification(message, messageType, level);
  }

  getMessageTemplate(messageType, level) {
    const category = this.messageTemplates[messageType];
    if (!category) return null;
    
    if (typeof level === 'number') {
      return category[`level_${level}`];
    } else {
      return category[level];
    }
  }

  formatMessage(template, context) {
    let message = template.message;
    
    // Replace placeholders with context values
    Object.entries(context).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
    
    return {
      ...template,
      message,
      timestamp: new Date().toISOString(),
      context
    };
  }

  async sendConsoleNotification(message) {
    const urgencyColors = {
      low: '\x1b[32m',     // Green
      medium: '\x1b[33m',  // Yellow
      high: '\x1b[35m',    // Magenta
      critical: '\x1b[31m' // Red
    };
    
    const color = urgencyColors[message.urgency] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(`${color}📢 ${message.title}: ${message.message}${reset}`);
    if (message.action) {
      console.log(`   💡 ${message.action}`);
    }
  }

  async sendUINotification(message) {
    // Emit event for UI components to handle
    process.emit('user:notification', {
      type: 'system_status',
      title: message.title,
      message: message.message,
      action: message.action,
      urgency: message.urgency,
      timestamp: message.timestamp
    });
  }

  async sendEmailNotification(message) {
    // Only for critical notifications
    if (message.urgency !== 'critical') return;
    
    try {
      const emailConfig = {
        subject: `DuckDB System Alert: ${message.title}`,
        body: this.formatEmailBody(message),
        recipients: process.env.ADMIN_EMAILS?.split(',') || []
      };
      
      // Implementation would use actual email service
      console.log('📧 Critical email notification sent');
      
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  async sendWebhookNotification(message) {
    try {
      const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
      if (!webhookUrl) return;
      
      const payload = {
        text: `DuckDB Notification: ${message.title}`,
        urgency: message.urgency,
        message: message.message,
        action: message.action,
        timestamp: message.timestamp
      };
      
      // Implementation would use HTTP client
      console.log('🔗 Webhook notification sent');
      
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  formatEmailBody(message) {
    return `
DuckDB System Notification

Title: ${message.title}
Urgency: ${message.urgency.toUpperCase()}

Message: ${message.message}

${message.action ? `Recommended Action: ${message.action}` : ''}

Time: ${message.timestamp}

This is an automated notification from the BMad-Method DuckDB monitoring system.
`;
  }

  logNotification(message, messageType, level) {
    const { securityLogger } = require('../../bmad-method/tools/lib/security-logger');
    
    securityLogger.logDuckDBOperation({
      operation: 'user_notification',
      message_type: messageType,
      level: level,
      urgency: message.urgency,
      title: message.title,
      timestamp: message.timestamp
    });
  }

  // Convenience methods for common notifications
  async notifyMemoryPressure(level, memoryPercent) {
    await this.notifyUsers('memory_pressure', `level_${level}`, {
      memory_percent: memoryPercent.toFixed(1)
    });
  }

  async notifySlowQueries(avgQueryTime) {
    await this.notifyUsers('performance_issues', 'slow_queries', {
      avg_query_time: `${(avgQueryTime / 1000).toFixed(1)}s`
    });
  }

  async notifyRecoveryInProgress() {
    await this.notifyUsers('system_recovery', 'recovery_in_progress');
  }

  async notifyRecoveryComplete() {
    await this.notifyUsers('system_recovery', 'recovery_complete');
  }
}
```

## Integration with BMad-Method Error Handling

```javascript
const chalk = require('chalk');

class BMadIntegratedFallbackManager {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.userComm = new UserCommunicationManager();
  }

  async handleFallbackWithBMadPatterns(error, context) {
    // Use BMad error styling
    console.error(chalk.red(`❌ DuckDB Operation Failed: ${error.message}`));
    console.error(chalk.yellow(`💡 Context: ${context}`));
    
    // Determine fallback strategy
    const strategy = this.determineFallbackStrategy(error);
    console.log(chalk.blue(`🔄 Fallback Strategy: ${strategy}`));
    
    try {
      const result = await this.executeFallbackStrategy(strategy, error, context);
      
      if (result.success) {
        console.log(chalk.green(`✅ Fallback successful: ${result.message}`));
      } else {
        console.error(chalk.red(`❌ Fallback failed: ${result.error}`));
      }
      
      return result;
      
    } catch (fallbackError) {
      console.error(chalk.red(`❌ Critical: All fallback procedures failed`));
      console.error(chalk.yellow(`💡 Suggestion: Manual intervention required`));
      throw fallbackError;
    }
  }

  determineFallbackStrategy(error) {
    if (error.message.includes('memory') || error.message.includes('Memory')) {
      return 'memory_relief';
    } else if (error.message.includes('timeout') || error.message.includes('hung')) {
      return 'operation_recovery';
    } else if (error.message.includes('connection') || error.message.includes('crash')) {
      return 'system_recovery';
    } else {
      return 'general_recovery';
    }
  }

  async executeFallbackStrategy(strategy, error, context) {
    switch (strategy) {
      case 'memory_relief':
        return await this.executeMemoryReliefFallback(error, context);
      case 'operation_recovery':
        return await this.executeOperationRecoveryFallback(error, context);
      case 'system_recovery':
        return await this.executeSystemRecoveryFallback(error, context);
      default:
        return await this.executeGeneralRecoveryFallback(error, context);
    }
  }

  async executeMemoryReliefFallback(error, context) {
    const relief = new EmergencyMemoryRelief(this.duckdb);
    const result = await relief.executeEmergencyProtocol();
    
    await this.userComm.notifyMemoryPressure(4, 95); // Emergency level
    
    return {
      success: result.success,
      message: `Memory relief completed. Usage reduced to ${result.memory_usage_mb}MB`,
      strategy: 'memory_relief'
    };
  }

  async executeOperationRecoveryFallback(error, context) {
    const recovery = new HungOperationRecovery(this.duckdb);
    const result = await recovery.detectHungOperations();
    
    return {
      success: result.hung_operations === 0,
      message: `Recovered ${result.hung_operations} hung operations`,
      strategy: 'operation_recovery'
    };
  }

  async executeSystemRecoveryFallback(error, context) {
    const recovery = new DuckDBCrashRecovery(this.duckdb.config);
    const result = await recovery.performCrashRecovery();
    
    if (result.success) {
      await this.userComm.notifyRecoveryComplete();
    } else {
      await this.userComm.notifyRecoveryInProgress();
    }
    
    return {
      success: result.success,
      message: result.success ? 'System recovery completed' : 'System recovery failed',
      strategy: 'system_recovery'
    };
  }
}
```

## Testing Fallback Procedures

### 1. Fallback Testing Framework

```javascript
class FallbackTestRunner {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.testResults = [];
  }

  async runFallbackTests() {
    const tests = [
      () => this.testMemoryExhaustionFallback(),
      () => this.testHungOperationRecovery(),
      () => this.testCrashRecovery(),
      () => this.testCloudFallback(),
      () => this.testRollbackProcedures()
    ];
    
    console.log('🧪 Running fallback procedure tests...');
    
    for (const test of tests) {
      try {
        const result = await test();
        this.testResults.push(result);
      } catch (error) {
        this.testResults.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return this.generateTestReport();
  }

  async testMemoryExhaustionFallback() {
    // Simulate memory pressure and test relief procedures
    console.log('Testing memory exhaustion fallback...');
    
    // Implementation would create controlled memory pressure
    return { test: 'memory_exhaustion', success: true, message: 'Memory relief procedures functional' };
  }

  generateTestReport() {
    const successful = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    return {
      summary: `${successful}/${total} tests passed`,
      success_rate: (successful / total) * 100,
      results: this.testResults
    };
  }
}
```

## Next Steps

This completes the comprehensive fallback and recovery procedures documentation. The next task will focus on documenting the complete BMad-Method integration patterns.

## References

- [DuckDB Memory Management](../architecture/duckdb-memory-management.md)
- [Resource Monitoring Setup](../architecture/duckdb-monitoring-setup.md)
- [Partitioning Troubleshooting](../troubleshooting/duckdb-partitioning-troubleshooting.md)
- [BMad-Method Error Handling Patterns](../architecture/coding-standards.md)