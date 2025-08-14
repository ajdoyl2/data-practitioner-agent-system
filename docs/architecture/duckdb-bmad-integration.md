# DuckDB BMad-Method Integration Guide

## Overview

This guide documents the complete integration of DuckDB memory management with the BMad-Method framework, ensuring seamless operation within existing patterns, conventions, and workflows.

## BMad Resource Management Integration

### 1. Feature Flag Integration

DuckDB operations are fully integrated with BMad's feature flag system to enable controlled rollout and runtime configuration.

#### Feature Flag Structure

```yaml
# bmad-method/config/feature-flags.yaml
features:
  duckdb_analytics:
    enabled: true
    description: "Enable DuckDB analytics integration"
    dependencies: []
    
  duckdb_memory_management:
    enabled: true
    description: "Enable DuckDB memory management and monitoring"
    dependencies: ["duckdb_analytics"]
    
  duckdb_monitoring:
    enabled: true
    description: "Enable DuckDB resource monitoring"
    dependencies: ["duckdb_memory_management"]
    
  duckdb_alerting:
    enabled: true
    description: "Enable DuckDB alerting system"
    dependencies: ["duckdb_monitoring"]
    
  duckdb_web_dashboard:
    enabled: false  # Optional component
    description: "Enable DuckDB web monitoring dashboard"
    dependencies: ["duckdb_monitoring"]
    
  duckdb_performance_monitoring:
    enabled: false  # Resource intensive
    description: "Enable detailed DuckDB performance monitoring"
    dependencies: ["duckdb_monitoring"]
```

#### Integration Usage

```javascript
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class DuckDBBMadIntegration {
  constructor() {
    this.components = {};
  }

  async initializeBasedOnFlags() {
    // Core DuckDB functionality
    if (isFeatureEnabled('duckdb_analytics')) {
      this.components.duckdb = new DuckDBWrapper({
        memoryLimit: '4GB',
        maxConnections: 10
      });
      await this.components.duckdb.initialize();
    }
    
    // Memory management
    if (isFeatureEnabled('duckdb_memory_management')) {
      this.components.memoryManager = new DuckDBMemoryManager({
        duckdb: this.components.duckdb,
        enableSpilling: true,
        cleanupThreshold: 80
      });
    }
    
    // Resource monitoring
    if (isFeatureEnabled('duckdb_monitoring')) {
      this.components.monitor = new DuckDBResourceMonitor({
        duckdb: this.components.duckdb,
        alertingEnabled: isFeatureEnabled('duckdb_alerting')
      });
    }
    
    // Web dashboard (optional)
    if (isFeatureEnabled('duckdb_web_dashboard')) {
      this.components.dashboard = new DuckDBMonitoringDashboard(
        this.components.duckdb, {
          enableWebDashboard: true,
          dashboardPort: 3001
        }
      );
    }
  }

  async cleanup() {
    // Graceful shutdown in reverse order
    for (const [name, component] of Object.entries(this.components).reverse()) {
      if (component && typeof component.close === 'function') {
        await component.close();
        console.log(`Closed ${name} component`);
      }
    }
  }
}
```

### 2. Security Logger Integration

All DuckDB operations are integrated with BMad's security logging system for audit trails and security monitoring.

#### Security Event Types

