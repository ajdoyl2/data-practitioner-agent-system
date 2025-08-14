# DuckDB Performance Benchmarks and Baseline Metrics

## Overview

This document establishes baseline performance metrics for DuckDB operations across various dataset sizes and query types within the BMad-Method data practitioner expansion pack. These benchmarks help establish performance expectations and regression detection thresholds.

## Baseline Performance Metrics

### Dataset Size Classifications

| Size Category | Range | Memory Strategy | Expected Use Case |
|---------------|-------|----------------|-------------------|
| Small | 1KB - 1MB | In-memory | Configuration files, small lookups |
| Medium | 1MB - 100MB | In-memory | User data, small analytics |
| Large | 100MB - 1GB | Memory + spilling | Department analytics |
| Very Large | 1GB - 10GB | Spilling primary | Enterprise analytics |
| Massive | 10GB+ | Streaming/partitioned | Big data processing |

### Performance Baselines by Dataset Size

#### Small Datasets (1KB - 1MB)
```yaml
baseline_metrics:
  load_time: "< 50ms"
  simple_select: "< 10ms"
  aggregation: "< 25ms"
  join_operations: "< 50ms"
  memory_usage: "< 50MB"
  cpu_usage: "< 10%"
```

**Example Operations:**
- `SELECT * FROM config_table` (1000 rows): ~5ms
- `SELECT COUNT(*) FROM small_data` (10K rows): ~8ms
- `SELECT category, AVG(value) FROM small_data GROUP BY category`: ~15ms

#### Medium Datasets (1MB - 100MB)
```yaml
baseline_metrics:
  load_time: "< 500ms"
  simple_select: "< 100ms"
  aggregation: "< 250ms"
  join_operations: "< 1s"
  memory_usage: "< 200MB"
  cpu_usage: "< 25%"
```

**Example Operations:**
- `SELECT * FROM sales_data LIMIT 1000` (1M rows): ~80ms
- `SELECT SUM(amount) FROM transactions` (500K rows): ~150ms
- `SELECT p.name, SUM(o.amount) FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.name`: ~800ms

#### Large Datasets (100MB - 1GB)
```yaml
baseline_metrics:
  load_time: "< 5s"
  simple_select: "< 500ms"
  aggregation: "< 2s"
  join_operations: "< 10s"
  memory_usage: "< 2GB"
  cpu_usage: "< 50%"
  spill_activity: "minimal"
```

**Example Operations:**
- CSV load of 10M rows: ~3.5s
- `SELECT * FROM large_table WHERE date > '2024-01-01'` (filtering 2M rows): ~400ms
- Complex aggregation with multiple GROUP BY: ~1.8s

#### Very Large Datasets (1GB - 10GB)
```yaml
baseline_metrics:
  load_time: "< 30s"
  simple_select: "< 2s"
  aggregation: "< 15s"
  join_operations: "< 60s"
  memory_usage: "4GB - 8GB"
  cpu_usage: "< 80%"
  spill_activity: "expected"
```

**Example Operations:**
- Parquet load of 100M rows: ~25s
- Range scan with aggregation: ~12s
- Multi-table join (50M + 10M rows): ~45s

#### Massive Datasets (10GB+)
```yaml
baseline_metrics:
  load_time: "streaming"
  simple_select: "< 10s"
  aggregation: "< 60s"
  join_operations: "< 300s"
  memory_usage: "8GB - 16GB"
  cpu_usage: "< 90%"
  spill_activity: "heavy"
```

**Note:** For massive datasets, operations should use streaming/chunked processing.

## Query Performance Patterns by Data Type

### Numeric Operations
```yaml
integer_operations:
  sum_aggregation:
    performance_factor: 1.0  # baseline
    memory_multiplier: 1.0
    example_query: "SELECT SUM(amount) FROM transactions"
  
  avg_aggregation:
    performance_factor: 1.2
    memory_multiplier: 1.1
    example_query: "SELECT AVG(price) FROM products"
  
  mathematical_operations:
    performance_factor: 1.5
    memory_multiplier: 1.2
    example_query: "SELECT amount * 1.08 as total FROM transactions"

floating_point_operations:
  statistical_functions:
    performance_factor: 2.0
    memory_multiplier: 1.5
    example_query: "SELECT STDDEV(amount), VARIANCE(amount) FROM data"
  
  complex_math:
    performance_factor: 3.0
    memory_multiplier: 2.0
    example_query: "SELECT LOG(amount), SQRT(amount) FROM data"
```

