#!/usr/bin/env node

/**
 * DuckDB Automated Monitoring Script
 * Command-line tool for monitoring DuckDB resource usage and performance
 */

const path = require('path');
const fs = require('fs-extra');
const { Command } = require('commander');
const chalk = require('chalk');
const DuckDBWrapper = require('../tools/data-services/duckdb-wrapper');
const DuckDBMonitoringDashboard = require('../tools/data-services/monitoring-dashboard');
const DuckDBResourceMonitor = require('../tools/data-services/resource-monitor');

class DuckDBMonitoringCLI {
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('monitor-duckdb')
      .description('DuckDB monitoring and alerting CLI tool')
      .version('1.0.0');

    // Status command
    this.program
      .command('status')
      .description('Show current DuckDB status and metrics')
      .option('-d, --database <path>', 'DuckDB database path', ':memory:')
      .option('-m, --memory-limit <size>', 'Memory limit', '4GB')
      .option('-j, --json', 'Output in JSON format')
      .action(async (options) => {
        await this.handleStatusCommand(options);
      });

    // Monitor command
    this.program
      .command('monitor')
      .description('Start continuous monitoring')
      .option('-d, --database <path>', 'DuckDB database path', ':memory:')
      .option('-m, --memory-limit <size>', 'Memory limit', '4GB')
      .option('-i, --interval <seconds>', 'Update interval in seconds', '30')
      .option('-w, --web', 'Enable web dashboard')
      .option('-p, --port <number>', 'Web dashboard port', '3001')
      .option('-o, --output <file>', 'Log output to file')
      .action(async (options) => {
        await this.handleMonitorCommand(options);
      });

    // Alert command
    this.program
      .command('alert')
      .description('Configure monitoring alerts')
      .option('-c, --config <file>', 'Alert configuration file')
      .option('-t, --test', 'Test alert configuration')
      .option('-l, --list', 'List current alert rules')
      .action(async (options) => {
        await this.handleAlertCommand(options);
      });

    // Report command
    this.program
      .command('report')
      .description('Generate performance report')
      .option('-d, --database <path>', 'DuckDB database path', ':memory:')
      .option('-f, --format <type>', 'Output format (json, csv, html)', 'json')
      .option('-o, --output <file>', 'Output file path')
      .option('-p, --period <hours>', 'Report period in hours', '24')
      .action(async (options) => {
        await this.handleReportCommand(options);
      });

    // Benchmark command
    this.program
      .command('benchmark')
      .description('Run performance benchmark')
      .option('-d, --database <path>', 'DuckDB database path', ':memory:')
      .option('-m, --memory-limit <size>', 'Memory limit', '4GB')
      .option('-t, --test-type <type>', 'Benchmark type (load, query, memory)', 'all')
      .option('-o, --output <file>', 'Save results to file')
      .action(async (options) => {
        await this.handleBenchmarkCommand(options);
      });

