/**
 * DuckDB CLI Integration with BMad-Method
 * Integrates DuckDB operations with existing BMad CLI tools and patterns
 */

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

// BMad imports
const { isFeatureEnabled } = require('../lib/feature-flag-manager');
const { securityLogger } = require('../lib/security-logger');
const DuckDBBMadConventions = require('../data-services/duckdb-bmad-conventions');

// DuckDB components
const DuckDBWrapper = require('../data-services/duckdb-wrapper');
const DuckDBMonitoringDashboard = require('../data-services/monitoring-dashboard');
const DuckDBResourceMonitor = require('../data-services/resource-monitor');
const BenchmarkRunner = require('../data-services/benchmark-test-runner');

class DuckDBCLIIntegration {
  constructor() {
    this.config = null;
    this.loadIntegrationConfig();
  }

  /**
   * Load CLI integration configuration
   */
  async loadIntegrationConfig() {
    try {
      const configPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/data/duckdb-cli-integration-config.yaml');
      
      if (await fs.pathExists(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        this.config = yaml.load(configContent);
      } else {
        // Fallback configuration
        this.config = {
          cli_integration: {
            commands: {
              data: { enabled: true }
            },
            patterns: {
              error_handling: { use_chalk_styling: true }
            }
          }
        };
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to load DuckDB CLI config, using defaults'));
      this.config = { cli_integration: { commands: { data: { enabled: true } } } };
    }
  }

  /**
   * Register DuckDB commands with BMad CLI
   */
  registerCommands(program) {
    if (!this.isIntegrationEnabled()) {
      return;
    }

    const dataGroup = program
      .command('data')
      .description('Data processing and analytics commands using DuckDB');

    this.registerAnalyzeCommand(dataGroup);
    this.registerMonitorCommand(dataGroup);
    this.registerCleanupCommand(dataGroup);
    this.registerBenchmarkCommand(dataGroup);
    this.registerStatusCommand(dataGroup);
  }

  /**
   * Register analyze command
   */
  registerAnalyzeCommand(dataGroup) {
    dataGroup
      .command('analyze <dataset>')
      .description('Analyze dataset using DuckDB')
      .option('-m, --memory-limit <size>', 'Memory limit for DuckDB', '4GB')
      .option('-o, --output <format>', 'Output format (table, json, csv)', 'table')
      .option('--monitor', 'Enable monitoring during analysis')
      .option('-e, --environment <env>', 'Environment configuration', 'development')
      .action(async (dataset, options) => {
        await this.handleAnalyzeCommand(dataset, options);
      });
  }

  /**
   * Register monitor command
   */
  registerMonitorCommand(dataGroup) {
    dataGroup
      .command('monitor')
      .description('Monitor DuckDB resource usage')
      .option('-i, --interval <seconds>', 'Update interval in seconds', '30')
      .option('-w, --web', 'Enable web dashboard')
      .option('-p, --port <number>', 'Web dashboard port', '3001')
      .option('-o, --output <file>', 'Log output to file')
      .option('-e, --environment <env>', 'Environment configuration', 'development')
      .action(async (options) => {
        await this.handleMonitorCommand(options);
      });
  }

  /**
   * Register cleanup command
   */
  registerCleanupCommand(dataGroup) {
    dataGroup
      .command('cleanup')
      .description('Perform DuckDB memory cleanup')
      .option('-f, --force', 'Force aggressive cleanup')
      .option('-e, --environment <env>', 'Environment configuration', 'development')
      .action(async (options) => {
        await this.handleCleanupCommand(options);
      });
  }

  /**
   * Register benchmark command
   */
  registerBenchmarkCommand(dataGroup) {
    dataGroup
      .command('benchmark')
      .description('Run DuckDB performance benchmarks')
      .option('-t, --test-type <type>', 'Benchmark type (load, query, memory, all)', 'all')
      .option('-o, --output <file>', 'Save results to file')
      .option('-e, --environment <env>', 'Environment configuration', 'development')
      .action(async (options) => {
        await this.handleBenchmarkCommand(options);
      });
  }

  /**
   * Register status command
   */
  registerStatusCommand(dataGroup) {
    dataGroup
      .command('status')
      .description('Show DuckDB status and health')
      .option('-j, --json', 'Output in JSON format')
      .option('-e, --environment <env>', 'Environment configuration', 'development')
      .action(async (options) => {
        await this.handleStatusCommand(options);
      });
  }

  /**
   * Handle analyze command
   */
  async handleAnalyzeCommand(dataset, options) {
    const operationId = `analyze_${Date.now()}`;
    
    if (!this.validateFeatureFlags(['duckdb_analytics', 'duckdb_cli_integration'])) {
      return;
    }

    try {
      console.log(chalk.blue('🔍 Starting data analysis...'));
      
      // Log operation start
      securityLogger.logDuckDBOperation({
        operation: 'cli_analyze_start',
        operation_id: operationId,
        dataset: dataset,
        memory_limit: options.memoryLimit,
        output_format: options.output,
        timestamp: new Date().toISOString()
      });

      // Initialize DuckDB with BMad conventions
      const { duckdb, config } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment,
        memoryLimit: options.memoryLimit
      });

      let monitor = null;

      // Setup monitoring if requested
      if (options.monitor && isFeatureEnabled('duckdb_monitoring')) {
        console.log(chalk.blue('📊 Enabling monitoring...'));
        monitor = new DuckDBResourceMonitor({ 
          duckdb,
          enableAlerts: true 
        });
        await monitor.startMonitoring();
      }

      // Validate dataset
      if (!await this.validateDataset(dataset)) {
        throw new Error(`Dataset not found or inaccessible: ${dataset}`);
      }

      // Perform analysis
      console.log(chalk.blue(`📈 Analyzing dataset: ${dataset}`));
      const analysisResult = await this.performDatasetAnalysis(duckdb, dataset, options);

      // Display results
      this.displayAnalysisResults(analysisResult, options.output);

      // Log success
      securityLogger.logDuckDBOperation({
        operation: 'cli_analyze_complete',
        operation_id: operationId,
        records_analyzed: analysisResult.recordCount,
        duration_ms: analysisResult.duration,
        peak_memory_mb: analysisResult.peakMemoryMB,
        timestamp: new Date().toISOString()
      });

      console.log(chalk.green('✅ Analysis completed successfully'));

      // Cleanup
      if (monitor) {
        await monitor.stopMonitoring();
      }
      await duckdb.close();

    } catch (error) {
      this.handleCLIError(error, 'analyze', operationId);
    }
  }