### String Operations
```yaml
string_operations:
  pattern_matching:
    performance_factor: 3.0
    memory_multiplier: 1.5
    example_query: "SELECT * FROM customers WHERE name LIKE '%smith%'"
  
  string_aggregation:
    performance_factor: 4.0
    memory_multiplier: 2.5
    example_query: "SELECT GROUP_CONCAT(name) FROM customers GROUP BY city"
  
  text_functions:
    performance_factor: 2.5
    memory_multiplier: 1.8
    example_query: "SELECT UPPER(name), LENGTH(description) FROM products"
```

### Date/Time Operations
```yaml
datetime_operations:
  date_filtering:
    performance_factor: 1.5
    memory_multiplier: 1.2
    example_query: "SELECT * FROM orders WHERE order_date > '2024-01-01'"
  
  date_extraction:
    performance_factor: 2.0
    memory_multiplier: 1.3
    example_query: "SELECT EXTRACT(MONTH FROM order_date) FROM orders"
  
  date_arithmetic:
    performance_factor: 2.5
    memory_multiplier: 1.5
    example_query: "SELECT order_date + INTERVAL 30 DAY FROM orders"
```

### JSON Operations
```yaml
json_operations:
  json_extraction:
    performance_factor: 5.0
    memory_multiplier: 3.0
    example_query: "SELECT json_extract(data, '$.customer.name') FROM events"
  
  json_aggregation:
    performance_factor: 8.0
    memory_multiplier: 4.0
    example_query: "SELECT json_group_array(data) FROM events GROUP BY type"
```

## Benchmark Test Datasets and Procedures

### Standard Test Datasets

#### 1. Synthetic Transaction Data
```javascript
// Generate synthetic transaction data for benchmarking
function generateTransactionData(rowCount) {
  const data = [];
  const startDate = new Date('2023-01-01');
  
  for (let i = 0; i < rowCount; i++) {
    data.push({
      id: i + 1,
      transaction_date: new Date(startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      amount: Math.round((Math.random() * 1000 + 10) * 100) / 100,
      category: ['groceries', 'entertainment', 'utilities', 'transport'][Math.floor(Math.random() * 4)],
      merchant_id: Math.floor(Math.random() * 1000) + 1,
      customer_id: Math.floor(Math.random() * 10000) + 1,
      status: Math.random() > 0.1 ? 'completed' : 'pending'
    });
  }
  
  return data;
}

// Dataset configurations
const datasets = {
  small: { rows: 1000, expected_size: '~100KB' },
  medium: { rows: 100000, expected_size: '~10MB' },
  large: { rows: 1000000, expected_size: '~100MB' },
  very_large: { rows: 10000000, expected_size: '~1GB' }
};
```

#### 2. E-commerce Analytics Dataset
```sql
-- Schema for e-commerce benchmark data
CREATE TABLE customers (
  customer_id INTEGER,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  registration_date DATE,
  country VARCHAR,
  segment VARCHAR -- 'premium', 'standard', 'basic'
);

CREATE TABLE products (
  product_id INTEGER,
  name VARCHAR,
  category VARCHAR,
  subcategory VARCHAR,
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  brand VARCHAR,
  weight_kg DECIMAL(5,2)
);

CREATE TABLE orders (
  order_id INTEGER,
  customer_id INTEGER,
  order_date TIMESTAMP,
  total_amount DECIMAL(10,2),
  status VARCHAR,
  shipping_cost DECIMAL(5,2),
  tax_amount DECIMAL(8,2)
);

CREATE TABLE order_items (
  order_item_id INTEGER,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  discount_amount DECIMAL(8,2)
);
```

### Benchmark Procedures