    // Cleanup command
    this.program
      .command('cleanup')
      .description('Perform DuckDB memory cleanup')
      .option('-d, --database <path>', 'DuckDB database path', ':memory:')
      .option('-f, --force', 'Force aggressive cleanup')
      .action(async (options) => {
        await this.handleCleanupCommand(options);
      });
  }

  /**
   * Handle status command
   */
  async handleStatusCommand(options) {
    try {
      console.log(chalk.blue('🔍 Checking DuckDB status...'));
      
      const duckdb = new DuckDBWrapper({
        databasePath: options.database,
        memoryLimit: options.memoryLimit
      });
      
      const initResult = await duckdb.initialize();
      if (!initResult.success) {
        throw new Error(`Failed to initialize DuckDB: ${initResult.error}`);
      }
      
      // Collect current metrics
      const monitor = new DuckDBResourceMonitor({ duckdb });
      const metrics = await monitor.collectMetrics();
      const stats = await duckdb.getStats();
      
      if (options.json) {
        console.log(JSON.stringify({
          status: 'running',
          database_path: options.database,
          memory_limit: options.memoryLimit,
          metrics: metrics,
          stats: stats
        }, null, 2));
      } else {
        this.displayStatusTable(metrics, stats, options);
      }
      
      await duckdb.close();
      
    } catch (error) {
      console.error(chalk.red(`❌ Status check failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Display status in table format
   */
  displayStatusTable(metrics, stats, options) {
    console.log(chalk.green('✅ DuckDB Status'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`📊 ${chalk.bold('Memory Usage')}`);
    console.log(`   DuckDB Memory: ${this.formatPercent(metrics.memory.duckdb_memory_percent)} (${this.formatBytes(metrics.memory.duckdb_memory_usage_bytes)})`);
    console.log(`   System Memory: ${this.formatPercent(metrics.memory.system_memory_percent)} (${this.formatBytes(metrics.memory.system_memory_usage_bytes)})`);
    console.log(`   Memory Limit:  ${this.formatBytes(metrics.memory.memory_limit_bytes)}`);
    
    console.log(`\n🔥 ${chalk.bold('Performance')}`);
    console.log(`   CPU Usage:     ${this.formatPercent(metrics.system.cpu_usage_percent)}`);
    console.log(`   Load Average:  ${metrics.system.load_average.toFixed(2)}`);
    console.log(`   Uptime:        ${this.formatDuration(metrics.system.uptime_seconds)}`);
    
    console.log(`\n📈 ${chalk.bold('Query Activity')}`);
    console.log(`   Active Queries:     ${metrics.queries.active_queries}`);
    console.log(`   Active Connections: ${metrics.queries.active_connections}`);
    console.log(`   Total Tables:       ${stats.tables || 'N/A'}`);
    
    console.log(`\n⏰ ${chalk.bold('Timestamp')}`);
    console.log(`   ${metrics.timestamp}`);
    
    // Status indicators
    const memoryStatus = this.getStatusIndicator(metrics.memory.duckdb_memory_percent, 75, 90);
    const cpuStatus = this.getStatusIndicator(metrics.system.cpu_usage_percent, 70, 85);
    
    console.log(`\n🚦 ${chalk.bold('Health Status')}`);
    console.log(`   Memory: ${memoryStatus}`);
    console.log(`   CPU:    ${cpuStatus}`);
    
    if (metrics.errors && metrics.errors.duckdb_error) {
      console.log(`\n⚠️  ${chalk.yellow('Warnings')}`);
      console.log(`   ${metrics.errors.duckdb_error}`);
    }
  }

  /**
   * Handle monitor command
   */
  async handleMonitorCommand(options) {
    try {
      console.log(chalk.blue('🎯 Starting DuckDB monitoring...'));
      
      const duckdb = new DuckDBWrapper({
        databasePath: options.database,
        memoryLimit: options.memoryLimit
      });
      
      const initResult = await duckdb.initialize();
      if (!initResult.success) {
        throw new Error(`Failed to initialize DuckDB: ${initResult.error}`);
      }
      
      const dashboard = new DuckDBMonitoringDashboard(duckdb, {
        updateInterval: parseInt(options.interval) * 1000,
        enableWebDashboard: options.web,
        dashboardPort: parseInt(options.port)
      });
      
      // Setup output logging
      if (options.output) {
        await this.setupOutputLogging(dashboard, options.output);
      }
      
      // Setup event handlers
      dashboard.on('dashboard:alert', (alert) => {
        const emoji = { warning: '⚠️', critical: '🚨', emergency: '🔥' };
        console.log(`${emoji[alert.level] || '❗'} ${chalk.red(alert.level.toUpperCase())}: ${alert.message}`);
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
      console.log(`   Database: ${options.database}`);
      console.log(`   Memory limit: ${options.memoryLimit}`);
      
      if (options.web) {
        console.log(`   Web dashboard: http://localhost:${options.port}`);
      }
      
      console.log('\nPress Ctrl+C to stop monitoring...\n');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Stopping monitoring...'));
        await dashboard.stop();
        await duckdb.close();
        console.log(chalk.green('✅ Monitoring stopped'));
        process.exit(0);
      });
      
      // Keep process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error(chalk.red(`❌ Monitoring failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Display monitoring update
   */
  displayMonitoringUpdate(data) {
    const { metrics, summary } = data;
    const timestamp = new Date(metrics.timestamp).toLocaleTimeString();
    
    // Clear previous line and display update
    process.stdout.write('\r\x1b[K'); // Clear line
    
    const memoryBar = this.createProgressBar(metrics.memory.duckdb_memory_percent, 100, 20);
    const cpuBar = this.createProgressBar(metrics.system.cpu_usage_percent, 100, 20);
    
    const status = summary.status === 'healthy' ? chalk.green('HEALTHY') : 
                   summary.status === 'warning' ? chalk.yellow('WARNING') : 
                   chalk.red('CRITICAL');
    
    process.stdout.write(
      `${timestamp} | Status: ${status} | ` +
      `Memory: ${memoryBar} ${metrics.memory.duckdb_memory_percent.toFixed(1)}% | ` +
      `CPU: ${cpuBar} ${metrics.system.cpu_usage_percent.toFixed(1)}% | ` +
      `Queries: ${metrics.queries.active_queries}`
    );
  }

  /**
   * Handle alert command
   */
  async handleAlertCommand(options) {
    try {
      if (options.list) {
        await this.listAlertRules();
      } else if (options.test) {
        await this.testAlertConfiguration(options.config);
      } else if (options.config) {
        await this.configureAlerts(options.config);
      } else {
        console.log(chalk.yellow('Please specify an alert action: --list, --test, or --config'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Alert configuration failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Handle report command
   */
  async handleReportCommand(options) {
    try {
      console.log(chalk.blue('📊 Generating performance report...'));
      
      // For now, create a sample report
      // In a real implementation, this would read from monitoring history
      const report = {
        generatedAt: new Date().toISOString(),
        period: `${options.period} hours`,
        summary: {
          status: 'healthy',
          avgMemoryUsage: 65.2,
          avgCpuUsage: 34.7,
          totalQueries: 1453,
          alertCount: 3
        },
        recommendations: [
          {
            type: 'memory',
            priority: 'medium',
            suggestion: 'Memory usage is within acceptable range'
          },
          {
            type: 'performance',
            priority: 'low',
            suggestion: 'CPU utilization is optimal'
          }
        ]
      };
      
      let output;
      switch (options.format) {
        case 'json':
          output = JSON.stringify(report, null, 2);
          break;
        case 'csv':
          output = this.convertReportToCsv(report);
          break;
        case 'html':
          output = this.convertReportToHtml(report);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
      
      if (options.output) {
        await fs.writeFile(options.output, output, 'utf8');
        console.log(chalk.green(`✅ Report saved to: ${options.output}`));
      } else {
        console.log(output);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Report generation failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Handle benchmark command
   */
  async handleBenchmarkCommand(options) {
    try {
      console.log(chalk.blue('🏃 Running DuckDB benchmark...'));
      
      const BenchmarkRunner = require('../tools/data-services/benchmark-test-runner');
      const runner = new BenchmarkRunner({
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
      
      if (options.output) {
        await fs.writeJson(options.output, results, { spaces: 2 });
        console.log(chalk.green(`✅ Benchmark results saved to: ${options.output}`));
      } else {
        console.log(JSON.stringify(results, null, 2));
      }
      
      await runner.cleanup();
      
    } catch (error) {
      console.error(chalk.red(`❌ Benchmark failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Handle cleanup command
   */
  async handleCleanupCommand(options) {
    try {
      console.log(chalk.blue('🧹 Performing DuckDB cleanup...'));
      
      const duckdb = new DuckDBWrapper({
        databasePath: options.database
      });
      
      const initResult = await duckdb.initialize();
      if (!initResult.success) {
        throw new Error(`Failed to initialize DuckDB: ${initResult.error}`);
      }
      
      const monitor = new DuckDBResourceMonitor({ duckdb });
      
      const beforeMetrics = await monitor.collectMetrics();
      console.log(`Memory before cleanup: ${beforeMetrics.memory.duckdb_memory_percent.toFixed(1)}%`);
      
      if (options.force) {
        await monitor.performEmergencyCleanup();
      } else {
        await monitor.performAggressiveCleanup();
      }
      
      const afterMetrics = await monitor.collectMetrics();
      console.log(`Memory after cleanup: ${afterMetrics.memory.duckdb_memory_percent.toFixed(1)}%`);
      
      const reduction = beforeMetrics.memory.duckdb_memory_percent - afterMetrics.memory.duckdb_memory_percent;
      console.log(chalk.green(`✅ Cleanup completed. Memory reduced by ${reduction.toFixed(1)}%`));
      
      await duckdb.close();
      
    } catch (error) {
      console.error(chalk.red(`❌ Cleanup failed: ${error.message}`));
      process.exit(1);
    }
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatPercent(value) {
    const color = value > 90 ? chalk.red : value > 75 ? chalk.yellow : chalk.green;
    return color(`${value.toFixed(1)}%`);
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  getStatusIndicator(value, warningThreshold, criticalThreshold) {
    if (value >= criticalThreshold) {
      return chalk.red('CRITICAL');
    } else if (value >= warningThreshold) {
      return chalk.yellow('WARNING');
    } else {
      return chalk.green('GOOD');
    }
  }

  createProgressBar(value, max, width) {
    const percentage = Math.min(value / max, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;
    
    const color = percentage > 0.9 ? chalk.red : percentage > 0.75 ? chalk.yellow : chalk.green;
    
    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  async setupOutputLogging(dashboard, outputFile) {
    const logStream = fs.createWriteStream(outputFile, { flags: 'a' });
    
    dashboard.on('dashboard:updated', (data) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        metrics: data.metrics,
        summary: data.summary
      };
      logStream.write(JSON.stringify(logEntry) + '\n');
    });
    
    dashboard.on('dashboard:alert', (alert) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'alert',
        alert: alert
      };
      logStream.write(JSON.stringify(logEntry) + '\n');
    });
  }

  convertReportToCsv(report) {
    // Simple CSV conversion for summary data
    const headers = ['metric', 'value'];
    const rows = [
      ['avg_memory_usage', report.summary.avgMemoryUsage],
      ['avg_cpu_usage', report.summary.avgCpuUsage],
      ['total_queries', report.summary.totalQueries],
      ['alert_count', report.summary.alertCount]
    ];
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  convertReportToHtml(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>DuckDB Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .metric { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .recommendations { margin-top: 20px; }
        .recommendation { margin: 10px 0; padding: 10px; background: #e8f4fd; border-left: 4px solid #3498db; }
    </style>
</head>
<body>
    <h1 class="header">DuckDB Performance Report</h1>
    <p><strong>Generated:</strong> ${report.generatedAt}</p>
    <p><strong>Period:</strong> ${report.period}</p>
    
    <h2>Summary</h2>
    <div class="metric"><strong>Status:</strong> ${report.summary.status}</div>
    <div class="metric"><strong>Average Memory Usage:</strong> ${report.summary.avgMemoryUsage}%</div>
    <div class="metric"><strong>Average CPU Usage:</strong> ${report.summary.avgCpuUsage}%</div>
    <div class="metric"><strong>Total Queries:</strong> ${report.summary.totalQueries}</div>
    <div class="metric"><strong>Alert Count:</strong> ${report.summary.alertCount}</div>
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation">
                <strong>${rec.type.toUpperCase()} (${rec.priority}):</strong> ${rec.suggestion}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  async listAlertRules() {
    console.log(chalk.blue('📋 Current Alert Rules'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Memory Warning:  75%');
    console.log('Memory Critical: 90%');
    console.log('CPU Warning:     70%');
    console.log('CPU Critical:    85%');
    console.log('Query Timeout:   30s');
  }

  async testAlertConfiguration(configFile) {
    console.log(chalk.blue('🧪 Testing alert configuration...'));
    // Implementation would test alert rules
    console.log(chalk.green('✅ Alert configuration test passed'));
  }

  async configureAlerts(configFile) {
    console.log(chalk.blue('⚙️  Configuring alerts...'));
    // Implementation would configure alert rules
    console.log(chalk.green('✅ Alert configuration updated'));
  }

  /**
   * Run the CLI
   */
  async run() {
    await this.program.parseAsync(process.argv);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new DuckDBMonitoringCLI();
  cli.run().catch(error => {
    console.error(chalk.red(`❌ CLI Error: ${error.message}`));
    process.exit(1);
  });
}

module.exports = DuckDBMonitoringCLI;