  /**
   * Handle monitor command
   */
  async handleMonitorCommand(options) {
    if (!this.validateFeatureFlags(['duckdb_monitoring', 'duckdb_cli_monitoring'])) {
      return;
    }

    try {
      console.log(chalk.blue('📊 Starting DuckDB monitoring...'));

      // Initialize DuckDB
      const { duckdb, config } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment
      });

      // Create monitoring dashboard
      const dashboard = new DuckDBMonitoringDashboard(duckdb, {
        updateInterval: parseInt(options.interval) * 1000,
        enableWebDashboard: options.web && isFeatureEnabled('duckdb_cli_web_dashboard'),
        dashboardPort: parseInt(options.port)
      });

      // Setup output logging if specified
      if (options.output) {
        await this.setupMonitoringOutput(dashboard, options.output);
      }

      // Setup event handlers with BMad styling
      dashboard.on('dashboard:alert', (alert) => {
        const emoji = { warning: '⚠️', critical: '🚨', emergency: '🔥' };
        const level = alert.level.toUpperCase();
        const levelColor = level === 'CRITICAL' || level === 'EMERGENCY' ? chalk.red : chalk.yellow;
        
        console.log(`${emoji[alert.level] || '❗'} ${levelColor(level)}: ${alert.message}`);
      });

      dashboard.on('dashboard:updated', (data) => {
        if (!options.output) {
          this.displayMonitoringUpdate(data);
        }
      });

      // Start monitoring
      await dashboard.start();

      console.log(chalk.green('✅ Monitoring started'));
      console.log(`   Update interval: ${options.interval} seconds`);
      console.log(`   Environment: ${options.environment}`);

