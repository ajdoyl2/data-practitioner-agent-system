# Performance Metrics and Monitoring Thresholds

## Executive Summary

This document defines specific, measurable performance metrics and monitoring thresholds for all components of the Data Practitioner Agent System. These metrics ensure system reliability, optimal user experience, and early detection of performance issues.

## 1. API Performance Metrics

### Response Time Thresholds

| Endpoint | Method | Target | Warning | Critical | Timeout |
|----------|--------|--------|---------|----------|---------|
| `/api/v1/data-sources` | POST | <500ms | >2s | >5s | 30s |
| `/api/v1/data-sources` | GET | <200ms | >1s | >3s | 10s |
| `/api/v1/analysis-projects` | POST | <300ms | >1s | >3s | 10s |
| `/api/v1/hypothesis/generate` | POST | <3s | >10s | >30s | 120s |
| `/api/v1/publications/generate` | POST | <5s | >30s | >60s | 300s |

### Request Rate Limits

```yaml
rate_limits:
  global:
    requests_per_minute: 1000
    requests_per_hour: 50000
  
  per_endpoint:
    data_sources:
      POST: 100/minute
      GET: 500/minute
    hypothesis_generate:
      POST: 10/minute  # LLM rate limits
    publications_generate:
      POST: 5/minute   # Resource intensive
```

## 2. Data Processing Performance

### PyAirbyte Ingestion Metrics

| Data Source Type | Target Rate | Minimum Rate | Memory Limit | Timeout |
|-----------------|-------------|--------------|--------------|---------|
| CSV Files | 10MB/s | 1MB/s | 500MB per 1GB file | 30 min |
| JSON Files | 5MB/s | 500KB/s | 750MB per 1GB file | 45 min |
| PostgreSQL | 10K rows/s | 1K rows/s | 1GB | 60 min |
| MySQL | 8K rows/s | 800 rows/s | 1GB | 60 min |
| REST APIs | 100 req/s | 10 req/s | 500MB | 120 min |

### DuckDB Query Performance

```yaml
query_performance:
  simple_queries:  # <1M rows, no joins
    target: 100ms
    warning: 500ms
    critical: 2s
    
  analytical_queries:  # 1-10M rows, simple joins
    target: 1s
    warning: 5s
    critical: 30s
    
  complex_queries:  # >10M rows, multiple joins
    target: 10s
    warning: 30s
    critical: 2min
    
  memory_management:
    max_memory_per_query: 2GB
    spill_to_disk_threshold: 1.5GB
    warning_threshold: 1.8GB
```

### dbt Transformation Metrics

| Model Type | Target Time | Warning | Critical | Retry Limit |
|------------|------------|---------|----------|-------------|
| Source Models | <10s | >30s | >60s | 3 |
| Staging Models | <30s | >60s | >120s | 3 |
| Intermediate Models | <2min | >5min | >10min | 2 |
| Mart Models | <5min | >10min | >20min | 2 |
| Full dbt Run | <30min | >45min | >60min | 1 |

## 3. System Resource Metrics

### CPU Utilization

```yaml
cpu_thresholds:
  idle:
    target: <5%
    normal: 5-10%
  
  normal_operation:
    target: <50%
    warning: >70%
    critical: >90%
    
  data_processing:
    acceptable: <80%
    warning: >85%
    critical: >95%
    
  sustained_high:
    duration: >5 minutes at >80%
    action: scale_horizontally
```

### Memory Usage

```yaml
memory_thresholds:
  base_application:
    target: <500MB
    warning: >750MB
    critical: >1GB
    
  during_ingestion:
    target: <2GB
    warning: >3GB
    critical: >4GB
    max_allowed: 4GB
    
  during_analysis:
    target: <4GB
    warning: >6GB
    critical: >7GB
    max_allowed: 8GB
    
  garbage_collection:
    trigger_at: 85% of max
    force_at: 95% of max
```

### Disk I/O

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Read Speed | >100MB/s | <50MB/s | <20MB/s |
| Write Speed | >50MB/s | <25MB/s | <10MB/s |
| IOPS | >1000 | <500 | <200 |
| Queue Depth | <10 | >50 | >100 |

## 4. Node.js Process Metrics

```javascript
const processMetrics = {
  eventLoop: {
    lag: {
      target: '<10ms',
      warning: '>50ms',
      critical: '>100ms'
    }
  },
  
  heap: {
    used: {
      target: '<70%',
      warning: '>85%',
      critical: '>95%'
    },
    
    size: {
      max: '4GB',
      growth_rate_warning: '>100MB/hour'
    }
  },
  
  handles: {
    active: {
      target: '<1000',
      warning: '>5000',
      critical: '>10000'
    }
  }
};
```