```javascript
const { securityLogger } = require('../lib/security-logger');

class DuckDBSecurityIntegration {
  static logOperations() {
    // Database initialization
    securityLogger.logDuckDBOperation({
      operation: 'database_initialize',
      database_path: options.databasePath,
      memory_limit: options.memoryLimit,
      timestamp: new Date().toISOString(),
      success: true
    });
    
    // Memory threshold breaches
    securityLogger.logDuckDBOperation({
      operation: 'memory_threshold_breach',
      memory_percent: 85.2,
      threshold: 80,
      action_taken: 'automatic_cleanup',
      timestamp: new Date().toISOString(),
      requires_investigation: true
    });
    
    // Query performance issues
    securityLogger.logDuckDBOperation({
      operation: 'query_performance_alert',
      query_duration_ms: 15000,
      threshold_ms: 10000,
      memory_usage_mb: 2048,
      table_count: 15,
      timestamp: new Date().toISOString()
    });
    
    // Emergency procedures
    securityLogger.logDuckDBOperation({
      operation: 'emergency_cleanup',
      trigger: 'memory_exhaustion',
      memory_before_percent: 95.8,
      memory_after_percent: 72.1,
      recovery_time_ms: 3500,
      timestamp: new Date().toISOString(),
      requires_investigation: true
    });
    
    // Configuration changes
    securityLogger.logDuckDBOperation({
      operation: 'configuration_change',
      changed_setting: 'memory_limit',
      old_value: '4GB',
      new_value: '8GB',
      changed_by: 'automatic_scaling',
      timestamp: new Date().toISOString()
    });
  }
}
```

#### Integration with Existing Error Patterns

```javascript
const chalk = require('chalk');
const { securityLogger } = require('../lib/security-logger');

class DuckDBErrorHandling {
  static handleDuckDBError(error, context = {}) {
    // Log error following BMad patterns
    securityLogger.logDuckDBOperation({
      operation: 'duckdb_error',
      error_type: error.constructor.name,
      error_message: error.message,
      context: context,
      timestamp: new Date().toISOString(),
      requires_investigation: true
    });
    
    // Display error with BMad styling
    console.error(chalk.red('❌ DuckDB Error:'), error.message);
    
    if (context.operation) {
      console.error(chalk.yellow(`   Operation: ${context.operation}`));
    }
    
    if (context.recovery_suggestion) {
      console.error(chalk.blue(`   💡 Suggestion: ${context.recovery_suggestion}`));
    }
    
    // Implement BMad error recovery pattern
    return {
      success: false,
      error: error.message,
      error_code: error.code || 'DUCKDB_ERROR',
      recovery_options: this.getRecoveryOptions(error),
      timestamp: new Date().toISOString()
    };
  }
  
  static getRecoveryOptions(error) {
    if (error.message.includes('memory')) {
      return [
        'Reduce batch size',
        'Enable memory spilling',
        'Increase system memory',
        'Use data partitioning'
      ];
    }
    
    if (error.message.includes('connection')) {
      return [
        'Retry connection',
        'Check database accessibility',
        'Reduce concurrent connections'
      ];
    }
    
    return ['Check logs for details', 'Contact system administrator'];
  }
}
```

### 3. CLI Tool Integration

DuckDB operations are integrated with existing BMad CLI patterns and conventions.

#### Command Integration

