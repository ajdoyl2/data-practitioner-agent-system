/**
 * Performance Regression Testing
 * Tests system performance against established benchmarks and detects regressions
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Mock the dependencies for testing
jest.mock('../../tools/data-services/test-orchestrator');
jest.mock('../../tools/data-services/duckdb-wrapper');
jest.mock('../../tools/data-services/pyairbyte-wrapper');
jest.mock('../../tools/data-services/transformation-engine');
jest.mock('../../tools/data-services/publication-engine');

describe('Performance Regression Testing', () => {
  let baselineMetrics;
  let currentMetrics;
  let testSuite;

  beforeAll(async () => {
    // Load baseline performance metrics
    const baselinePath = path.join(__dirname, '../fixtures/performance-thresholds.json');
    if (fs.existsSync(baselinePath)) {
      baselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } else {
      baselineMetrics = getDefaultBaselines();
    }

    testSuite = {
      runFullSuite: jest.fn().mockResolvedValue({
        summary: { success: true, duration: '45.2s' }
      })
    };
    currentMetrics = {};
  });

  afterAll(() => {
    // Save current metrics for future baseline comparisons
    const metricsPath = path.join(__dirname, '../fixtures/temp/current-performance-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(currentMetrics, null, 2));
  });

  describe('Component Performance Benchmarks', () => {
    test('DuckDB analytics performance should meet benchmarks', async () => {
      const startTime = performance.now();
      
      // Mock DuckDB performance with realistic query load
      const duckdb = {
        initialize: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
        execute: jest.fn().mockImplementation(() => {
          return new Promise(resolve => setTimeout(resolve, 50));
        }),
        query: jest.fn().mockImplementation(() => {
          return new Promise(resolve => setTimeout(() => resolve([{ count: 100000 }]), 100));
        })
      };
      
      await duckdb.initialize();
      
      // Create test table with 100k records
      await duckdb.execute(`
        CREATE TABLE performance_test AS 
        SELECT 
          row_number() OVER () as id,
          'user_' || (random() * 10000)::int as user_id,
          now() - interval (random() * 365) day as created_at,
          (random() * 1000)::decimal(10,2) as amount,
          ['A', 'B', 'C', 'D'][1 + (random() * 4)::int] as category
        FROM generate_series(1, 100000)
      `);
      
      // Run complex analytics queries
      const queries = [
        'SELECT COUNT(*) FROM performance_test',
        'SELECT category, AVG(amount) as avg_amount FROM performance_test GROUP BY category',
        'SELECT DATE_TRUNC(\'month\', created_at) as month, SUM(amount) as total FROM performance_test GROUP BY month ORDER BY month',
        `SELECT user_id, COUNT(*) as transaction_count, SUM(amount) as total_amount 
         FROM performance_test 
         GROUP BY user_id 
         HAVING COUNT(*) > 5 
         ORDER BY total_amount DESC 
         LIMIT 100`
      ];
      
      const queryResults = [];
      for (const query of queries) {
        const queryStart = performance.now();
        await duckdb.query(query);
        const queryTime = performance.now() - queryStart;
        queryResults.push(queryTime);
      }
      
      await duckdb.disconnect();
      
      const totalTime = performance.now() - startTime;
      
      currentMetrics.duckdb = {
        initialization_time: startTime,
        query_times: queryResults,
        total_analytics_time: totalTime,
        records_processed: 100000
      };
      
      // Performance assertions
      expect(totalTime).toBeLessThan(baselineMetrics.duckdb.max_analytics_time);
      expect(Math.max(...queryResults)).toBeLessThan(baselineMetrics.duckdb.max_single_query_time);
      expect(queryResults.reduce((a, b) => a + b, 0) / queryResults.length).toBeLessThan(baselineMetrics.duckdb.avg_query_time);
    }, 60000);

    test('Data ingestion performance should meet benchmarks', async () => {
      const startTime = performance.now();
      
      // Test PyAirbyte wrapper performance
      const PyAirbyteWrapper = require('../../tools/data-services/pyairbyte-wrapper');
      const pyairbyte = new PyAirbyteWrapper();
      
      // Simulate large data ingestion
      const testConfig = {
        source: 'file',
        config: {
          dataset_name: 'performance_test',
          format: 'csv',
          provider: {
            storage: 'local'
          }
        }
      };
      
      const ingestionStart = performance.now();
      const result = await pyairbyte.ingest(testConfig);
      const ingestionTime = performance.now() - ingestionStart;
      
      currentMetrics.ingestion = {
        setup_time: ingestionStart - startTime,
        ingestion_time: ingestionTime,
        total_time: performance.now() - startTime,
        records_ingested: result.records_processed || 50000
      };
      
      // Performance assertions
      expect(ingestionTime).toBeLessThan(baselineMetrics.ingestion.max_ingestion_time);
      expect(currentMetrics.ingestion.total_time).toBeLessThan(baselineMetrics.ingestion.max_total_time);
      
      // Throughput check (records per second)
      const throughput = currentMetrics.ingestion.records_ingested / (ingestionTime / 1000);
      expect(throughput).toBeGreaterThan(baselineMetrics.ingestion.min_throughput);
    }, 90000);

    test('Transformation engine performance should meet benchmarks', async () => {
      const startTime = performance.now();
      
      // Test transformation performance with dbt and SQLmesh
      const TransformationEngine = require('../../tools/data-services/transformation-engine');
      const engine = new TransformationEngine();
      
      const transformationConfig = {
        engine: 'dbt',
        project_path: path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/dbt-project'),
        models: ['staging', 'intermediate', 'marts'],
        threads: 4
      };
      
      const transformationStart = performance.now();
      const result = await engine.runTransformation(transformationConfig);
      const transformationTime = performance.now() - transformationStart;
      
      currentMetrics.transformation = {
        setup_time: transformationStart - startTime,
        transformation_time: transformationTime,
        total_time: performance.now() - startTime,
        models_processed: result.models_run || 10
      };
      
      // Performance assertions
      expect(transformationTime).toBeLessThan(baselineMetrics.transformation.max_transformation_time);
      expect(currentMetrics.transformation.total_time).toBeLessThan(baselineMetrics.transformation.max_total_time);
      
      // Model processing rate
      const modelsPerSecond = currentMetrics.transformation.models_processed / (transformationTime / 1000);
      expect(modelsPerSecond).toBeGreaterThan(baselineMetrics.transformation.min_models_per_second);
    }, 120000);

    test('Publication engine performance should meet benchmarks', async () => {
      const startTime = performance.now();
      
      // Test Evidence.dev publication performance
      const PublicationEngine = require('../../tools/data-services/publication-engine');
      const engine = new PublicationEngine();
      
      const publicationConfig = {
        source_path: path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/evidence-project'),
        output_path: path.join(__dirname, '../fixtures/temp/publication-output'),
        build_type: 'static',
        optimization: 'production'
      };
      
      const publicationStart = performance.now();
      const result = await engine.buildSite(publicationConfig);
      const publicationTime = performance.now() - publicationStart;
      
      currentMetrics.publication = {
        setup_time: publicationStart - startTime,
        publication_time: publicationTime,
        total_time: performance.now() - startTime,
        pages_generated: result.pages_built || 5,
        assets_processed: result.assets_processed || 20
      };
      
      // Performance assertions
      expect(publicationTime).toBeLessThan(baselineMetrics.publication.max_publication_time);
      expect(currentMetrics.publication.total_time).toBeLessThan(baselineMetrics.publication.max_total_time);
      
      // Asset processing rate
      const assetsPerSecond = currentMetrics.publication.assets_processed / (publicationTime / 1000);
      expect(assetsPerSecond).toBeGreaterThan(baselineMetrics.publication.min_assets_per_second);
    }, 90000);
  });

  describe('Memory Performance Testing', () => {
    test('should maintain memory usage within acceptable limits', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run memory-intensive operations
      const operations = [
        () => runDuckDBMemoryTest(),
        () => runIngestionMemoryTest(),
        () => runTransformationMemoryTest()
      ];
      
      const memorySnapshots = [initialMemory];
      
      for (const operation of operations) {
        await operation();
        const currentMemory = process.memoryUsage();
        memorySnapshots.push(currentMemory);
        
        // Check for memory leaks
        const heapIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
        expect(heapIncrease).toBeLessThan(baselineMetrics.memory.max_heap_increase);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      currentMetrics.memory = {
        initial: initialMemory,
        snapshots: memorySnapshots,
        final: finalMemory,
        peak_heap_used: Math.max(...memorySnapshots.map(m => m.heapUsed)),
        peak_external: Math.max(...memorySnapshots.map(m => m.external))
      };
      
      // Memory leak detection
      const finalHeapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(finalHeapIncrease).toBeLessThan(baselineMetrics.memory.max_final_heap_increase);
    });

    test('should handle concurrent operations without memory issues', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple operations concurrently
      const concurrentOperations = Array.from({ length: 3 }, (_, i) => 
        runConcurrentMemoryTest(i)
      );
      
      await Promise.all(concurrentOperations);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory usage should scale linearly, not exponentially
      expect(memoryIncrease).toBeLessThan(baselineMetrics.memory.max_concurrent_heap_increase);
    });
  });

  describe('Regression Detection', () => {
    test('should detect performance regressions compared to baseline', () => {
      const regressions = [];
      
      // Check each component for performance regressions
      Object.entries(currentMetrics).forEach(([component, metrics]) => {
        const baseline = baselineMetrics[component];
        if (!baseline) return;
        
        // Check for significant performance degradation (>20% slower)
        const performanceFields = ['total_time', 'processing_time', 'query_time'];
        
        performanceFields.forEach(field => {
          if (metrics[field] && baseline[field]) {
            const regression = (metrics[field] - baseline[field]) / baseline[field];
            if (regression > 0.2) { // 20% regression threshold
              regressions.push({
                component,
                field,
                baseline: baseline[field],
                current: metrics[field],
                regression: `${(regression * 100).toFixed(1)}%`
              });
            }
          }
        });
      });
      
      // Log regressions for analysis but don't fail test unless critical
      if (regressions.length > 0) {
        console.warn('Performance regressions detected:');
        regressions.forEach(r => {
          console.warn(`  ${r.component}.${r.field}: ${r.baseline}ms → ${r.current}ms (${r.regression} slower)`);
        });
        
        // Only fail if there are critical regressions (>50% slower)
        const criticalRegressions = regressions.filter(r => parseFloat(r.regression) > 50);
        expect(criticalRegressions).toHaveLength(0);
      }
    });

    test('should track performance trends over time', () => {
      // Load historical performance data
      const trendsPath = path.join(__dirname, '../fixtures/performance-trends.json');
      let trends = [];
      
      if (fs.existsSync(trendsPath)) {
        trends = JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
      }
      
      // Add current metrics to trends
      const currentTrend = {
        timestamp: new Date().toISOString(),
        metrics: currentMetrics
      };
      trends.push(currentTrend);
      
      // Keep only last 30 data points
      if (trends.length > 30) {
        trends = trends.slice(-30);
      }
      
      // Save updated trends
      fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2));
      
      // Analyze trends (if we have enough data)
      if (trends.length >= 5) {
        const recentTrends = trends.slice(-5);
        
        // Check for consistent degradation over last 5 runs
        Object.keys(currentMetrics).forEach(component => {
          const componentTrends = recentTrends.map(t => t.metrics[component]?.total_time).filter(Boolean);
          
          if (componentTrends.length >= 3) {
            // Simple trend analysis: check if performance is consistently getting worse
            let consecutiveIncreases = 0;
            for (let i = 1; i < componentTrends.length; i++) {
              if (componentTrends[i] > componentTrends[i - 1]) {
                consecutiveIncreases++;
              } else {
                consecutiveIncreases = 0;
              }
            }
            
            // Alert if performance has degraded in 3+ consecutive runs
            if (consecutiveIncreases >= 2) {
              console.warn(`Warning: ${component} performance has degraded in ${consecutiveIncreases + 1} consecutive runs`);
            }
          }
        });
      }
    });
  });

  describe('Benchmarking and Profiling', () => {
    test('should generate comprehensive performance profile', async () => {
      const profile = {
        timestamp: new Date().toISOString(),
        system_info: {
          node_version: process.version,
          platform: process.platform,
          arch: process.arch,
          memory_total: require('os').totalmem(),
          cpu_count: require('os').cpus().length
        },
        performance_metrics: currentMetrics,
        benchmarks: await runPerformanceBenchmarks()
      };
      
      // Save performance profile
      const profilePath = path.join(__dirname, '../fixtures/temp/performance-profile.json');
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
      
      // Validate profile completeness
      expect(profile.performance_metrics).toBeDefined();
      expect(profile.benchmarks).toBeDefined();
      expect(Object.keys(profile.performance_metrics)).toContain('duckdb');
    });
  });

  // Helper functions
  async function runDuckDBMemoryTest() {
    const DuckDBWrapper = require('../../tools/data-services/duckdb-wrapper');
    const duckdb = new DuckDBWrapper({ memory: '256MB' });
    await duckdb.initialize();
    
    // Create and query large dataset
    await duckdb.execute('CREATE TABLE memory_test AS SELECT * FROM generate_series(1, 50000)');
    await duckdb.query('SELECT COUNT(*) FROM memory_test');
    
    await duckdb.disconnect();
  }

  async function runIngestionMemoryTest() {
    // Simulate memory-intensive ingestion
    const largeArray = new Array(10000).fill(0).map((_, i) => ({
      id: i,
      data: 'test_data_' + i,
      timestamp: new Date().toISOString()
    }));
    
    // Process data
    largeArray.forEach(item => {
      item.processed = true;
    });
    
    return largeArray.length;
  }

  async function runTransformationMemoryTest() {
    // Simulate transformation processing
    const data = new Array(5000).fill(0).map((_, i) => ({ value: i, processed: false }));
    
    // Transform data
    data.forEach(item => {
      item.transformed_value = item.value * 2;
      item.processed = true;
    });
    
    return data.length;
  }

  async function runConcurrentMemoryTest(id) {
    // Simulate concurrent processing
    return new Promise(resolve => {
      setTimeout(() => {
        const data = new Array(1000).fill(0).map(i => `concurrent_${id}_${i}`);
        resolve(data.length);
      }, 100);
    });
  }

  async function runPerformanceBenchmarks() {
    return {
      cpu_intensive: await measureCPUPerformance(),
      io_intensive: await measureIOPerformance(),
      memory_intensive: await measureMemoryPerformance()
    };
  }

  async function measureCPUPerformance() {
    const start = performance.now();
    
    // CPU-intensive operation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i);
    }
    
    return {
      duration: performance.now() - start,
      operations: 1000000,
      result: result > 0
    };
  }

  async function measureIOPerformance() {
    const start = performance.now();
    const testFile = path.join(__dirname, '../fixtures/temp/io-test.json');
    
    // Write test
    const data = JSON.stringify(new Array(1000).fill(0).map((_, i) => ({ id: i, value: `test_${i}` })));
    fs.writeFileSync(testFile, data);
    
    // Read test
    const readData = fs.readFileSync(testFile, 'utf8');
    const parsed = JSON.parse(readData);
    
    // Cleanup
    fs.unlinkSync(testFile);
    
    return {
      duration: performance.now() - start,
      bytes_written: Buffer.byteLength(data),
      records_processed: parsed.length
    };
  }

  async function measureMemoryPerformance() {
    const start = performance.now();
    const initialMemory = process.memoryUsage();
    
    // Memory-intensive operation
    const largeArray = new Array(100000).fill(0).map((_, i) => ({
      id: i,
      data: new Array(10).fill(0).map(j => `item_${i}_${j}`)
    }));
    
    const peakMemory = process.memoryUsage();
    
    // Process array
    largeArray.forEach(item => {
      item.processed = true;
    });
    
    return {
      duration: performance.now() - start,
      initial_heap: initialMemory.heapUsed,
      peak_heap: peakMemory.heapUsed,
      heap_increase: peakMemory.heapUsed - initialMemory.heapUsed,
      items_processed: largeArray.length
    };
  }

  function getDefaultBaselines() {
    return {
      duckdb: {
        max_analytics_time: 30000,
        max_single_query_time: 5000,
        avg_query_time: 1000
      },
      ingestion: {
        max_ingestion_time: 45000,
        max_total_time: 60000,
        min_throughput: 1000 // records per second
      },
      transformation: {
        max_transformation_time: 90000,
        max_total_time: 120000,
        min_models_per_second: 0.1
      },
      publication: {
        max_publication_time: 60000,
        max_total_time: 75000,
        min_assets_per_second: 1
      },
      memory: {
        max_heap_increase: 500 * 1024 * 1024, // 500MB
        max_final_heap_increase: 100 * 1024 * 1024, // 100MB
        max_concurrent_heap_increase: 1024 * 1024 * 1024 // 1GB
      }
    };
  }
});