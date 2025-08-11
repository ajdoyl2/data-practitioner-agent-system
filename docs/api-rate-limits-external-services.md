# API Rate Limits for External Services

## Overview

This document defines rate limits and usage quotas for all external services integrated with the Data Practitioner Agent System. These limits ensure system stability, prevent service abuse, and manage costs effectively.

## External Service Rate Limits

### 1. PyAirbyte Source APIs

#### Database Sources

**PostgreSQL/MySQL Connections**
```yaml
postgresql:
  max_connections: 10
  queries_per_second: 100
  max_query_duration: 300s  # 5 minutes
  connection_timeout: 30s
  retry_attempts: 3
  backoff_strategy: exponential
  
mysql:
  max_connections: 8
  queries_per_second: 80
  max_query_duration: 300s
  connection_timeout: 30s
  retry_attempts: 3
  backoff_strategy: exponential
```

#### Cloud Data Warehouses

**Snowflake**
```yaml
snowflake:
  max_concurrent_queries: 5
  queries_per_minute: 60
  data_transfer_limit: 100GB/day
  warehouse_size: X-SMALL  # Default, can scale
  auto_suspend: 60s
  retry_policy:
    max_attempts: 3
    initial_delay: 1s
    max_delay: 60s
```

**BigQuery**
```yaml
bigquery:
  queries_per_day: 1000  # Free tier
  concurrent_queries: 100
  query_size_limit: 10GB
  results_size_limit: 128MB
  timeout: 6_hours
  cost_controls:
    max_bytes_billed: 1TB
    require_partition_filter: true
```

**AWS Redshift**
```yaml
redshift:
  max_connections: 50
  queries_per_cluster: 25
  query_timeout: 3600s  # 1 hour
  result_cache_ttl: 24_hours
  wlm_queue_concurrency: 5
```

#### REST API Sources

**Generic REST APIs**
```yaml
rest_api:
  default:
    requests_per_second: 10
    requests_per_minute: 100
    requests_per_hour: 5000
    retry_after_429: true
    max_retries: 3
    timeout: 30s
    
  by_provider:
    stripe:
      requests_per_second: 100
      daily_limit: 100000
    
    salesforce:
      concurrent_requests: 10
      daily_api_calls: 100000  # Developer org
      bulk_api_batches: 10000
    
    github:
      authenticated_requests_per_hour: 5000
      unauthenticated_requests_per_hour: 60
      graphql_points_per_hour: 5000
```

### 2. LLM Provider Limits

#### OpenAI
```yaml
openai:
  gpt-4:
    requests_per_minute: 200
    tokens_per_minute: 40000
    max_tokens_per_request: 8192
    timeout: 120s
    
  gpt-3.5-turbo:
    requests_per_minute: 3500
    tokens_per_minute: 90000
    max_tokens_per_request: 4096
    timeout: 60s
    
  embeddings:
    requests_per_minute: 3000
    tokens_per_minute: 1000000
    
  cost_controls:
    daily_spend_limit: $100
    monthly_spend_limit: $2000
```

#### Anthropic Claude
```yaml
anthropic:
  claude-3-opus:
    requests_per_minute: 50
    tokens_per_minute: 20000
    max_tokens_per_request: 100000
    timeout: 300s
    
  claude-3-sonnet:
    requests_per_minute: 100
    tokens_per_minute: 40000
    max_tokens_per_request: 100000
    timeout: 120s
    
  cost_controls:
    daily_token_limit: 1000000
    concurrent_requests: 10
```

#### Google AI (Vertex AI)
```yaml
google_ai:
  gemini-pro:
    requests_per_minute: 60
    tokens_per_minute: 60000
    max_input_tokens: 30720
    max_output_tokens: 2048
    
  palm-2:
    requests_per_minute: 300
    tokens_per_minute: 30000
    
  quotas:
    daily_prediction_requests: 20000
    online_prediction_qps: 100
```

### 3. Cloud Storage Services

#### AWS S3
```yaml
s3:
  requests:
    put_requests_per_second: 3500
    get_requests_per_second: 5500
    list_requests_per_second: 1000
    
  bandwidth:
    upload_bandwidth: 10Gbps
    download_bandwidth: 10Gbps
    
  multipart:
    max_parts: 10000
    min_part_size: 5MB
    max_object_size: 5TB
```

#### Google Cloud Storage
```yaml
gcs:
  operations_per_second: 5000
  bandwidth_per_project: 200Gbps
  
  per_bucket_limits:
    writes_per_second: 1000
    reads_per_second: 5000
    
  resumable_uploads:
    chunk_size: 8MB
    max_chunks: 32
```

### 4. Monitoring & Logging Services

#### Datadog
```yaml
datadog:
  metrics:
    points_per_minute: 1000
    unique_metrics: 1000
    
  logs:
    events_per_minute: 10000
    max_event_size: 256KB
    
  api:
    requests_per_hour: 1000
    rate_limit_reset: hourly
```

## Internal API Rate Limits

### Data Practitioner System APIs

