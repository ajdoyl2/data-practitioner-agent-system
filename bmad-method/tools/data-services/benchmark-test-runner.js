/**
 * DuckDB Benchmark Test Runner
 * Automated performance testing and baseline validation
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const DuckDBWrapper = require('./duckdb-wrapper');
const { securityLogger } = require('../lib/security-logger');

class DuckDBBenchmarkRunner {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './benchmark-results';
    this.duckdb = null;
    this.baselines = new Map();
    this.currentSession = {
      sessionId: crypto.randomUUID(),
      startTime: new Date(),
      results: []
    };
  }

  /**
   * Initialize benchmark environment
   */
  async initialize() {
    await fs.ensureDir(this.outputDir);
    
    this.duckdb = new DuckDBWrapper({
      memoryLimit: '4GB',
      maxConnections: 10,
      databasePath: ':memory:'
    });
    
    const initResult = await this.duckdb.initialize();
    if (!initResult.success) {
      throw new Error(`Failed to initialize DuckDB: ${initResult.error}`);
    }
    
    await this.loadBaselines();
    console.log('Benchmark environment initialized');
  }

  /**
   * Generate synthetic test datasets
   */
  generateTestDatasets() {
    return {
      small: this.generateTransactionData(1000, 'small'),
      medium: this.generateTransactionData(100000, 'medium'),
      large: this.generateTransactionData(1000000, 'large'),
      very_large: this.generateTransactionData(10000000, 'very_large')
    };
  }

  /**
   * Generate synthetic transaction data
   */
  generateTransactionData(rowCount, sizeCategory) {
    const data = [];
    const startDate = new Date('2023-01-01');
    const categories = ['groceries', 'entertainment', 'utilities', 'transport', 'healthcare', 'shopping'];
    const statuses = ['completed', 'pending', 'failed', 'refunded'];
    
    for (let i = 0; i < rowCount; i++) {
      data.push({
        id: i + 1,
        transaction_date: new Date(startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        amount: Math.round((Math.random() * 1000 + 10) * 100) / 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        merchant_id: Math.floor(Math.random() * 1000) + 1,
        customer_id: Math.floor(Math.random() * 10000) + 1,
        status: Math.random() > 0.1 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)],
        description: `Transaction ${i + 1} - ${categories[Math.floor(Math.random() * categories.length)]}`,
        reference_id: crypto.randomUUID()
      });
    }
    
    return {
      name: `transactions_${sizeCategory}`,
      sizeCategory,
      rowCount,
      estimatedSizeBytes: rowCount * 200, // Rough estimate
      data
    };
  }

  /**
   * Load test data into DuckDB
   */
  async loadTestData(dataset) {
    const tableName = dataset.name;
    
    // Create table with proper schema
    await this.duckdb.execute(`
      CREATE OR REPLACE TABLE ${tableName} (
        id INTEGER,
        transaction_date TIMESTAMP,
        amount DECIMAL(10,2),
        category VARCHAR,
        merchant_id INTEGER,
        customer_id INTEGER,
        status VARCHAR,
        description VARCHAR,
        reference_id VARCHAR
      )
    `);
    
    // Insert data in batches for large datasets
    const batchSize = 10000;
    const batches = Math.ceil(dataset.data.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min((i + 1) * batchSize, dataset.data.length);
      const batch = dataset.data.slice(startIdx, endIdx);
      
      const values = batch.map(row => 
        `(${row.id}, '${row.transaction_date}', ${row.amount}, '${row.category}', ${row.merchant_id}, ${row.customer_id}, '${row.status}', '${row.description.replace(/'/g, "''")}', '${row.reference_id}')`
      ).join(',');
      
      await this.duckdb.execute(`INSERT INTO ${tableName} VALUES ${values}`);
    }
    
    return tableName;
  }

  /**
   * Run load performance benchmark
   */
  async benchmarkLoadPerformance() {
    const results = [];
    const datasets = this.generateTestDatasets();
    
    for (const [size, dataset] of Object.entries(datasets)) {
      console.log(`Benchmarking load performance for ${size} dataset (${dataset.rowCount} rows)...`);
      
      const startTime = performance.now();
      const memoryBefore = await this.getMemoryStats();
      
      try {
        const tableName = await this.loadTestData(dataset);
        const loadTime = performance.now() - startTime;
        const memoryAfter = await this.getMemoryStats();
        
        // Verify data loaded correctly
        const countResult = await this.duckdb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const actualRows = countResult.data[0]?.count || 0;
        
        results.push({
          dataset_size: size,
          row_count: dataset.rowCount,
          actual_rows: actualRows,
          load_time_ms: Math.round(loadTime),
          load_rate_rows_per_sec: Math.round(actualRows / (loadTime / 1000)),
          memory_before_mb: Math.round(memoryBefore.memory_usage / 1024 / 1024),
          memory_after_mb: Math.round(memoryAfter.memory_usage / 1024 / 1024),
          memory_delta_mb: Math.round((memoryAfter.memory_usage - memoryBefore.memory_usage) / 1024 / 1024),
          success: actualRows === dataset.rowCount
        });
        
      } catch (error) {
        results.push({
          dataset_size: size,
          row_count: dataset.rowCount,
          error: error.message,
          load_time_ms: Math.round(performance.now() - startTime),
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * Run query performance benchmark
   */
  async benchmarkQueryPerformance() {
    // First load a medium dataset for testing
    const dataset = this.generateTransactionData(100000, 'medium');
    const tableName = await this.loadTestData(dataset);
    
    const querySet = [
      {
        name: 'simple_select',
        type: 'select',
        sql: `SELECT * FROM ${tableName} LIMIT 1000`,
        description: 'Simple select with limit'
      },
      {
        name: 'count_all',
        type: 'aggregation',
        sql: `SELECT COUNT(*) FROM ${tableName}`,
        description: 'Count all rows'
      },
      {
        name: 'sum_aggregation',
        type: 'aggregation',
        sql: `SELECT SUM(amount) as total_amount FROM ${tableName}`,
        description: 'Sum aggregation'
      },
      {
        name: 'group_by_category',
        type: 'aggregation',
        sql: `SELECT category, COUNT(*) as count, AVG(amount) as avg_amount FROM ${tableName} GROUP BY category`,
        description: 'Group by with aggregations'
      },
      {
        name: 'date_filtering',
        type: 'filtering',
        sql: `SELECT * FROM ${tableName} WHERE transaction_date > '2023-06-01' AND status = 'completed'`,
        description: 'Date and status filtering'
      },
      {
        name: 'amount_range',
        type: 'filtering',
        sql: `SELECT * FROM ${tableName} WHERE amount BETWEEN 100 AND 500 ORDER BY amount DESC`,
        description: 'Range filtering with sorting'
      },
      {
        name: 'pattern_matching',
        type: 'string',
        sql: `SELECT * FROM ${tableName} WHERE description LIKE '%groceries%'`,
        description: 'String pattern matching'
      },
      {
        name: 'complex_aggregation',
        type: 'complex',
        sql: `
          SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            MIN(amount) as min_amount,
            MAX(amount) as max_amount,
            STDDEV(amount) as amount_stddev
          FROM ${tableName} 
          WHERE status = 'completed'
          GROUP BY category 
          HAVING COUNT(*) > 1000
          ORDER BY total_amount DESC
        `,
        description: 'Complex aggregation with multiple functions'
      }
    ];
    
    const results = [];
    
    for (const query of querySet) {
      console.log(`Running query benchmark: ${query.name}`);
      
      const startTime = performance.now();
      const memoryBefore = await this.getMemoryStats();
      
      try {
        const result = await this.duckdb.execute(query.sql);
        const executionTime = performance.now() - startTime;
        const memoryAfter = await this.getMemoryStats();
        
        results.push({
          query_name: query.name,
          query_type: query.type,
          description: query.description,
          execution_time_ms: Math.round(executionTime),
          row_count: result.data.length,
          memory_before_mb: Math.round(memoryBefore.memory_usage / 1024 / 1024),
          memory_after_mb: Math.round(memoryAfter.memory_usage / 1024 / 1024),
          memory_delta_mb: Math.round((memoryAfter.memory_usage - memoryBefore.memory_usage) / 1024 / 1024),
          success: result.success
        });
        
      } catch (error) {
        results.push({
          query_name: query.name,
          query_type: query.type,
          description: query.description,
          execution_time_ms: Math.round(performance.now() - startTime),
          error: error.message,
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * Run memory stress test
   */
  async benchmarkMemoryStress() {
    const results = [];
    let currentRowCount = 1000;
    const maxRowCount = 5000000; // 5M rows max to prevent system instability
    
    while (currentRowCount <= maxRowCount) {
      console.log(`Memory stress test with ${currentRowCount} rows...`);
      
      const dataset = this.generateTransactionData(currentRowCount, `stress_${currentRowCount}`);
      const startTime = performance.now();
      
      try {
        const tableName = await this.loadTestData(dataset);
        const loadTime = performance.now() - startTime;
        const memoryStats = await this.getMemoryStats();
        
        // Run a few standard queries to test performance under memory pressure
        const queryStartTime = performance.now();
        const queryResults = await Promise.all([
          this.duckdb.execute(`SELECT COUNT(*) FROM ${tableName}`),
          this.duckdb.execute(`SELECT category, AVG(amount) FROM ${tableName} GROUP BY category`),
          this.duckdb.execute(`SELECT * FROM ${tableName} WHERE amount > 500 ORDER BY amount DESC LIMIT 100`)
        ]);
        const queryTime = performance.now() - queryStartTime;
        
        results.push({
          row_count: currentRowCount,
          load_time_ms: Math.round(loadTime),
          query_time_ms: Math.round(queryTime),
          memory_usage_mb: Math.round(memoryStats.memory_usage / 1024 / 1024),
          memory_percent: memoryStats.memory_percent,
          spill_detected: memoryStats.memory_percent > 80,
          load_rate_rows_per_sec: Math.round(currentRowCount / (loadTime / 1000)),
          success: true
        });
        
        // Clean up
        await this.duckdb.execute(`DROP TABLE ${tableName}`);
        
        // If we're approaching memory limits, stop the test
        if (memoryStats.memory_percent > 90) {
          console.log('Stopping stress test due to high memory usage');
          break;
        }
        
      } catch (error) {
        results.push({
          row_count: currentRowCount,
          error: error.message,
          load_time_ms: Math.round(performance.now() - startTime),
          success: false
        });
        
        // If we hit memory limits, stop the test
        if (error.message.includes('memory') || error.message.includes('Memory')) {
          console.log('Stopping stress test due to memory error');
          break;
        }
      }
      
      currentRowCount *= 2; // Double the row count each iteration
    }
    
    return results;
  }

  /**
   * Get current memory statistics
   */
  async getMemoryStats() {
    try {
      const stats = await this.duckdb.getStats();
      return {
        memory_usage: process.memoryUsage().heapUsed,
        memory_percent: (process.memoryUsage().heapUsed / (1024 * 1024 * 1024)) * 100, // Rough percentage
        active_queries: stats.active_queries || 0
      };
    } catch (error) {
      return {
        memory_usage: process.memoryUsage().heapUsed,
        memory_percent: 0,
        active_queries: 0,
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runComprehensiveBenchmark() {
    console.log('Starting comprehensive DuckDB benchmark suite...');
    
    const benchmarkStart = performance.now();
    
    try {
      // Run all benchmark categories
      const loadResults = await this.benchmarkLoadPerformance();
      const queryResults = await this.benchmarkQueryPerformance();
      const memoryResults = await this.benchmarkMemoryStress();
      
      const benchmarkTime = performance.now() - benchmarkStart;
      
      const report = {
        session_id: this.currentSession.sessionId,
        timestamp: new Date().toISOString(),
        total_time_ms: Math.round(benchmarkTime),
        environment: {
          node_version: process.version,
          platform: process.platform,
          memory_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          duckdb_config: {
            memory_limit: this.duckdb.memoryLimit,
            max_connections: this.duckdb.maxConnections
          }
        },
        results: {
          load_performance: loadResults,
          query_performance: queryResults,
          memory_stress: memoryResults
        },
        summary: this.generateBenchmarkSummary(loadResults, queryResults, memoryResults)
      };
      
      // Save report
      await this.saveBenchmarkReport(report);
      
      // Log to security logger
      securityLogger.logDuckDBOperation({
        operation: 'benchmark_complete',
        session_id: this.currentSession.sessionId,
        total_time_ms: Math.round(benchmarkTime),
        test_categories: ['load', 'query', 'memory'],
        timestamp: new Date().toISOString()
      });
      
      console.log('Benchmark suite completed successfully');
      return report;
      
    } catch (error) {
      console.error('Benchmark suite failed:', error);
      throw error;
    }
  }

  /**
   * Generate benchmark summary
   */
  generateBenchmarkSummary(loadResults, queryResults, memoryResults) {
    const summary = {
      load_performance: {
        total_tests: loadResults.length,
        successful_tests: loadResults.filter(r => r.success).length,
        avg_load_rate: Math.round(
          loadResults.filter(r => r.success).reduce((sum, r) => sum + r.load_rate_rows_per_sec, 0) / 
          loadResults.filter(r => r.success).length
        )
      },
      query_performance: {
        total_queries: queryResults.length,
        successful_queries: queryResults.filter(r => r.success).length,
        avg_execution_time: Math.round(
          queryResults.filter(r => r.success).reduce((sum, r) => sum + r.execution_time_ms, 0) / 
          queryResults.filter(r => r.success).length
        )
      },
      memory_stress: {
        max_rows_tested: Math.max(...memoryResults.map(r => r.row_count)),
        max_memory_usage_mb: Math.max(...memoryResults.filter(r => r.success).map(r => r.memory_usage_mb || 0)),
        spill_detected: memoryResults.some(r => r.spill_detected)
      }
    };
    
    return summary;
  }

  /**
   * Save benchmark report
   */
  async saveBenchmarkReport(report) {
    const filename = `benchmark-report-${this.currentSession.sessionId}-${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeJson(filepath, report, { spaces: 2 });
    console.log(`Benchmark report saved: ${filepath}`);
  }

  /**
   * Load historical baselines
   */
  async loadBaselines() {
    const baselineFile = path.join(this.outputDir, 'baselines.json');
    
    if (await fs.pathExists(baselineFile)) {
      try {
        const baselines = await fs.readJson(baselineFile);
        this.baselines = new Map(Object.entries(baselines));
        console.log('Historical baselines loaded');
      } catch (error) {
        console.warn('Could not load baselines:', error.message);
      }
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.duckdb) {
      await this.duckdb.close();
    }
  }
}

module.exports = DuckDBBenchmarkRunner;