```javascript
// bmad-method/tools/cli/data-commands.js
const { Command } = require('commander');
const DuckDBWrapper = require('../data-services/duckdb-wrapper');
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class DataCommands {
  static addDuckDBCommands(program) {
    const dataGroup = program
      .command('data')
      .description('Data processing and analytics commands');
    
    // Analyze command
    dataGroup
      .command('analyze <dataset>')
      .description('Analyze dataset using DuckDB')
      .option('-m, --memory-limit <size>', 'Memory limit', '4GB')
      .option('-o, --output <format>', 'Output format', 'table')
      .option('--monitor', 'Enable monitoring during analysis')
      .action(async (dataset, options) => {
        if (!isFeatureEnabled('duckdb_analytics')) {
          console.log(chalk.yellow('⚠️  DuckDB analytics is disabled'));
          return;
        }
        
        await this.handleAnalyzeCommand(dataset, options);
      });
    
    // Monitor command
    dataGroup
      .command('monitor')
      .description('Monitor DuckDB resource usage')
      .option('-i, --interval <seconds>', 'Update interval', '30')
      .option('-w, --web', 'Enable web dashboard')
      .action(async (options) => {
        if (!isFeatureEnabled('duckdb_monitoring')) {
          console.log(chalk.yellow('⚠️  DuckDB monitoring is disabled'));
          return;
        }
        
        await this.handleMonitorCommand(options);
      });
    
    // Cleanup command
    dataGroup
      .command('cleanup')
      .description('Perform DuckDB memory cleanup')
      .option('-f, --force', 'Force aggressive cleanup')
      .action(async (options) => {
        await this.handleCleanupCommand(options);
      });
  }
  
  static async handleAnalyzeCommand(dataset, options) {
    try {
      console.log(chalk.blue('🔍 Starting data analysis...'));
      
      const duckdb = new DuckDBWrapper({
        memoryLimit: options.memoryLimit
      });
      
      const result = await duckdb.initialize();
      if (!result.success) {
        throw new Error(`Failed to initialize DuckDB: ${result.error}`);
      }
      
      // Enable monitoring if requested
      let monitor;
      if (options.monitor && isFeatureEnabled('duckdb_monitoring')) {
        const DuckDBResourceMonitor = require('../data-services/resource-monitor');
        monitor = new DuckDBResourceMonitor({ duckdb });
        await monitor.startMonitoring();
      }
      
      // Perform analysis
      const analysisResult = await this.performAnalysis(duckdb, dataset, options);
      
      // Display results
      this.displayAnalysisResults(analysisResult, options.output);
      
      // Cleanup
      if (monitor) {
        await monitor.stopMonitoring();
      }
      await duckdb.close();
      
      console.log(chalk.green('✅ Analysis completed'));
      
    } catch (error) {
      console.error(chalk.red(`❌ Analysis failed: ${error.message}`));
      process.exit(1);
    }
  }
}
```

#### Integration with Existing Tools

```javascript
// bmad-method/tools/data-services/bmad-data-orchestrator.js
const { securityLogger } = require('../lib/security-logger');
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class BMadDataOrchestrator {
  constructor() {
    this.dataProviders = new Map();
    this.initializeProviders();
  }
  
  async initializeProviders() {
    // File-based data (existing BMad functionality)
    this.dataProviders.set('file', new FileDataProvider());
    
    // DuckDB analytics (new integration)
    if (isFeatureEnabled('duckdb_analytics')) {
      const DuckDBProvider = require('./duckdb-data-provider');
      this.dataProviders.set('duckdb', new DuckDBProvider({
        memoryLimit: '4GB',
        enableMonitoring: isFeatureEnabled('duckdb_monitoring')
      }));
    }
  }
  
  async processData(request) {
    const { source, operation, options = {} } = request;
    
    // Determine appropriate provider
    const provider = this.selectProvider(source, operation);
    
    // Log operation start
    securityLogger.logDataOperation({
      operation: 'data_processing_start',
      provider: provider.name,
      source: source,
      operation_type: operation,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await provider.process(request);
      
      // Log successful completion
      securityLogger.logDataOperation({
        operation: 'data_processing_complete',
        provider: provider.name,
        duration_ms: result.duration,
        records_processed: result.recordCount,
        memory_peak_mb: result.memoryPeak,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      // Log error with BMad patterns
      securityLogger.logDataOperation({
        operation: 'data_processing_error',
        provider: provider.name,
        error: error.message,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
      
      throw error;
    }
  }
  
  selectProvider(source, operation) {
    // Use DuckDB for large-scale analytics if available
    if (this.dataProviders.has('duckdb') && this.isDuckDBSuitable(source, operation)) {
      return this.dataProviders.get('duckdb');
    }
    
    // Fall back to file-based processing
    return this.dataProviders.get('file');
  }
  
  isDuckDBSuitable(source, operation) {
    // Use DuckDB for:
    // - Large datasets (>100MB)
    // - Complex analytical operations
    // - Operations requiring SQL capabilities
    const analyticalOperations = ['aggregate', 'join', 'analyze', 'transform'];
    return analyticalOperations.includes(operation) || this.isLargeDataset(source);
  }
}
```