```yaml
internal_apis:
  /api/v1/data-sources:
    POST:
      requests_per_minute: 100
      requests_per_hour: 2000
      concurrent_requests: 10
      
  /api/v1/analysis-projects:
    POST:
      requests_per_minute: 50
      requests_per_hour: 1000
      concurrent_requests: 5
      
  /api/v1/hypothesis/generate:
    POST:
      requests_per_minute: 10  # LLM dependent
      requests_per_hour: 200
      concurrent_requests: 2
      
  /api/v1/publications/generate:
    POST:
      requests_per_minute: 5
      requests_per_hour: 50
      concurrent_requests: 1
```

## Rate Limiting Implementation

### Node.js Rate Limiter

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Create limiters for different endpoints
const createLimiter = (config) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: config.prefix
    }),
    windowMs: config.window,
    max: config.limit,
    message: config.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        retryAfter: res.getHeader('Retry-After')
      });
    }
  });
};

// Apply different limits to different endpoints
app.use('/api/v1/data-sources', createLimiter({
  prefix: 'data-sources',
  window: 60 * 1000, // 1 minute
  limit: 100,
  message: 'Data source creation limit exceeded'
}));

app.use('/api/v1/hypothesis/generate', createLimiter({
  prefix: 'hypothesis',
  window: 60 * 1000,
  limit: 10,
  message: 'LLM rate limit exceeded, please wait'
}));
```

### Python Rate Limiter

```python
import time
from functools import wraps
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.calls = defaultdict(list)
    
    def limit(self, max_calls, window_seconds):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                now = time.time()
                key = func.__name__
                
                # Clean old calls
                self.calls[key] = [
                    call_time for call_time in self.calls[key]
                    if now - call_time < window_seconds
                ]
                
                # Check rate limit
                if len(self.calls[key]) >= max_calls:
                    wait_time = window_seconds - (now - self.calls[key][0])
                    raise RateLimitError(f"Rate limit exceeded. Wait {wait_time:.1f}s")
                
                # Record call
                self.calls[key].append(now)
                
                return func(*args, **kwargs)
            return wrapper
        return decorator

rate_limiter = RateLimiter()

# Usage
@rate_limiter.limit(max_calls=100, window_seconds=60)
def query_database(sql):
    # Database query logic
    pass
```

## Retry Strategies

### Exponential Backoff

```javascript
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    factor = 2
  } = options;
  
  let attempt = 0;
  let delay = initialDelay;
  
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      // Check if it's a rate limit error
      if (error.status === 429 && error.retryAfter) {
        delay = error.retryAfter * 1000;
      } else {
        delay = Math.min(delay * factor, maxDelay);
      }
      
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Cost Management

### Usage Tracking

```javascript
class UsageTracker {
  constructor() {
    this.usage = new Map();
  }
  
  track(service, metric, value) {
    const key = `${service}:${metric}`;
    const current = this.usage.get(key) || { count: 0, cost: 0 };
    
    current.count += value;
    current.cost = this.calculateCost(service, metric, current.count);
    
    this.usage.set(key, current);
    
    // Alert if approaching limits
    this.checkLimits(service, metric, current);
  }
  
  calculateCost(service, metric, count) {
    const rates = {
      'openai:tokens': 0.03 / 1000,  // $0.03 per 1K tokens
      'bigquery:bytes': 5.00 / 1e12,  // $5 per TB
      'snowflake:credits': 2.00,      // $2 per credit
    };
    
    const rate = rates[`${service}:${metric}`] || 0;
    return count * rate;
  }
  
  checkLimits(service, metric, usage) {
    const limits = {
      'openai:tokens': { daily: 1000000, monthly: 30000000 },
      'bigquery:bytes': { daily: 1e12, monthly: 30e12 },
    };
    
    const limit = limits[`${service}:${metric}`];
    if (limit && usage.count > limit.daily * 0.8) {
      console.warn(`Warning: Approaching daily limit for ${service}:${metric}`);
    }
  }
}
```

## Monitoring and Alerts

### Rate Limit Monitoring

```yaml
monitoring:
  metrics:
    - name: rate_limit_hits
      type: counter
      labels: [endpoint, limit_type]
      
    - name: rate_limit_remaining
      type: gauge
      labels: [endpoint, window]
      
    - name: external_api_calls
      type: counter
      labels: [service, endpoint, status]
      
  alerts:
    - name: HighRateLimitHits
      condition: rate(rate_limit_hits[5m]) > 10
      severity: warning
      message: "High rate limit hits on {{ $labels.endpoint }}"
      
    - name: ExternalAPIQuotaApproaching
      condition: external_api_quota_used > 0.8
      severity: warning
      message: "{{ $labels.service }} quota at {{ $value }}%"
      
    - name: CostThresholdExceeded
      condition: daily_api_cost > 100
      severity: critical
      message: "Daily API cost exceeded $100: ${{ $value }}"
```

## Best Practices

1. **Always implement retry logic** with exponential backoff
2. **Cache responses** when possible to reduce API calls
3. **Batch requests** to optimize rate limit usage
4. **Monitor usage** proactively to avoid surprises
5. **Set cost alerts** to prevent bill shock
6. **Use webhooks** instead of polling when available
7. **Implement circuit breakers** for failing services
8. **Document rate limits** in API responses
9. **Provide rate limit headers** in responses
10. **Plan for rate limit increases** as you scale

---
*Created: 2025-08-09*
*Version: 1.0*
*Review: Quarterly*