## 5. Python Subprocess Metrics

```yaml
python_subprocess:
  startup_time:
    target: <2s
    warning: >5s
    critical: >10s
    
  memory_per_process:
    target: <500MB
    warning: >1GB
    critical: >2GB
    
  process_pool:
    size: 4
    max_queue: 100
    timeout: 300s
    
  communication:
    json_parse_time: <100ms
    max_message_size: 10MB
```

## 6. Evidence.dev Performance

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Initial Build Time | <2min | >3min | >5min |
| Incremental Build | <30s | >60s | >120s |
| Page Load Time | <1s | >2s | >5s |
| Time to Interactive | <1.5s | >3s | >5s |
| Bundle Size | <5MB | >10MB | >20MB |

## 7. Monitoring Implementation

### Health Check Endpoints

```yaml
health_checks:
  /health:
    interval: 30s
    timeout: 5s
    checks:
      - database_connectivity
      - python_subprocess_alive
      - memory_usage
      - disk_space
      
  /health/detailed:
    interval: 5min
    timeout: 30s
    checks:
      - all_basic_checks
      - query_performance_test
      - ingestion_test
      - api_response_times
```

### Logging Metrics

```javascript
// Performance logging structure
const logMetric = (category, metric, value, threshold) => {
  const status = value > threshold.critical ? 'CRITICAL' :
                 value > threshold.warning ? 'WARNING' : 'OK';
  
  logger.info({
    timestamp: new Date().toISOString(),
    category,
    metric,
    value,
    unit: threshold.unit,
    status,
    threshold_target: threshold.target,
    threshold_warning: threshold.warning,
    threshold_critical: threshold.critical
  });
};
```

## 8. Alerting Rules

### Alert Configuration

```yaml
alerts:
  # Critical Alerts (immediate action)
  api_down:
    condition: health_check_failed for 2 consecutive checks
    notification: pagerduty, email, slack
    
  memory_critical:
    condition: memory_usage > 95%
    notification: pagerduty, auto_restart
    
  query_timeout:
    condition: query_time > 5min
    notification: kill_query, email
    
  # Warning Alerts (investigation needed)
  performance_degradation:
    condition: response_time > 2x baseline for 10min
    notification: email, dashboard
    
  high_error_rate:
    condition: error_rate > 5% for 5min
    notification: slack, dashboard
    
  # Info Alerts (monitoring only)
  resource_trending:
    condition: cpu_usage increasing >10%/hour
    notification: dashboard
```

## 9. Performance Baselines

### Establishing Baselines

1. **Initial Baseline** (Week 1-2):
   - Collect metrics during normal operation
   - Calculate p50, p95, p99 for all metrics
   - Document baseline values

2. **Continuous Baseline Updates**:
   - Weekly recalculation
   - Seasonal adjustment
   - Post-deployment validation

### Regression Detection

```javascript
const detectRegression = (metric, currentValue, baseline) => {
  const degradation = ((currentValue - baseline) / baseline) * 100;
  
  if (degradation > 20) {
    return {
      severity: 'HIGH',
      message: `${metric} degraded by ${degradation.toFixed(1)}%`,
      action: 'investigate_immediately'
    };
  } else if (degradation > 10) {
    return {
      severity: 'MEDIUM',
      message: `${metric} showing degradation trend`,
      action: 'monitor_closely'
    };
  }
  
  return null;
};
```

## 10. Capacity Planning Thresholds

### Growth Projections

| Resource | Current | 3 Month | 6 Month | Action Threshold |
|----------|---------|---------|---------|------------------|
| API Requests/day | 10K | 50K | 200K | 80% of limit |
| Data Volume | 10GB | 100GB | 500GB | 70% of storage |
| Concurrent Users | 10 | 50 | 200 | 80% of capacity |
| Query Load | 100/hr | 500/hr | 2K/hr | 70% of throughput |

### Scaling Triggers

```yaml
auto_scaling:
  horizontal:
    trigger: cpu > 80% for 5min OR memory > 85%
    scale_up: add 1 instance
    scale_down: cpu < 30% for 30min
    min_instances: 1
    max_instances: 10
    
  vertical:
    trigger: consistent memory pressure
    action: increase instance size
    approval: required for >2x increase
```

---
*Created: 2025-08-09*
*Version: 1.0*
*Owner: Data Platform Team*