## Configuration Templates Aligned with BMad Conventions

### 1. Environment-Specific Configuration

Following BMad's environment configuration patterns:

```yaml
# bmad-method/expansion-packs/bmad-data-practitioner/config/duckdb-environments.yaml
environments:
  development:
    duckdb:
      memory_limit: "2GB"
      max_connections: 5
      enable_spilling: true
      monitoring:
        enabled: true
        interval_seconds: 30
        web_dashboard: true
        dashboard_port: 3001
      alerting:
        memory_warning: 75
        memory_critical: 85
        cpu_warning: 70
        cpu_critical: 85
  
  testing:
    duckdb:
      memory_limit: "1GB"
      max_connections: 3
      enable_spilling: true
      monitoring:
        enabled: true
        interval_seconds: 60
        web_dashboard: false
      alerting:
        memory_warning: 70
        memory_critical: 80
        cpu_warning: 65
        cpu_critical: 80
  
  production:
    duckdb:
      memory_limit: "8GB"
      max_connections: 20
      enable_spilling: true
      monitoring:
        enabled: true
        interval_seconds: 15
        web_dashboard: false  # Security consideration
        lightweight_mode: true
      alerting:
        memory_warning: 80
        memory_critical: 90
        cpu_warning: 75
        cpu_critical: 90
        alert_cooldown_minutes: 5
      security:
        audit_all_operations: true
        require_approval_for_schema_changes: true
```

### 2. BMad Configuration Loading Pattern

```javascript
// bmad-method/tools/lib/duckdb-config-loader.js
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

class DuckDBConfigLoader {
  constructor() {
    this.configCache = new Map();
  }
  
  async loadConfig(environment = 'development') {
    if (this.configCache.has(environment)) {
      return this.configCache.get(environment);
    }
    
    // Follow BMad configuration hierarchy
    const configPaths = [
      // User-specific overrides
      path.join(process.env.HOME, '.bmad', 'duckdb-config.yaml'),
      // Project-specific config
      path.join(process.cwd(), 'config', 'duckdb.yaml'),
      // Expansion pack defaults
      path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/config/duckdb-environments.yaml')
    ];
    
    let config = {};
    
    // Load and merge configurations (BMad pattern)
    for (const configPath of configPaths) {
      if (await fs.pathExists(configPath)) {
        try {
          const fileConfig = yaml.load(await fs.readFile(configPath, 'utf8'));
          
          if (fileConfig.environments && fileConfig.environments[environment]) {
            config = this.mergeConfigs(config, fileConfig.environments[environment]);
          } else if (fileConfig.duckdb) {
            config = this.mergeConfigs(config, { duckdb: fileConfig.duckdb });
          }
          
        } catch (error) {
          console.warn(`Failed to load DuckDB config from ${configPath}:`, error.message);
        }
      }
    }
    
    // Apply environment variable overrides (BMad pattern)
    config = this.applyEnvironmentOverrides(config);
    
    // Validate configuration
    this.validateConfig(config);
    
    this.configCache.set(environment, config);
    return config;
  }
  
  mergeConfigs(base, override) {
    // Deep merge following BMad patterns
    return this.deepMerge(base, override);
  }
  
  applyEnvironmentOverrides(config) {
    const overrides = {
      'DUCKDB_MEMORY_LIMIT': 'duckdb.memory_limit',
      'DUCKDB_MAX_CONNECTIONS': 'duckdb.max_connections',
      'DUCKDB_MONITORING_INTERVAL': 'duckdb.monitoring.interval_seconds',
      'DUCKDB_WEB_DASHBOARD_PORT': 'duckdb.monitoring.dashboard_port'
    };
    
    for (const [envVar, configPath] of Object.entries(overrides)) {
      if (process.env[envVar]) {
        this.setNestedValue(config, configPath, process.env[envVar]);
      }
    }
    
    return config;
  }
  
  validateConfig(config) {
    const required = ['duckdb.memory_limit', 'duckdb.max_connections'];
    
    for (const requiredPath of required) {
      if (!this.getNestedValue(config, requiredPath)) {
        throw new Error(`Missing required DuckDB configuration: ${requiredPath}`);
      }
    }
  }
  
  // Utility methods for nested object operations (BMad pattern)
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr && curr[prop], obj);
  }
  
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((curr, key) => {
      curr[key] = curr[key] || {};
      return curr[key];
    }, obj);
    target[lastKey] = value;
  }
}

module.exports = DuckDBConfigLoader;
```