#### 1. Load Performance Benchmark
```javascript
async function benchmarkLoadPerformance(duckdb, dataset) {
  const startTime = Date.now();
  
  try {
    // Load data from file
    const result = await duckdb.loadDataFromFile(
      dataset.format,
      dataset.file_path,
      dataset.table_name,
      dataset.options
    );
    
    const loadTime = Date.now() - startTime;
    
    return {
      dataset_size: dataset.size,
      row_count: result.rows_affected,
      load_time_ms: loadTime,
      load_rate_rows_per_sec: Math.round(result.rows_affected / (loadTime / 1000)),
      memory_usage: await getMemoryUsage(duckdb)
    };
  } catch (error) {
    return {
      dataset_size: dataset.size,
      error: error.message,
      load_time_ms: Date.now() - startTime
    };
  }
}
```

#### 2. Query Performance Benchmark
```javascript
async function benchmarkQueryPerformance(duckdb, querySet) {
  const results = [];
  
  for (const query of querySet) {
    const startTime = Date.now();
    const memoryBefore = await getMemoryUsage(duckdb);
    
    try {
      const result = await duckdb.execute(query.sql, query.params);
      const executionTime = Date.now() - startTime;
      const memoryAfter = await getMemoryUsage(duckdb);
      
      results.push({
        query_name: query.name,
        query_type: query.type,
        execution_time_ms: executionTime,
        row_count: result.data.length,
        memory_delta_mb: (memoryAfter.memory_usage - memoryBefore.memory_usage) / 1024 / 1024,
        success: true
      });
    } catch (error) {
      results.push({
        query_name: query.name,
        query_type: query.type,
        execution_time_ms: Date.now() - startTime,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}
```

#### 3. Memory Stress Test
```javascript
async function memoryStressTest(duckdb, maxMemoryGB = 4) {
  const results = [];
  let currentDataSize = 1000; // Start with 1K rows
  
  while (currentDataSize <= 10000000) { // Up to 10M rows
    const testData = generateTransactionData(currentDataSize);
    const startTime = Date.now();
    
    try {
      // Create temporary table
      await duckdb.execute(`DROP TABLE IF EXISTS stress_test_${currentDataSize}`);
      
      // Load data and measure performance
      const loadResult = await loadTestData(duckdb, testData, `stress_test_${currentDataSize}`);
      const memoryUsage = await getMemoryUsage(duckdb);
      
      // Perform standard queries
      const queryResults = await benchmarkStandardQueries(duckdb, `stress_test_${currentDataSize}`);
      
      results.push({
        row_count: currentDataSize,
        load_time_ms: loadResult.load_time,
        memory_usage_mb: memoryUsage.memory_usage / 1024 / 1024,
        memory_percent: memoryUsage.memory_percent,
        spill_detected: memoryUsage.memory_percent > 80,
        query_performance: queryResults,
        success: true
      });
      
      // Clean up
      await duckdb.execute(`DROP TABLE stress_test_${currentDataSize}`);
      
    } catch (error) {
      results.push({
        row_count: currentDataSize,
        error: error.message,
        success: false
      });
      
      // If we hit memory limits, stop the test
      if (error.message.includes('memory')) {
        break;
      }
    }
    
    currentDataSize *= 2; // Double the data size
  }
  
  return results;
}
```

## Resource Usage Documentation

### Expected Memory Usage Patterns

#### By Operation Type
```yaml
memory_patterns:
  simple_select:
    baseline: "10MB + (row_count * 100 bytes)"
    spill_threshold: "never"
    description: "Linear memory usage based on result set size"
  
  aggregation:
    baseline: "50MB + (group_count * 1KB)"
    spill_threshold: "10M+ groups"
    description: "Memory usage depends on number of groups, not input size"
  
  sort_operations:
    baseline: "input_size * 1.5"
    spill_threshold: "when input_size > 50% memory_limit"
    description: "Requires temporary storage, spills automatically"
  
  joins:
    baseline: "smaller_table_size * 2 + larger_table_size * 0.1"
    spill_threshold: "when smaller_table > 25% memory_limit"
    description: "Builds hash table from smaller table"
  
  window_functions:
    baseline: "partition_size * 1.2"
    spill_threshold: "when partition_size > 40% memory_limit"
    description: "Memory usage per partition"
```

