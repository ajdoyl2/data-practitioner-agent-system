# Performance Monitoring Strategy

## Overview
This document defines the performance monitoring integration points for the Data Practitioner Agent System expansion pack.

## Monitoring Architecture

### 1. Application Performance Monitoring (APM)

#### Node.js Process Monitoring
```javascript
// tools/lib/performance-monitor.js
const performanceMonitor = {
  // CPU and Memory usage tracking
  trackResourceUsage: () => {
    const usage = process.cpuUsage();
    const memory = process.memoryUsage();
    return {
      cpu: usage,
      memory: {
        heapUsed: memory.heapUsed / 1024 / 1024, // MB
        heapTotal: memory.heapTotal / 1024 / 1024,
        external: memory.external / 1024 / 1024,
        rss: memory.rss / 1024 / 1024
      }
    };
  },
  
  // Event loop monitoring
  trackEventLoop: () => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // ms
      if (delay > 50) {
        console.warn(`Event loop blocked for ${delay}ms`);
      }
    });
  }
};
```

#### Python Subprocess Monitoring
```python
# tools/lib/python_monitor.py
import psutil
import time
import json

class SubprocessMonitor:
    def __init__(self, pid):
        self.process = psutil.Process(pid)
        self.start_time = time.time()
    
    def get_metrics(self):
        return {
            'cpu_percent': self.process.cpu_percent(interval=0.1),
            'memory_mb': self.process.memory_info().rss / 1024 / 1024,
            'runtime_seconds': time.time() - self.start_time,
            'num_threads': self.process.num_threads()
        }
```

### 2. Data Pipeline Performance Metrics

#### PyAirbyte Ingestion Monitoring
- Records processed per second
- Data volume ingested (MB/s)
- Stream processing latency
- Cache hit/miss rates
- Error rates by connector type

#### DuckDB Query Performance
- Query execution time
- Memory usage per query
- Disk spillage frequency
- Concurrent query count
- Cache efficiency metrics

#### dbt Transformation Monitoring
- Model run times
- Test execution duration
- Incremental vs full refresh performance
- Dependency chain execution time
- Resource usage by model

#### Dagster Orchestration Metrics
- Pipeline execution duration
- Asset materialization times
- Queue depth and processing rate
- Failure/retry rates
- Resource allocation efficiency

### 3. Integration Points

#### Story 1.1.5 - Security Monitoring
```javascript
// Enhanced security-logger.js
const securityLogger = {
  logPerformanceImpact: (operation, duration, resourceUsage) => {
    if (duration > PERFORMANCE_THRESHOLD) {
      logger.warn('Security operation performance impact', {
        operation,
        duration,
        resourceUsage,
        timestamp: new Date().toISOString()
      });
    }
  }
};
```

#### Story 1.2 - PyAirbyte Performance
```javascript
// data-ingestion-service.js enhancement
class DataIngestionService {
  async ingestWithMetrics(source, options) {
    const metrics = {
      startTime: Date.now(),
      recordsProcessed: 0,
      bytesProcessed: 0
    };
    
    // Existing ingestion logic with metric collection
    const result = await this.ingest(source, options);
    
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.throughput = metrics.recordsProcessed / (metrics.duration / 1000);
    
    await this.reportMetrics(metrics);
    return result;
  }
}
```

#### Story 1.3 - DuckDB Analytics
```javascript
// analytical-engine.js enhancement
class AnalyticalEngine {
  async executeQueryWithMetrics(sql, params) {
    const queryId = generateQueryId();
    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await this.duckdb.query(sql, params);
      
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      const metrics = {
        queryId,
        duration: Number(endTime - startTime) / 1000000, // ms
        memoryDelta: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
        rowCount: result.length,
        status: 'success'
      };
      
      await this.reportQueryMetrics(metrics);
      return result;
    } catch (error) {
      // Error metric reporting
      await this.reportQueryMetrics({
        queryId,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }
}
```

### 4. Monitoring Dashboard Configuration

#### Grafana Dashboard Panels
1. **System Overview**
   - CPU usage (Node.js vs Python subprocesses)
   - Memory consumption by component
   - Event loop lag
   - Active subprocess count

2. **Data Pipeline Health**
   - Ingestion throughput (records/sec)
   - Query response times (p50, p95, p99)
   - Transformation success rates
   - Pipeline execution status

3. **Security & Compliance**
   - Authentication request rates
   - Failed auth attempts
   - Feature flag usage
   - Audit log volume

4. **Alerts Configuration**
   - CPU > 80% for 5 minutes
   - Memory > 85% sustained
   - Query time > 30 seconds
   - Pipeline failure rate > 10%
   - Authentication failure spike

### 5. Integration with Existing BMad Monitoring

#### CLI Performance Tracking
```javascript
// Enhance existing CLI with performance tracking
commander
  .command('data-ingest <source>')
  .option('--metrics', 'Enable performance metrics')
  .action(async (source, options) => {
    if (options.metrics) {
      performanceMonitor.start();
    }
    
    // Existing command logic
    
    if (options.metrics) {
      const metrics = performanceMonitor.stop();
      console.log(chalk.blue('Performance Metrics:'), metrics);
    }
  });
```

#### Web-Builder Integration
```javascript
// Enhanced web-builder.js
class WebBuilder {
  async buildWithMetrics() {
    const buildMetrics = {
      startTime: Date.now(),
      stepTimings: {}
    };
    
    // Track each build step
    for (const step of this.buildSteps) {
      const stepStart = Date.now();
      await this.executeStep(step);
      buildMetrics.stepTimings[step.name] = Date.now() - stepStart;
    }
    
    buildMetrics.totalTime = Date.now() - buildMetrics.startTime;
    await this.reportBuildMetrics(buildMetrics);
  }
}
```

### 6. Performance Baselines

#### Expected Performance Targets
- **API Response Time**: < 200ms (p95)
- **Data Ingestion**: > 10,000 records/second
- **DuckDB Queries**: < 1 second for analytical queries
- **dbt Model Runs**: < 30 seconds per model
- **Evidence.dev Builds**: < 2 minutes for full site
- **Memory Usage**: < 2GB for typical workloads

### 7. Continuous Performance Testing

#### Performance Test Suite
```javascript
// tests/performance/data-pipeline.perf.test.js
describe('Data Pipeline Performance', () => {
  test('Ingestion throughput meets target', async () => {
    const result = await ingestLargeDataset();
    expect(result.throughput).toBeGreaterThan(10000); // records/sec
  });
  
  test('Query response time within limits', async () => {
    const queries = generateTestQueries();
    const results = await Promise.all(queries.map(runQuery));
    const p95 = calculatePercentile(results, 95);
    expect(p95).toBeLessThan(1000); // ms
  });
});
```

### 8. Implementation Timeline

1. **Phase 1**: Core monitoring infrastructure (with Story 1.1.5)
2. **Phase 2**: Pipeline-specific metrics (with Stories 1.2-1.5)
3. **Phase 3**: Dashboard and alerting (with Story 1.8)
4. **Phase 4**: Continuous optimization (post-MVP)

This performance monitoring strategy ensures the Data Practitioner Agent System maintains optimal performance while providing visibility into system health and bottlenecks.