### 3. BMad Convention Compliance

```javascript
// bmad-method/tools/data-services/duckdb-bmad-conventions.js
const chalk = require('chalk');
const { securityLogger } = require('../lib/security-logger');

class DuckDBBMadConventions {
  /**
   * Initialize DuckDB following BMad conventions
   */
  static async initializeWithConventions(options = {}) {
    // 1. Configuration loading (BMad pattern)
    const configLoader = new (require('../lib/duckdb-config-loader'))();
    const config = await configLoader.loadConfig(options.environment);
    
    // 2. Feature flag checking (BMad pattern)
    const { isFeatureEnabled } = require('../lib/feature-flag-manager');
    if (!isFeatureEnabled('duckdb_analytics')) {
      throw new Error('DuckDB analytics is disabled via feature flags');
    }
    
    // 3. Security logging (BMad pattern)
    securityLogger.logDuckDBOperation({
      operation: 'initialization_start',
      environment: options.environment || 'development',
      memory_limit: config.duckdb.memory_limit,
      timestamp: new Date().toISOString()
    });
    
    // 4. Error handling with BMad styling
    try {
      const DuckDBWrapper = require('./duckdb-wrapper');
      const duckdb = new DuckDBWrapper(config.duckdb);
      
      const result = await duckdb.initialize();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // 5. Success logging and display
      console.log(chalk.green('✅ DuckDB initialized successfully'));
      console.log(chalk.blue(`   Memory limit: ${config.duckdb.memory_limit}`));
      console.log(chalk.blue(`   Max connections: ${config.duckdb.max_connections}`));
      
      securityLogger.logDuckDBOperation({
        operation: 'initialization_complete',
        success: true,
        timestamp: new Date().toISOString()
      });
      
      return { duckdb, config };
      
    } catch (error) {
      // 6. Error handling (BMad pattern)
      console.error(chalk.red('❌ DuckDB initialization failed:'), error.message);
      
      securityLogger.logDuckDBOperation({
        operation: 'initialization_failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
      
      throw error;
    }
  }
  
  /**
   * Graceful shutdown following BMad patterns
   */
  static async gracefulShutdown(components) {
    console.log(chalk.yellow('🛑 Initiating graceful shutdown...'));
    
    const shutdownOrder = ['dashboard', 'monitor', 'duckdb'];
    const errors = [];
    
    for (const componentName of shutdownOrder) {
      if (components[componentName]) {
        try {
          console.log(chalk.blue(`   Stopping ${componentName}...`));
          
          if (typeof components[componentName].close === 'function') {
            await components[componentName].close();
          } else if (typeof components[componentName].stop === 'function') {
            await components[componentName].stop();
          }
          
          console.log(chalk.green(`   ✅ ${componentName} stopped`));
          
        } catch (error) {
          console.error(chalk.red(`   ❌ Failed to stop ${componentName}:`), error.message);
          errors.push({ component: componentName, error: error.message });
        }
      }
    }
    
    // Log shutdown completion
    securityLogger.logDuckDBOperation({
      operation: 'graceful_shutdown',
      success: errors.length === 0,
      errors: errors,
      timestamp: new Date().toISOString()
    });
    
    if (errors.length === 0) {
      console.log(chalk.green('✅ Graceful shutdown completed'));
    } else {
      console.log(chalk.yellow(`⚠️  Shutdown completed with ${errors.length} errors`));
    }
    
    return { success: errors.length === 0, errors };
  }
}

module.exports = DuckDBBMadConventions;
```