#### By Data Type
```yaml
data_type_overhead:
  integer: "8 bytes per value"
  bigint: "8 bytes per value"
  decimal: "16 bytes per value"
  varchar: "length + 8 bytes per value"
  date: "4 bytes per value"
  timestamp: "8 bytes per value"
  json: "length * 1.5 + 16 bytes per value"
  boolean: "1 byte per value"
```

### CPU Usage Patterns

```yaml
cpu_usage:
  data_loading:
    csv: "Medium CPU usage, I/O bound"
    json: "High CPU usage, parsing intensive"
    parquet: "Low CPU usage, optimized format"
  
  query_operations:
    filtering: "Low CPU usage"
    aggregation: "Medium CPU usage"
    sorting: "Medium-High CPU usage"
    joins: "High CPU usage"
    window_functions: "High CPU usage"
    text_operations: "Very High CPU usage"
```

## Performance Regression Detection Thresholds

### Warning Thresholds (Performance Degradation)
```yaml
warning_thresholds:
  execution_time:
    simple_queries: "+25% from baseline"
    complex_queries: "+50% from baseline"
    data_loading: "+30% from baseline"
  
  memory_usage:
    baseline_increase: "+40% from baseline"
    spill_activity: "spilling when not expected"
  
  throughput:
    rows_per_second: "-20% from baseline"
    queries_per_second: "-25% from baseline"
```

### Critical Thresholds (Immediate Investigation Required)
```yaml
critical_thresholds:
  execution_time:
    simple_queries: "+100% from baseline"
    complex_queries: "+150% from baseline"
    timeout_rate: ">5% of queries timing out"
  
  memory_usage:
    out_of_memory: ">1% of operations failing with OOM"
    excessive_spilling: "spill size > 2x memory limit"
  
  error_rates:
    query_failures: ">2% failure rate"
    connection_failures: ">1% failure rate"
```

### Automated Monitoring Configuration
```javascript
const performanceMonitor = {
  // Baseline metrics storage
  baselines: new Map(),
  
  // Track performance metrics
  trackMetric(operation, metric, value) {
    if (!this.baselines.has(operation)) {
      this.baselines.set(operation, {});
    }
    
    const baseline = this.baselines.get(operation);
    if (!baseline[metric]) {
      baseline[metric] = { values: [], average: 0, count: 0 };
    }
    
    baseline[metric].values.push(value);
    baseline[metric].count++;
    baseline[metric].average = baseline[metric].values.reduce((a, b) => a + b, 0) / baseline[metric].count;
    
    // Keep only last 100 measurements
    if (baseline[metric].values.length > 100) {
      baseline[metric].values.shift();
    }
  },
  
  // Check for performance regression
  checkRegression(operation, metric, currentValue) {
    const baseline = this.baselines.get(operation)?.[metric];
    if (!baseline || baseline.count < 10) {
      return { status: 'insufficient_data' };
    }
    
    const deviation = (currentValue - baseline.average) / baseline.average;
    
    if (deviation > 1.0) { // 100% increase
      return { status: 'critical', deviation: deviation * 100 };
    } else if (deviation > 0.5) { // 50% increase
      return { status: 'warning', deviation: deviation * 100 };
    }
    
    return { status: 'normal', deviation: deviation * 100 };
  }
};
```

## Benchmark Execution Schedule

### Daily Benchmarks
- Load performance with standard datasets
- Core query performance tests
- Memory usage validation

### Weekly Benchmarks
- Full stress test suite
- Performance regression analysis
- Resource utilization trends

### Monthly Benchmarks
- Comprehensive benchmark suite
- Performance baseline updates
- Capacity planning analysis

## Next Steps

1. **Resource Usage Thresholds** - Define memory usage monitoring and alerting
2. **Dataset Partitioning Strategies** - Document approaches for larger-than-memory datasets
3. **Monitoring Configuration** - Set up resource usage tracking
4. **Fallback Procedures** - Establish procedures for memory exhaustion scenarios

## References

- [DuckDB Performance Guide](https://duckdb.org/docs/guides/performance)
- [DuckDB Memory Management](./duckdb-memory-management.md)
- [BMad-Method Testing Strategy](../architecture/testing-strategy.md)