      if (options.web) {
        console.log(`   Web dashboard: ${chalk.cyan(`http://localhost:${options.port}`)}`);
      }

      console.log(chalk.gray('\\nPress Ctrl+C to stop monitoring...\\n'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\\n🛑 Stopping monitoring...'));
        await dashboard.stop();
        await duckdb.close();
        console.log(chalk.green('✅ Monitoring stopped'));
        process.exit(0);
      });

      // Keep process alive
      process.stdin.resume();

    } catch (error) {
      this.handleCLIError(error, 'monitor');
    }
  }

  /**
   * Handle cleanup command
   */
  async handleCleanupCommand(options) {
    if (!this.validateFeatureFlags(['duckdb_analytics'])) {
      return;
    }

    try {
      console.log(chalk.blue('🧹 Performing DuckDB cleanup...'));

      const { duckdb } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment
      });

      const monitor = new DuckDBResourceMonitor({ duckdb });

      // Get memory usage before cleanup
      const beforeMetrics = await monitor.collectMetrics();
      console.log(`Memory before cleanup: ${chalk.yellow(beforeMetrics.memory.duckdb_memory_percent.toFixed(1) + '%')}`);

      // Perform cleanup
      if (options.force) {
        console.log(chalk.yellow('⚠️  Performing aggressive cleanup...'));
        await monitor.performEmergencyCleanup();
      } else {
        await monitor.performAutomaticCleanup();
      }

      // Get memory usage after cleanup
      const afterMetrics = await monitor.collectMetrics();
      console.log(`Memory after cleanup: ${chalk.green(afterMetrics.memory.duckdb_memory_percent.toFixed(1) + '%')}`);

      const reduction = beforeMetrics.memory.duckdb_memory_percent - afterMetrics.memory.duckdb_memory_percent;
      
      if (reduction > 0) {
        console.log(chalk.green(`✅ Cleanup completed. Memory reduced by ${reduction.toFixed(1)}%`));
      } else {
        console.log(chalk.blue('ℹ️  No significant memory reduction achieved'));
      }

      await duckdb.close();

    } catch (error) {
      this.handleCLIError(error, 'cleanup');
    }
  }

  /**
   * Handle benchmark command
   */
  async handleBenchmarkCommand(options) {
    if (!this.validateFeatureFlags(['duckdb_analytics'])) {
      return;
    }

    try {
      console.log(chalk.blue('🏃 Running DuckDB benchmarks...'));

      const runner = new BenchmarkRunner({
        environment: options.environment,
        outputDir: './benchmark-results'
      });

      await runner.initialize();

      let results;
      switch (options.testType) {
        case 'load':
          results = await runner.benchmarkLoadPerformance();
          break;
        case 'query':
          results = await runner.benchmarkQueryPerformance();
          break;
        case 'memory':
          results = await runner.benchmarkMemoryStress();
          break;
        case 'all':
        default:
          results = await runner.runComprehensiveBenchmark();
          break;
      }

      // Display results summary
      this.displayBenchmarkSummary(results);

      // Save to file if specified
      if (options.output) {
        await fs.writeJson(options.output, results, { spaces: 2 });
        console.log(chalk.green(`✅ Results saved to: ${options.output}`));
      }

      await runner.cleanup();

    } catch (error) {
      this.handleCLIError(error, 'benchmark');
    }
  }

  /**
   * Handle status command
   */
  async handleStatusCommand(options) {
    if (!this.validateFeatureFlags(['duckdb_analytics'])) {
      return;
    }

    try {
      const { duckdb } = await DuckDBBMadConventions.initializeWithConventions({
        environment: options.environment
      });

      const monitor = new DuckDBResourceMonitor({ duckdb });
      const metrics = await monitor.collectMetrics();
      const stats = await duckdb.getStats();

      if (options.json) {
        const statusData = {
          status: 'running',
          environment: options.environment,
          metrics: metrics,
          stats: stats,
          timestamp: new Date().toISOString()
        };
        console.log(JSON.stringify(statusData, null, 2));
      } else {
        this.displayStatusTable(metrics, stats, options);
      }

      await duckdb.close();

    } catch (error) {
      this.handleCLIError(error, 'status');
    }
  }

  // Utility methods

  /**
   * Check if CLI integration is enabled
   */
  isIntegrationEnabled() {
    return isFeatureEnabled('duckdb_analytics') && 
           isFeatureEnabled('duckdb_cli_integration');
  }

  /**
   * Validate required feature flags
   */
  validateFeatureFlags(requiredFlags) {
    for (const flag of requiredFlags) {
      if (!isFeatureEnabled(flag)) {
        console.log(chalk.yellow(`⚠️  Feature '${flag}' is disabled`));
        console.log(chalk.blue('   Enable in config/feature-flags.yaml to use this command'));
        return false;
      }
    }
    return true;
  }

  /**
   * Validate dataset accessibility
   */
  async validateDataset(datasetPath) {
    try {
      const stat = await fs.stat(datasetPath);
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle CLI errors with BMad styling
   */
  handleCLIError(error, command, operationId = null) {
    console.error(chalk.red(`❌ Command '${command}' failed:`), error.message);
    
    if (error.code) {
      console.error(chalk.yellow(`   Error code: ${error.code}`));
    }

    // Log error
    securityLogger.logDuckDBOperation({
      operation: `cli_${command}_error`,
      operation_id: operationId,
      error: error.message,
      error_code: error.code,
      timestamp: new Date().toISOString(),
      requires_investigation: true
    });

    process.exit(1);
  }

  /**
   * Display analysis results
   */
  displayAnalysisResults(results, format) {
    switch (format) {
      case 'json':
        console.log(JSON.stringify(results, null, 2));
        break;
      case 'csv':
        this.displayResultsAsCsv(results);
        break;
      case 'table':
      default:
        this.displayResultsAsTable(results);
        break;
    }
  }

  /**
   * Display results as formatted table
   */
  displayResultsAsTable(results) {
    console.log(chalk.green('\\n📊 Analysis Results'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Records analyzed: ${chalk.cyan(results.recordCount?.toLocaleString() || 'N/A')}`);
    console.log(`Processing time: ${chalk.cyan(results.duration ? (results.duration / 1000).toFixed(2) + 's' : 'N/A')}`);
    console.log(`Peak memory: ${chalk.cyan(results.peakMemoryMB ? results.peakMemoryMB + 'MB' : 'N/A')}`);
    
    if (results.summary) {
      console.log('\\n📈 Summary Statistics:');
      Object.entries(results.summary).forEach(([key, value]) => {
        console.log(`  ${key}: ${chalk.yellow(value)}`);
      });
    }
  }

  /**
   * Display monitoring update
   */
  displayMonitoringUpdate(data) {
    const { metrics } = data;
    const timestamp = new Date(metrics.timestamp).toLocaleTimeString();
    
    process.stdout.write('\\r\\x1b[K'); // Clear line
    
    const memoryBar = this.createProgressBar(metrics.memory.duckdb_memory_percent, 100, 15);
    const cpuBar = this.createProgressBar(metrics.system.cpu_usage_percent, 100, 15);
    
    const status = data.summary.status === 'healthy' ? chalk.green('HEALTHY') : 
                   data.summary.status === 'warning' ? chalk.yellow('WARNING') : 
                   chalk.red('CRITICAL');
    
    process.stdout.write(
      `${chalk.gray(timestamp)} | ${status} | ` +
      `Memory: ${memoryBar} ${metrics.memory.duckdb_memory_percent.toFixed(1)}% | ` +
      `CPU: ${cpuBar} ${metrics.system.cpu_usage_percent.toFixed(1)}% | ` +
      `Queries: ${metrics.queries.active_queries}`
    );
  }

  /**
   * Create progress bar
   */
  createProgressBar(value, max, width) {
    const percentage = Math.min(value / max, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;
    
    const color = percentage > 0.9 ? chalk.red : percentage > 0.75 ? chalk.yellow : chalk.green;
    
    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * Display status table
   */
  displayStatusTable(metrics, stats, options) {
    console.log(chalk.green('✅ DuckDB Status'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`📊 ${chalk.bold('Memory Usage')}`);
    console.log(`   DuckDB: ${this.formatPercent(metrics.memory.duckdb_memory_percent)} (${this.formatBytes(metrics.memory.duckdb_memory_usage_bytes)})`);
    console.log(`   System: ${this.formatPercent(metrics.memory.system_memory_percent)} (${this.formatBytes(metrics.memory.system_memory_usage_bytes)})`);
    
    console.log(`\\n🔥 ${chalk.bold('Performance')}`);
    console.log(`   CPU Usage: ${this.formatPercent(metrics.system.cpu_usage_percent)}`);
    console.log(`   Active Queries: ${metrics.queries.active_queries}`);
    console.log(`   Connections: ${metrics.queries.active_connections}`);
    
    console.log(`\\n⏰ ${chalk.bold('Timestamp')}`);
    console.log(`   ${metrics.timestamp}`);
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format percentage for display
   */
  formatPercent(value) {
    const color = value > 90 ? chalk.red : value > 75 ? chalk.yellow : chalk.green;
    return color(`${value.toFixed(1)}%`);
  }

  /**
   * Perform dataset analysis (placeholder implementation)
   */
  async performDatasetAnalysis(duckdb, dataset, options) {
    const startTime = Date.now();
    
    // Basic analysis implementation
    // In a real implementation, this would contain sophisticated analysis logic
    const result = await duckdb.query(`SELECT COUNT(*) as record_count FROM read_csv_auto('${dataset}')`);
    
    return {
      recordCount: result.rows[0]?.record_count || 0,
      duration: Date.now() - startTime,
      peakMemoryMB: 256, // Placeholder
      summary: {
        'Total Records': result.rows[0]?.record_count || 0,
        'File Size': this.formatBytes(await this.getFileSize(dataset)),
        'Analysis Type': 'Basic Count'
      }
    };
  }

  /**
   * Get file size
   */
  async getFileSize(filePath) {
    try {
      const stat = await fs.stat(filePath);
      return stat.size;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = DuckDBCLIIntegration;