## Agent Workflow Patterns

### 1. Memory-Efficient Data Processing Patterns

```javascript
// bmad-method/tools/data-services/agent-workflow-patterns.js
const { securityLogger } = require('../lib/security-logger');
const DuckDBBMadConventions = require('./duckdb-bmad-conventions');

class AgentWorkflowPatterns {
  /**
   * Large Dataset Processing Pattern
   */
  static async processLargeDataset(datasetPath, operations, options = {}) {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    securityLogger.logDuckDBOperation({
      operation: 'agent_workflow_start',
      workflow_id: workflowId,
      workflow_type: 'large_dataset_processing',
      dataset_path: datasetPath,
      operations: operations,
      timestamp: new Date().toISOString()
    });
    
    let components = {};
    
    try {
      // 1. Initialize with monitoring
      const { duckdb, config } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment
      });
      components.duckdb = duckdb;
      
      // 2. Setup monitoring if enabled
      if (config.duckdb.monitoring?.enabled) {
        const DuckDBResourceMonitor = require('./resource-monitor');
        components.monitor = new DuckDBResourceMonitor({
          duckdb,
          memoryWarningThreshold: config.duckdb.alerting?.memory_warning || 75,
          memoryCriticalThreshold: config.duckdb.alerting?.memory_critical || 85
        });
        
        await components.monitor.startMonitoring();
      }
      
      // 3. Process operations with memory management
      const results = [];
      for (const [index, operation] of operations.entries()) {
        console.log(chalk.blue(`📊 Processing operation ${index + 1}/${operations.length}: ${operation.type}`));
        
        const operationResult = await this.executeOperation(
          duckdb, 
          operation, 
          { workflowId, operationIndex: index }
        );
        
        results.push(operationResult);
        
        // Memory check after each operation
        if (components.monitor) {
          const metrics = await components.monitor.collectMetrics();
          if (metrics.memory.duckdb_memory_percent > 80) {
            console.log(chalk.yellow('⚠️  High memory usage detected, performing cleanup...'));
            await components.monitor.performAutomaticCleanup();
          }
        }
      }
      
      // 4. Success logging
      securityLogger.logDuckDBOperation({
        operation: 'agent_workflow_complete',
        workflow_id: workflowId,
        operations_completed: results.length,
        total_duration_ms: results.reduce((sum, r) => sum + r.duration, 0),
        peak_memory_percent: Math.max(...results.map(r => r.peakMemoryPercent)),
        timestamp: new Date().toISOString()
      });
      
      console.log(chalk.green(`✅ Workflow ${workflowId} completed successfully`));
      return { workflowId, results, success: true };
      
    } catch (error) {
      // Error handling
      console.error(chalk.red(`❌ Workflow ${workflowId} failed:`), error.message);
      
      securityLogger.logDuckDBOperation({
        operation: 'agent_workflow_failed',
        workflow_id: workflowId,
        error: error.message,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
      
      throw error;
      
    } finally {
      // Cleanup
      await DuckDBBMadConventions.gracefulShutdown(components);
    }
  }
  
  /**
   * Streaming Data Processing Pattern
   */
  static async processStreamingData(source, processor, options = {}) {
    const workflowId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let components = {};
    
    try {
      // Initialize with streaming-optimized configuration
      const streamConfig = {
        environment: options.environment,
        streamingMode: true,
        chunkSize: options.chunkSize || 10000
      };
      
      const { duckdb, config } = await DuckDBBMadConventions.initializeWithConventions(streamConfig);
      components.duckdb = duckdb;
      
      // Setup lightweight monitoring for streaming
      const DuckDBResourceMonitor = require('./resource-monitor');
      components.monitor = new DuckDBResourceMonitor({
        duckdb,
        monitoringInterval: 10000, // 10 seconds for streaming
        alertingCooldown: 30000     // 30 seconds cooldown
      });
      
      await components.monitor.startMonitoring();
      
      // Process streaming data
      const processor = new StreamingDataProcessor(duckdb, {
        chunkSize: streamConfig.chunkSize,
        memoryThreshold: 70 // Lower threshold for streaming
      });
      
      const result = await processor.process(source, options);
      
      console.log(chalk.green(`✅ Streaming workflow ${workflowId} completed`));
      return result;
      
    } finally {
      await DuckDBBMadConventions.gracefulShutdown(components);
    }
  }
  
  /**
   * Batch Analytics Pattern
   */
  static async runBatchAnalytics(queries, options = {}) {
    const workflowId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let components = {};
    
    try {
      // Initialize for batch processing
      const { duckdb, config } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment,
        batchMode: true
      });
      components.duckdb = duckdb;
      
      // Setup monitoring with batch-optimized settings
      components.monitor = new (require('./resource-monitor'))({
        duckdb,
        enableDetailedMetrics: true,
        historyRetention: 200
      });
      
      await components.monitor.startMonitoring();
      
      // Execute batch queries
      const batchProcessor = new BatchAnalyticsProcessor(duckdb, {
        parallelQueries: options.parallelQueries || 3,
        queryTimeout: options.queryTimeout || 30000
      });
      
      const results = await batchProcessor.executeBatch(queries);
      
      // Generate performance report
      if (options.generateReport) {
        const reportPath = `./reports/batch_analytics_${workflowId}.json`;
        await components.monitor.exportMetrics(reportPath, 'json');
        console.log(chalk.blue(`📊 Performance report saved: ${reportPath}`));
      }
      
      console.log(chalk.green(`✅ Batch analytics ${workflowId} completed`));
      return results;
      
    } finally {
      await DuckDBBMadConventions.gracefulShutdown(components);
    }
  }
}

module.exports = AgentWorkflowPatterns;
```

### 2. Error Recovery Patterns

```javascript
// bmad-method/tools/data-services/agent-error-recovery.js
const chalk = require('chalk');
const { securityLogger } = require('../lib/security-logger');

class AgentErrorRecovery {
  /**
   * Intelligent error recovery for agent workflows
   */
  static async handleWorkflowError(error, context) {
    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(chalk.yellow(`🔧 Attempting error recovery (${recoveryId})...`));
    
    // Log recovery attempt
    securityLogger.logDuckDBOperation({
      operation: 'error_recovery_start',
      recovery_id: recoveryId,
      original_error: error.message,
      context: context,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Determine recovery strategy
      const strategy = this.determineRecoveryStrategy(error, context);
      console.log(chalk.blue(`   Strategy: ${strategy.name}`));
      
      // Execute recovery
      const recoveryResult = await this.executeRecoveryStrategy(strategy, context);
      
      if (recoveryResult.success) {
        console.log(chalk.green(`✅ Recovery ${recoveryId} successful`));
        
        securityLogger.logDuckDBOperation({
          operation: 'error_recovery_success',
          recovery_id: recoveryId,
          strategy_used: strategy.name,
          recovery_time_ms: recoveryResult.duration,
          timestamp: new Date().toISOString()
        });
        
        return recoveryResult;
      } else {
        throw new Error(`Recovery strategy '${strategy.name}' failed: ${recoveryResult.error}`);
      }
      
    } catch (recoveryError) {
      console.error(chalk.red(`❌ Recovery ${recoveryId} failed:`), recoveryError.message);
      
      securityLogger.logDuckDBOperation({
        operation: 'error_recovery_failed',
        recovery_id: recoveryId,
        recovery_error: recoveryError.message,
        timestamp: new Date().toISOString(),
        requires_investigation: true
      });
      
      // Re-throw original error with recovery context
      const enhancedError = new Error(`${error.message} (Recovery failed: ${recoveryError.message})`);
      enhancedError.originalError = error;
      enhancedError.recoveryError = recoveryError;
      throw enhancedError;
    }
  }
  
  static determineRecoveryStrategy(error, context) {
    // Memory-related errors
    if (error.message.includes('memory') || error.message.includes('out of space')) {
      return {
        name: 'memory_recovery',
        steps: ['aggressive_cleanup', 'reduce_batch_size', 'enable_spilling']
      };
    }
    
    // Connection-related errors
    if (error.message.includes('connection') || error.message.includes('database')) {
      return {
        name: 'connection_recovery',
        steps: ['reconnect', 'reduce_connections', 'database_repair']
      };
    }
    
    // Query timeout errors
    if (error.message.includes('timeout') || error.message.includes('cancelled')) {
      return {
        name: 'timeout_recovery',
        steps: ['optimize_query', 'increase_timeout', 'partition_data']
      };
    }
    
    // Default recovery
    return {
      name: 'generic_recovery',
      steps: ['restart_components', 'reduce_workload', 'safe_mode']
    };
  }
  
  static async executeRecoveryStrategy(strategy, context) {
    const startTime = Date.now();
    
    for (const step of strategy.steps) {
      try {
        console.log(chalk.blue(`   Executing: ${step}`));
        
        switch (step) {
          case 'aggressive_cleanup':
            await this.performAggressiveCleanup(context);
            break;
            
          case 'reduce_batch_size':
            await this.reduceBatchSize(context);
            break;
            
          case 'enable_spilling':
            await this.enableSpilling(context);
            break;
            
          case 'reconnect':
            await this.reconnectDatabase(context);
            break;
            
          case 'optimize_query':
            await this.optimizeQuery(context);
            break;
            
          default:
            console.log(chalk.yellow(`   Unknown recovery step: ${step}`));
        }
        
        console.log(chalk.green(`   ✅ ${step} completed`));
        
      } catch (stepError) {
        console.log(chalk.red(`   ❌ ${step} failed: ${stepError.message}`));
        // Continue with next step
      }
    }
    
    return {
      success: true,
      duration: Date.now() - startTime,
      strategy: strategy.name,
      steps_executed: strategy.steps
    };
  }
  
  // Recovery step implementations
  static async performAggressiveCleanup(context) {
    if (context.monitor) {
      await context.monitor.performEmergencyCleanup();
    }
  }
  
  static async reduceBatchSize(context) {
    if (context.processor && context.processor.setBatchSize) {
      const currentSize = context.processor.getBatchSize();
      const newSize = Math.max(1000, Math.floor(currentSize * 0.5));
      context.processor.setBatchSize(newSize);
      console.log(chalk.blue(`   Reduced batch size: ${currentSize} → ${newSize}`));
    }
  }
  
  static async enableSpilling(context) {
    if (context.duckdb && context.duckdb.enableSpilling) {
      await context.duckdb.enableSpilling();
      console.log(chalk.blue('   Enabled memory spilling'));
    }
  }
  
  static async reconnectDatabase(context) {
    if (context.duckdb) {
      await context.duckdb.close();
      await context.duckdb.initialize();
      console.log(chalk.blue('   Database reconnected'));
    }
  }
  
  static async optimizeQuery(context) {
    if (context.query && context.queryOptimizer) {
      context.query = await context.queryOptimizer.optimize(context.query);
      console.log(chalk.blue('   Query optimized'));
    }
  }
}

module.exports = AgentErrorRecovery;
```

## Next Steps

1. **CLI Integration Documentation** - Document how DuckDB operations integrate with existing CLI tools
2. **Troubleshooting Integration** - Document troubleshooting integration with existing BMad error handling

This integration guide ensures that DuckDB memory management operates seamlessly within the BMad-Method framework while maintaining all existing patterns and conventions.